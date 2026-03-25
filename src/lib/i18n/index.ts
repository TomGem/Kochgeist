import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

export type Locale = 'en' | 'de' | 'fr' | 'it' | 'es' | 'pt';

const locales: Record<Locale, Record<string, any>> = { en, de, fr, it, es, pt };

const allLocales = Object.keys(locales) as Locale[];

export function t(key: string, locale: Locale = 'en'): string {
  const parts = key.split('.');
  let value: any = locales[locale];
  for (const part of parts) {
    value = value?.[part];
  }
  return typeof value === 'string' ? value : key;
}

export function detectLocale(request: Request): Locale {
  // 1. URL query param
  const url = new URL(request.url);
  const langParam = url.searchParams.get('lang');
  if (langParam && allLocales.includes(langParam as Locale)) return langParam as Locale;

  // 2. Cookie
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/kochgeist-lang=(\w+)/);
  if (match && allLocales.includes(match[1] as Locale)) return match[1] as Locale;

  // 3. Accept-Language header
  const acceptLang = request.headers.get('accept-language')?.toLowerCase() || '';
  for (const locale of allLocales) {
    if (locale !== 'en' && acceptLang.includes(locale)) return locale;
  }

  return 'en';
}
