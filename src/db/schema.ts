import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  cookTime: text('cook_time').notNull(),
  difficulty: text('difficulty').notNull(),
  servings: text('servings'),
  ingredients: text('ingredients').notNull(), // JSON array
  instructions: text('instructions').notNull(), // JSON array
  language: text('language').notNull().default('en'),
  dietaryTags: text('dietary_tags'), // JSON array
  extraIngredients: text('extra_ingredients'), // JSON array
  imageUrl: text('image_url'),
  imageStatus: text('image_status').default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const recipeCache = sqliteTable('recipe_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ingredientHash: text('ingredient_hash').notNull().unique(),
  ingredientsRaw: text('ingredients_raw').notNull(), // JSON
  language: text('language').notNull().default('en'),
  dietaryFilters: text('dietary_filters'), // JSON
  recipeIds: text('recipe_ids').notNull(), // JSON array of recipe IDs
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: text('recipe_id').notNull().references(() => recipes.id),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const searchHistory = sqliteTable('search_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ingredients: text('ingredients').notNull(), // JSON array
  ingredientHash: text('ingredient_hash').notNull(),
  language: text('language').notNull().default('en'),
  dietaryFilters: text('dietary_filters'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const imageCache = sqliteTable('image_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: text('recipe_id').notNull().references(() => recipes.id),
  prompt: text('prompt').notNull(),
  provider: text('provider').notNull(),
  filePath: text('file_path'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
