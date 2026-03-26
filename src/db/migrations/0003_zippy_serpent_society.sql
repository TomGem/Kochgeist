CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `image_cache` ADD `model` text;--> statement-breakpoint
ALTER TABLE `image_cache` ADD `generation_time_ms` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `ai_provider` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `ai_model` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `ai_generation_time_ms` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `default_filters` text;