CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`category` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `image_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`prompt` text NOT NULL,
	`provider` text NOT NULL,
	`file_path` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recipe_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ingredient_hash` text NOT NULL,
	`ingredients_raw` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`dietary_filters` text,
	`recipe_ids` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipe_cache_ingredient_hash_unique` ON `recipe_cache` (`ingredient_hash`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`cook_time` text NOT NULL,
	`difficulty` text NOT NULL,
	`servings` text,
	`ingredients` text NOT NULL,
	`instructions` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`dietary_tags` text,
	`extra_ingredients` text,
	`image_url` text,
	`image_status` text DEFAULT 'pending',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `search_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ingredients` text NOT NULL,
	`ingredient_hash` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`dietary_filters` text,
	`created_at` integer NOT NULL
);
