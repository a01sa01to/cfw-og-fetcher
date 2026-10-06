ALTER TABLE `og` ADD `hash` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_og_hash` ON `og` (`hash`);