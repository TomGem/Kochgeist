import { defineMiddleware } from 'astro:middleware';
import { detectLocale } from '../lib/i18n/index';

export const onRequest = defineMiddleware((context, next) => {
  const lang = detectLocale(context.request);
  context.locals.lang = lang;
  return next();
});
