import type { AIProvider, GenerateRecipesParams, RecipeOutput, RecognizeIngredientsParams } from '../provider';
import { buildRecipeSystemPrompt, buildRecipeUserPrompt } from '../prompts/recipe-suggest';
import { RecipeArraySchema } from '../prompts/schema';

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  model: string;
  private baseUrl: string;

  constructor(modelOverride?: string) {
    this.baseUrl = import.meta.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = modelOverride || import.meta.env.OLLAMA_MODEL || 'llama3.1';
  }

  async generateRecipes(params: GenerateRecipesParams): Promise<RecipeOutput[]> {
    const { ingredients, language, dietaryFilters, count = 4 } = params;

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: buildRecipeSystemPrompt(language) },
          { role: 'user', content: buildRecipeUserPrompt(ingredients, language, dietaryFilters, count) },
        ],
        format: 'json',
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
    const data = await response.json();
    const content = data.message?.content;
    if (!content) throw new Error('Empty response from Ollama');

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
    return RecipeArraySchema.parse(recipesArray);
  }

  async recognizeIngredients(_params: RecognizeIngredientsParams): Promise<string[]> {
    throw new Error('Image recognition not supported with this Ollama model. Use a multimodal model like llava.');
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
    const data = await response.json();
    return (data.models || []).map((m: { name: string }) => m.name).sort();
  }
}
