import { desc } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const og = sqliteTable(
	"og",
	{
		hash: text("hash").primaryKey(),
		url: text("url").notNull(),
		title: text("title"),
		description: text("description"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		fetchedAt: integer("fetched_at", { mode: "timestamp" }),
		lastReference: integer("last_reference", { mode: "timestamp" }),
		lastCrawlStatus: integer("last_crawl_status"),
	},
	(table) => [
		uniqueIndex("uq_og_url").on(table.url),
		index("idx_og_created_at").on(table.createdAt),
		index("idx_og_fetched_at").on(table.fetchedAt),
		index("idx_og_last_reference").on(table.lastReference),
	],
);

export const tweet = sqliteTable(
	"tweet",
	{
		idStr: text("id_str").primaryKey(),
		authorScreenName: text("author_screen_name").notNull(),
		authorName: text("author_name").notNull(),
		text: text("text").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		likeCount: integer("like_count").notNull().default(0),
		hasMedia: integer("has_media", { mode: "boolean" })
			.notNull()
			.default(false),
		rawJson: text("raw_json").notNull(),
		fetchedAt: integer("fetched_at", { mode: "timestamp" }),
		lastReference: integer("last_reference", { mode: "timestamp" }),
	},
	(table) => [
		index("idx_tweets_author_date").on(
			table.authorScreenName,
			desc(table.createdAt),
		),
		index("idx_tweets_created_at").on(table.createdAt),
		index("idx_tweets_fetched_at").on(table.fetchedAt),
		index("idx_tweets_last_reference").on(table.lastReference),
	],
);
