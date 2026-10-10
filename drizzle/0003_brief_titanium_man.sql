PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tweet` (
	`id_str` text PRIMARY KEY NOT NULL,
	`author_screen_name` text,
	`author_name` text,
	`text` text,
	`created_at` integer NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`has_media` integer DEFAULT false NOT NULL,
	`raw_json` text,
	`fetched_at` integer,
	`last_reference` integer,
	`deleted` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tweet`("id_str", "author_screen_name", "author_name", "text", "created_at", "like_count", "has_media", "raw_json", "fetched_at", "last_reference", "deleted") SELECT "id_str", "author_screen_name", "author_name", "text", "created_at", "like_count", "has_media", "raw_json", "fetched_at", "last_reference", "deleted" FROM `tweet`;--> statement-breakpoint
DROP TABLE `tweet`;--> statement-breakpoint
ALTER TABLE `__new_tweet` RENAME TO `tweet`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_tweets_author_date` ON `tweet` (`author_screen_name`,`"created_at" desc`);--> statement-breakpoint
CREATE INDEX `idx_tweets_created_at` ON `tweet` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tweets_fetched_at` ON `tweet` (`fetched_at`);--> statement-breakpoint
CREATE INDEX `idx_tweets_last_reference` ON `tweet` (`last_reference`);