import { z } from 'zod';

export const RecipeIngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  isExtra: z.boolean(),
});

export const RecipeStepSchema = z.object({
  step: z.number(),
  title: z.string(),
  description: z.string(),
});

export const RecipeOutputSchema = z.object({
  title: z.string(),
  highlight: z.string().optional(),
  description: z.string(),
  cookTime: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  servings: z.string(),
  ingredients: z.array(RecipeIngredientSchema),
  instructions: z.array(RecipeStepSchema),
  imagePrompt: z.string(),
});

export const RecipeArraySchema = z.array(RecipeOutputSchema);

export const CookingTipSchema = z.object({
  title: z.string(),
  text: z.string(),
});
