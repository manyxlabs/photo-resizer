import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type APIRequestContext } from '@playwright/test';

const ARTIFACTS = 'test-results/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });

const SITE = 'https://www.manyxlabs.com';
// The website serves every other path; links there are its own suite's to check.
const OURS = /^\/(tools|photo-size)(\/|$)/;

const meta = (html: string, attr: string, key: string) =>
  new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`).exec(html)?.[1];
const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

async function locs(request: APIRequestContext, path: string): Promise<string[]> {
  const res = await request.get(path);
  expect(res.ok(), path).toBe(true);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
}

test('every page is in the sitemap, reachable, and described for search and sharing', async ({ request }) => {
  const sitemap = (await Promise.all((await locs(request, '/sitemap-resizer-index.xml')).map((p) => locs(request, p)))).flat();

  // Crawl from the hub, so a page no link reaches fails as surely as one the sitemap leaves out.
  const seen = new Map<string, string>();
  const queue = ['/tools/', '/photo-size/'];
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    const res = await request.get(path);
    expect(res.status(), `${path} is linked but answers ${res.status()}`).toBe(200);
    const html = await res.text();
    seen.set(path, html);
    for (const [, href] of html.matchAll(/<a [^>]*href="([^"#?]+)[^"]*"/g)) if (OURS.test(href!)) queue.push(href!);
  }
  expect([...seen.keys()].sort()).toEqual([...sitemap].sort());

  const report = [];
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const images = new Set<string>();
  for (const [path, html] of seen) {
    const title = text(/<title>(.*?)<\/title>/.exec(html)![1]!);
    const description = meta(html, 'name', 'description')!;
    expect(title.length, `${path} title`).toBeLessThanOrEqual(60);
    expect(description.length, `${path} description`).toBeGreaterThanOrEqual(100);
    expect(description.length, `${path} description`).toBeLessThanOrEqual(160);
    expect(titles.has(title), `${path} repeats the title "${title}"`).toBe(false);
    expect(descriptions.has(description), `${path} repeats its description`).toBe(false);
    titles.add(title);
    descriptions.add(description);

    expect(/<link rel="canonical" href="([^"]+)"/.exec(html)?.[1], path).toBe(SITE + path);
    expect(meta(html, 'property', 'og:url'), path).toBe(SITE + path);
    expect(html.match(/<h1[\s>]/g), `${path} has one h1`).toHaveLength(1);
    expect(html, `${path} uses an em dash`).not.toContain('—');
    expect(html, path).not.toContain('name="robots"');

    const image = meta(html, 'property', 'og:image')!;
    expect(image.startsWith(`${SITE}/_resizer/og/`), path).toBe(true);
    images.add(new URL(image).pathname);

    const schema = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));
    for (const o of schema) expect(o['@context'], path).toBe('https://schema.org');
    const types = schema.map((o) => o['@type']);
    const crumbs = schema.find((o) => o['@type'] === 'BreadcrumbList')!.itemListElement;
    expect(crumbs.at(-1).item, `${path} breadcrumb ends on itself`).toBe(SITE + path);
    const app = schema.find((o) => o['@type'] === 'WebApplication');
    if (path.startsWith('/tools/') && path !== '/tools/') {
      expect(app?.offers, path).toEqual({ '@type': 'Offer', price: '0', priceCurrency: 'INR' });
      expect(app.url, path).toBe(SITE + path);
    }
    // Rich results may only mark up what the page shows.
    const summaries = new Set([...html.matchAll(/<summary[^>]*>(.*?)<\/summary>/g)].map((m) => text(m[1]!)));
    for (const q of schema.find((o) => o['@type'] === 'FAQPage')?.mainEntity ?? []) expect(summaries, `${path} hides "${q.name}"`).toContain(q.name);
    for (const step of schema.find((o) => o['@type'] === 'HowTo')?.step ?? []) {
      const id = new URL(step.url).hash.slice(1);
      expect(text(new RegExp(`<li id="${id}"[^>]*>(.*?)</li>`).exec(html)?.[1] ?? ''), `${path} shows step ${id}`).toBe(`${step.name}. ${step.text}`);
    }
    report.push({ path, title, description, image, types });
  }

  // A share card is fetched by other sites, so it must be the size they crop to.
  for (const path of images) {
    const res = await request.get(path);
    expect(res.headers()['content-type'], path).toBe('image/png');
    const png = await res.body();
    expect([png.readUInt32BE(16), png.readUInt32BE(20)], path).toEqual([1200, 630]);
  }

  writeFileSync(`${ARTIFACTS}/seo-report.json`, JSON.stringify(report, null, 2));
});

test('a missing page answers 404 and is kept out of search', async ({ request }) => {
  for (const path of ['/tools/no-such-tool/', '/photo-size/no-such-exam/', '/tools/photo-resizer/7-kb/']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(404);
    const html = await res.text();
    expect(html, path).toContain('<meta name="robots" content="noindex">');
    expect(html, path).not.toContain('rel="canonical"');
    expect(html, path).toContain('href="/tools/"');
  }
});
