import en from './locales/en.json';
import de from './locales/de.json';

export type Locale = 'en' | 'de';

const locales: Record<Locale, Record<string, any>> = { en, de };

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
  if (langParam === 'de' || langParam === 'en') return langParam;

  // 2. Cookie
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/kochgeist-lang=(en|de)/);
  if (match) return match[1] as Locale;

  // 3. Accept-Language header
  const acceptLang = request.headers.get('accept-language') || '';
  if (acceptLang.toLowerCase().includes('de')) return 'de';

  return 'en';
}
