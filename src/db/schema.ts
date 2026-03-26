import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ── Auth tables ──────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('user'), // 'admin' | 'user'
  isVerified: integer('is_verified').notNull().default(0),
  language: text('language').default('en'),
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
});

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

// ── Recipe tables ────────────────────────────────────────────

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
  userId: text('user_id').references(() => users.id),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

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
