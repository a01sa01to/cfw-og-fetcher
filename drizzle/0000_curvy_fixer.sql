CREATE TABLE `og` (
	`hash` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`description` text,
	`image` text,
	`favicon` text,
	`created_at` integer NOT NULL,
	`fetched_at` integer,
	`last_reference` integer,
	`last_crawl_status` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_og_url` ON `og` (`url`);--> statement-breakpoint
CREATE INDEX `idx_og_created_at` ON `og` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_og_fetched_at` ON `og` (`fetched_at`);--> statement-breakpoint
CREATE INDEX `idx_og_last_reference` ON `og` (`last_reference`);--> statement-breakpoint
CREATE TABLE `tweet` (
	`id_str` text PRIMARY KEY NOT NULL,
	`author_screen_name` text NOT NULL,
	`author_name` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`has_media` integer DEFAULT false NOT NULL,
	`raw_json` text NOT NULL,
	`fetched_at` integer,
	`last_reference` integer
);
--> statement-breakpoint
CREATE INDEX `idx_tweets_author_date` ON `tweet` (`author_screen_name`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `idx_tweets_created_at` ON `tweet` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tweets_fetched_at` ON `tweet` (`fetched_at`);--> statement-breakpoint
CREATE INDEX `idx_tweets_last_reference` ON `tweet` (`last_reference`);