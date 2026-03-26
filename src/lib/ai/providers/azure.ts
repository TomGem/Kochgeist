import { AzureOpenAI } from 'openai';
import type { AIProvider, GenerateRecipesParams, GenerateRecipesResult, RecognizeIngredientsParams } from '../provider';
import { buildRecipeSystemPrompt, buildRecipeUserPrompt } from '../prompts/recipe-suggest';
import { RecipeArraySchema, CookingTipSchema } from '../prompts/schema';

export class AzureAIProvider implements AIProvider {
  name = 'azure';
  model: string;
  private client: AzureOpenAI;

  constructor(modelOverride?: string) {
    const endpoint = import.meta.env.AZURE_ENDPOINT;
    const apiKey = import.meta.env.AZURE_API_KEY;
    const apiVersion = import.meta.env.AZURE_API_VERSION || '2024-12-01-preview';
    this.model = modelOverride || import.meta.env.AZURE_DEPLOYMENT || 'gpt-4o';

    if (!endpoint || !apiKey) {
      throw new Error('AZURE_ENDPOINT and AZURE_API_KEY must be set');
    }

    this.client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
    });
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
      max_completion_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Azure AI');

    const parsed = JSON.parse(content);
    // Extract the recipes array from various response shapes
    let recipesArray: unknown;
    if (Array.isArray(parsed)) {
      recipesArray = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Prefer a known key like "recipes", otherwise find first array of objects
      if (Array.isArray(parsed.recipes)) {
        recipesArray = parsed.recipes;
      } else {
        const candidate = Object.values(parsed).find(
          (v) => Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null && 'title' in v[0],
        );
        if (candidate) {
          recipesArray = candidate;
        } else if ('title' in parsed && 'ingredients' in parsed) {
          // Model returned a single recipe object instead of an array
          recipesArray = [parsed];
        }
      }
    }
    if (!Array.isArray(recipesArray)) {
      throw new Error('AI response does not contain a recipe array');
    }

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
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Azure AI vision');

    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null
        ? Object.values(parsed).find(Array.isArray)
        : null;
    if (!Array.isArray(arr)) throw new Error('Expected array of ingredient names');
    return arr.filter((item: unknown) => typeof item === 'string');
  }

  async listModels(): Promise<string[]> {
    // Azure doesn't expose deployment listing via the data plane API —
    // enter deployment names manually in the text field.
    return [];
  }
}
