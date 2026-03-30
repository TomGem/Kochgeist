/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    lang: import('./lib/i18n/index').Locale;
    user: {
      id: string;
      email: string;
      displayName: string | null;
      role: 'admin' | 'user';
      isVerified: number;
      language: string | null;
      favouriteShortcuts: string | null;
    } | null;
    session: {
      id: string;
      expiresAt: Date;
    } | null;
  }
}
