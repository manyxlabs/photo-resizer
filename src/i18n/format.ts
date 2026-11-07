// Fills a catalogue string's {placeholders}. Safe to import from client scripts: it holds no copy.

export type Plural = { one: string; other: string };
type Vars = Record<string, string | number>;

export function fmt(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in vars)) throw new Error(`No value for {${key}} in "${template}"`);
    return String(vars[key]);
  });
}

/** `forms` picked by the language's plural rules, with the count as {n}. */
export const plural = (lang: string, n: number, forms: Plural, vars: Vars = {}) =>
  fmt(new Intl.PluralRules(lang).select(n) === 'one' ? forms.one : forms.other, { ...vars, n });

/** Closer to the length a reader (or a search result) sees than code units: a Devanagari conjunct is one. */
export const graphemes = (s: string) => [...new Intl.Segmenter().segment(s)].length;
