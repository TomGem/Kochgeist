import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ── Auth tables ──────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('user'), // 'admin' | 'user'
  isVerified: integer('is_verified').notNull().default(0),
  language: text('language').default('en'),
  favouriteShortcuts: text('favourite_shortcuts'), // JSON array of shortcut objects
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_expires_at_idx').on(table.expiresAt),
]);

export const invitations = sqliteTable('invitations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  createdBy: text('created_by').notNull().references(() => users.id),
  maxUses: integer('max_uses').notNull().default(1),
  useCount: integer('use_count').notNull().default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const passwordResets = sqliteTable('password_resets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const emailVerifications = sqliteTable('email_verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  code: text('code').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Settings table ───────────────────────────────────────────

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Recipe tables ────────────────────────────────────────────

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  cookTime: text('cook_time').notNull(),
  difficulty: text('difficulty').notNull(),
  highlight: text('highlight'),
  servings: text('servings'),
  ingredients: text('ingredients').notNull(), // JSON array
  instructions: text('instructions').notNull(), // JSON array
  language: text('language').notNull().default('en'),
  dietaryTags: text('dietary_tags'), // JSON array
  extraIngredients: text('extra_ingredients'), // JSON array
  imageUrl: text('image_url'),
  imageStatus: text('image_status').default('pending'),
  aiProvider: text('ai_provider'),
  aiModel: text('ai_model'),
  aiGenerationTimeMs: integer('ai_generation_time_ms'),
  sharedAt: integer('shared_at', { mode: 'timestamp' }),
  sharedBy: text('shared_by'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  index('recipes_shared_at_idx').on(table.sharedAt),
]);

export const recipeCache = sqliteTable('recipe_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ingredientHash: text('ingredient_hash').notNull().unique(),
  ingredientsRaw: text('ingredients_raw').notNull(), // JSON
  language: text('language').notNull().default('en'),
  dietaryFilters: text('dietary_filters'), // JSON
  recipeIds: text('recipe_ids').notNull(), // JSON array of recipe IDs
  tip: text('tip'), // JSON { title, text } - AI-generated cooking tip
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: text('recipe_id').notNull().references(() => recipes.id),
  userId: text('user_id').references(() => users.id),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  index('bookmarks_user_id_idx').on(table.userId),
]);

export const searchHistory = sqliteTable('search_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ingredients: text('ingredients').notNull(), // JSON array
  ingredientHash: text('ingredient_hash').notNull(),
  userId: text('user_id').references(() => users.id),
  language: text('language').notNull().default('en'),
  dietaryFilters: text('dietary_filters'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  index('search_history_user_id_idx').on(table.userId),
]);

export const imageCache = sqliteTable('image_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: text('recipe_id').notNull().references(() => recipes.id),
  prompt: text('prompt').notNull(),
  provider: text('provider').notNull(),
  model: text('model'),
  filePath: text('file_path'),
  status: text('status').notNull().default('pending'),
  generationTimeMs: integer('generation_time_ms'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
