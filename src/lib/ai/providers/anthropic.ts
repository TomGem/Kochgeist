import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, GenerateRecipesParams, GenerateRecipesResult, RecognizeIngredientsParams } from '../provider';
import { buildRecipeSystemPrompt, buildRecipeUserPrompt } from '../prompts/recipe-suggest';
import { RecipeArraySchema, CookingTipSchema } from '../prompts/schema';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  model: string;
  private client: Anthropic;

  constructor(modelOverride?: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY must be set');

    this.client = new Anthropic({ apiKey });
    this.model = modelOverride || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  }

  async generateRecipes(params: GenerateRecipesParams): Promise<GenerateRecipesResult> {
    const { ingredients, language, dietaryFilters, count = 4 } = params;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: buildRecipeSystemPrompt(language),
      messages: [
        { role: 'user', content: buildRecipeUserPrompt(ingredients, language, dietaryFilters, count) },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const jsonStr = content.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
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
    const tip = typeof parsed === 'object' && parsed !== null && parsed.tip
      ? CookingTipSchema.safeParse(parsed.tip).data
      : undefined;
    return { recipes: RecipeArraySchema.parse(recipesArray), tip };
  }

  async recognizeIngredients(params: RecognizeIngredientsParams): Promise<string[]> {
    const { imageBase64, language } = params;
    const langName = language === 'de' ? 'German' : 'English';

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
            },
            {
              type: 'text',
              text: `List all food ingredients you can see in this image. Return ONLY a JSON array of ingredient names in ${langName}. No other text.`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const jsonStr = content.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed.filter((i: unknown) => typeof i === 'string') : [];
  }

  async listModels(): Promise<string[]> {
    const models: string[] = [];
    for await (const model of this.client.models.list()) {
      models.push(model.id);
    }
    return models.sort();
  }
}
