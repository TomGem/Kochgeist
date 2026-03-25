import OpenAI from 'openai';
import type { AIProvider, GenerateRecipesParams, RecipeOutput, RecognizeIngredientsParams } from '../provider';
import { buildRecipeSystemPrompt, buildRecipeUserPrompt } from '../prompts/recipe-suggest';
import { RecipeArraySchema } from '../prompts/schema';

export class LMStudioProvider implements AIProvider {
  name = 'lmstudio';
  private client: OpenAI;
  private model: string;

  constructor() {
    const baseUrl = import.meta.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1';
    this.model = import.meta.env.LMSTUDIO_MODEL || 'local-model';

    this.client = new OpenAI({ baseURL: baseUrl, apiKey: 'lm-studio' });
  }

  async generateRecipes(params: GenerateRecipesParams): Promise<RecipeOutput[]> {
    const { ingredients, language, dietaryFilters, count = 4 } = params;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: buildRecipeSystemPrompt(language) },
        { role: 'user', content: buildRecipeUserPrompt(ingredients, language, dietaryFilters, count) },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from LM Studio');

    // Local models may wrap JSON in markdown code blocks
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    let recipesArray: unknown;
    if (Array.isArray(parsed)) {
      recipesArray = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(parsed.recipes)) {
        recipesArray = parsed.recipes;
      } else {
        const candidate = Object.values(parsed).find(
          (v) => Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null && 'title' in v[0],
        );
        recipesArray = candidate ?? ('title' in parsed && 'ingredients' in parsed ? [parsed] : undefined);
      }
    }
    if (!Array.isArray(recipesArray)) throw new Error('AI response does not contain a recipe array');
    return RecipeArraySchema.parse(recipesArray);
  }

  async recognizeIngredients(_params: RecognizeIngredientsParams): Promise<string[]> {
    throw new Error('Image recognition not supported with LM Studio');
  }
}
