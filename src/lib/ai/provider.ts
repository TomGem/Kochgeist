import type { Locale } from '../i18n/index';

export interface RecipeIngredient {
  name: string;
  amount: string;
  isExtra: boolean;
}

export interface RecipeStep {
  step: number;
  title: string;
  description: string;
}

export interface RecipeOutput {
  title: string;
  highlight?: string;
  description: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeStep[];
  imagePrompt: string;
}

export interface CookingTip {
  title: string;
  text: string;
}

export interface GenerateRecipesResult {
  recipes: RecipeOutput[];
  tip?: CookingTip;
}

export interface GenerateRecipesParams {
  ingredients: string[];
  language: Locale;
  dietaryFilters: string[];
  count?: number;
}

export interface RecognizeIngredientsParams {
  imageBase64: string;
  language: Locale;
}

export interface AIProvider {
  name: string;
  model: string;
  generateRecipes(params: GenerateRecipesParams): Promise<GenerateRecipesResult>;
  recognizeIngredients(params: RecognizeIngredientsParams): Promise<string[]>;
  listModels(): Promise<string[]>;
}
