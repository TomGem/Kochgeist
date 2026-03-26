import { t, type Locale } from './i18n/index';

function parseCookTimeMinutes(cookTime: string): number {
  let total = 0;
  const hours = cookTime.match(/(\d+)\s*h/i);
  const minutes = cookTime.match(/(\d+)\s*m/i);
  if (hours) total += parseInt(hours[1], 10) * 60;
  if (minutes) total += parseInt(minutes[1], 10);
  return total || 45; // default if unparseable
}

export function computeDetailBadge(
  recipe: { cookTime: string; difficulty: string; extraIngredients?: string | null },
  lang: Locale,
): string {
  const extraCount = recipe.extraIngredients ? JSON.parse(recipe.extraIngredients).length : 0;
  const minutes = parseCookTimeMinutes(recipe.cookTime);

  if (extraCount === 0) return t('badges.pantryPerfect', lang);
  if (minutes <= 30 && recipe.difficulty === 'Easy') return t('badges.quickEasy', lang);
  if (recipe.difficulty === 'Hard') return t('badges.chefChallenge', lang);
  return t('badges.homemade', lang);
}
