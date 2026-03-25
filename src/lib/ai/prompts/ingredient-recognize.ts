import type { Locale } from '../../i18n/index';

const langName: Record<string, string> = {
  en: 'English',
  de: 'German',
};

export function buildIngredientRecognitionPrompt(language: Locale): string {
  return `You identify food ingredients in images. Look carefully at the image and list every food ingredient you can identify.

Rules:
- Return ONLY a JSON array of ingredient name strings.
- Use ${langName[language]} for all ingredient names.
- Be specific (e.g., "cherry tomatoes" not just "tomatoes").
- Only include food items, not packaging, utensils, or surfaces.
- No explanation, no markdown, just the JSON array.`;
}
