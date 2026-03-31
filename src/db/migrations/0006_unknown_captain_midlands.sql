ALTER TABLE `recipes` ADD `shared_at` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `shared_by` text;--> statement-breakpoint
CREATE INDEX `recipes_shared_at_idx` ON `recipes` (`shared_at`);