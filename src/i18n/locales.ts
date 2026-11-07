// Every page is published in each of these. English keeps the unprefixed URLs it always had;
// every other language mirrors them under /<code>/. The website (manyxlabs/website) keeps a copy
// of this file, and its Worker forwards each prefix's tool paths here, so change both together.
export const LOCALES = ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'kn', 'ml'] as const;
export type Locale = (typeof LOCALES)[number];

/** Each language in its own script, as the language menu lists it. */
export const NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  mr: 'मराठी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
};

/** For Intl: Indian conventions, but with the digits 0-9 that apps use even where a language has its own. */
export const intlTag = (locale: Locale) => `${locale}-IN-u-nu-latn`;

export const localePath = (locale: Locale, path: string) => (locale === 'en' ? path : `/${locale}${path}`);

/** The language a path is in, and the path English has for the same page. */
export function parsePath(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split('/');
  const locale = LOCALES.find((l) => l !== 'en' && l === first);
  return locale ? { locale, path: `/${rest.join('/')}` } : { locale: 'en', path: pathname };
}

/** The `lang` param of a `[...lang]` route in each language: none for English. */
export const LANG_PARAMS = LOCALES.map((locale) => (locale === 'en' ? undefined : locale));
