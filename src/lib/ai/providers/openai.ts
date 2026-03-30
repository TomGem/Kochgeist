import OpenAI from 'openai';
import type { AIProvider, GenerateRecipesParams, GenerateRecipesResult, RecognizeIngredientsParams } from '../provider';
import { buildRecipeSystemPrompt, buildRecipeUserPrompt } from '../prompts/recipe-suggest';
import { RecipeArraySchema, CookingTipSchema } from '../prompts/schema';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  model: string;
  private client: OpenAI;

  constructor(modelOverride?: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY must be set');

    this.client = new OpenAI({ apiKey });
    this.model = modelOverride || process.env.OPENAI_MODEL || 'gpt-4o';
  }

  async generateRecipes(params: GenerateRecipesParams): Promise<GenerateRecipesResult> {
    const { ingredients, language, dietaryFilters, count = 4 } = params;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: buildRecipeSystemPrompt(language) },
        { role: 'user', content: buildRecipeUserPrompt(ingredients, language, dietaryFilters, count) },
      ],
      temperature: 0.8,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(content);
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

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `You identify food ingredients in images. Return a JSON array of ingredient names in ${langName}. Only return the JSON array, nothing else.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What food ingredients can you see in this image? Return a JSON array of strings.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error('Expected JSON array of ingredients from OpenAI');
    return parsed.filter((i: unknown) => typeof i === 'string');
  }

  async listModels(): Promise<string[]> {
    const models: string[] = [];
    for await (const model of this.client.models.list()) {
      models.push(model.id);
    }
    return models.sort();
  }
}
