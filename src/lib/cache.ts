import { createHash } from 'crypto';
import { normalizeIngredients } from './ingredients';

export function computeIngredientHash(
  ingredients: string[],
  language: string,
  filters: string[],
  provider: string,
  model: string,
): string {
  const normalized = normalizeIngredients(ingredients);
  const raw = normalized.join('|') + '::' + language + '::' + filters.sort().join(',') + '::' + provider + '::' + model;
  return createHash('sha256').update(raw).digest('hex');
}
