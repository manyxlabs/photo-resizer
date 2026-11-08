import bn from './bn';
import en, { type Messages } from './en';
import gu from './gu';
import hi from './hi';
import kn from './kn';
import { intlTag, LOCALES, localePath, parsePath, type Locale } from './locales';
import ml from './ml';
import mr from './mr';
import ta from './ta';
import te from './te';

export const catalogues: Record<Locale, Messages> = { en, hi, bn, mr, te, ta, gu, kn, ml };

// The types make every language have every key; this makes each string keep English's {placeholders},
// and each list English's length, so a slip in a translation fails the build rather than a page.
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
function sameShape(a: unknown, b: unknown, at: string) {
  if (typeof a === 'string') {
    if (holes(a) !== holes(b as string)) throw new Error(`${at} has {${holes(b as string)}} where English has {${holes(a)}}`);
  } else if (Array.isArray(a)) {
    if (a.length !== (b as unknown[]).length) throw new Error(`${at} has ${(b as unknown[]).length} items where English has ${a.length}`);
    a.forEach((x, i) => sameShape(x, (b as unknown[])[i], `${at}[${i}]`));
  } else for (const [k, v] of Object.entries(a as object)) sameShape(v, (b as Record<string, unknown>)[k], `${at}.${k}`);
}
for (const locale of LOCALES) sameShape(en, catalogues[locale], locale);

/** The language of the page at `url`, its copy, and its links. */
export function pageLocale(url: URL) {
  const { locale, path } = parsePath(url.pathname);
  return { locale, path, t: catalogues[locale], href: (to: string) => localePath(locale, to) };
}

/** "a, b, and c" in the page's language; en-IN would drop the serial comma the English copy uses. */
export const listOf = (locale: Locale, words: Iterable<string>) =>
  new Intl.ListFormat(locale === 'en' ? 'en' : intlTag(locale)).format(words);
