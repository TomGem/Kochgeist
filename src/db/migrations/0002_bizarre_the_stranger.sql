CREATE INDEX `bookmarks_user_id_idx` ON `bookmarks` (`user_id`);--> statement-breakpoint
CREATE INDEX `search_history_user_id_idx` ON `search_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);