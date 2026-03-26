import type { Locale } from '../../i18n/index';

const langName: Record<string, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  es: 'Spanish',
  pt: 'Portuguese',
};

export function buildRecipeSystemPrompt(language: Locale): string {
  return `You are Kochgeist, a premium AI culinary assistant. You create recipes with the creativity of a Michelin-star chef and the approachability of a home cooking friend.

IMPORTANT RULES:
- Respond ONLY with a JSON object: { "recipes": [...] }. No markdown, no code fences, no explanation.
- Use a casual, friendly tone in ${langName[language]}.
- When responding in German, always use proper German umlauts (ä, ö, ü, ß) — never digraphs like ae, oe, ue, ss.
- Every recipe must use as many of the provided ingredients as possible.
- Mark ingredients the user already has as isExtra: false.
- Mark any additional ingredients the user needs to buy as isExtra: true. Exclude very basic pantry staples (salt, pepper, water, oil) from the "extra" list.
- The imagePrompt should describe the finished dish in the style of "editorial food photography, soft natural light, rustic ceramic plate, shallow depth of field".
- Return exactly 4 recipes.`;
}

export function buildRecipeUserPrompt(
  ingredients: string[],
  language: Locale,
  dietaryFilters: string[],
  count: number = 4,
): string {
  const filterText =
    dietaryFilters.length > 0
      ? `\nDietary requirements: ${dietaryFilters.join(', ')}.`
      : '';

  return `My ingredients: ${ingredients.join(', ')}${filterText}

Return exactly ${count} recipes as a JSON object: { "recipes": [...] }. Each recipe must have this exact structure:
{
  "title": "string",
  "description": "string (2-3 sentences, casual and appetizing)",
  "cookTime": "string (e.g. '30m', '1h 15m')",
  "difficulty": "Easy" | "Medium" | "Hard",
  "servings": "string (e.g. '4 Servings')",
  "ingredients": [{ "name": "string", "amount": "string", "isExtra": boolean }],
  "instructions": [{ "step": number, "title": "string", "description": "string" }] (as many steps as the recipe naturally needs),
  "imagePrompt": "string (food photography description)"
}

Respond in ${langName[language]}. Return ONLY the JSON object with a "recipes" key, nothing else.`;
}
