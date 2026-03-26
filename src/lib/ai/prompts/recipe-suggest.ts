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
- Respond ONLY with a JSON object: { "recipes": [...], "tip": { "title": "...", "text": "..." } }. No markdown, no code fences, no explanation.
- Use a casual, friendly tone in ${langName[language]}.
- When responding in German, always use proper German umlauts (ä, ö, ü, ß) — never digraphs like ae, oe, ue, ss.
- If the user provides ingredients, every recipe must use as many of them as possible. If no ingredients are given (surprise mode), pick diverse, creative recipes using common ingredients.
- Mark ingredients the user already has as isExtra: false. In surprise mode, mark all ingredients as isExtra: false.
- Mark any additional ingredients the user needs to buy as isExtra: true. Exclude very basic pantry staples (salt, pepper, water, oil) from the "extra" list.
- Include a "highlight" field: a short 2–3 word tagline that captures the recipe's unique appeal (e.g. "Rustic Comfort", "Weeknight Hero", "Protein-Packed", "One-Pot Wonder"). Write it in ${langName[language]}.
- The imagePrompt should describe the finished dish in the style of "editorial food photography, soft natural light, rustic ceramic plate, shallow depth of field".
- Include a "tip" object alongside the recipes array: a practical cooking tip relevant to the specific ingredients provided. The "title" should be a short catchy heading (3-5 words) and "text" should be 1-2 sentences of actionable advice. Write both in ${langName[language]}.
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

  const ingredientText = ingredients.length > 0
    ? `My ingredients: ${ingredients.join(', ')}`
    : `Surprise me! I have no specific ingredients — pick creative, varied recipes using common ingredients that anyone might have at home.`;

  return `${ingredientText}${filterText}

Return exactly ${count} recipes as a JSON object: { "recipes": [...], "tip": { "title": "string", "text": "string" } }. Each recipe must have this exact structure:
{
  "title": "string",
  "highlight": "string (2-3 word tagline, e.g. 'Rustic Comfort')",
  "description": "string (2-3 sentences, casual and appetizing)",
  "cookTime": "string (e.g. '30m', '1h 15m')",
  "difficulty": "Easy" | "Medium" | "Hard",
  "servings": "string (e.g. '4 Servings')",
  "ingredients": [{ "name": "string", "amount": "string", "isExtra": boolean }],
  "instructions": [{ "step": number, "title": "string", "description": "string" }] (as many steps as the recipe naturally needs),
  "imagePrompt": "string (food photography description)"
}

Also include a "tip" object with a practical cooking tip specific to these ingredients.

Respond in ${langName[language]}. Return ONLY the JSON object with "recipes" and "tip" keys, nothing else.`;
}
