import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";
import * as schema from "~/db/schema";
import { type QueueMessage, tweetIdSchema } from "~/schema";

export const getAllTweets = createServerFn().handler(async () => {
	const db = drizzle(env.DB, { schema });
	return db.query.tweet.findMany({
		columns: {
			idStr: true,
			authorName: true,
			authorScreenName: true,
			text: true,
			fetchedAt: true,
			lastReference: true,
			tweetDeleted: true,
		},
		orderBy: (tweet, { desc }) => [desc(tweet.fetchedAt)],
	});
});

export const getAllTweets$$key = (): unknown[] => ["admin", "tw", "all"];

export const getTweetById = createServerFn()
	.validator((data) => v.parse(tweetIdSchema, data))
	.handler(async ({ data }) => {
		const db = drizzle(env.DB, { schema });
		const result = await db.query.tweet.findFirst({
			where: (tweet, { eq }) => eq(tweet.idStr, data),
		});
		return result;
	});

export const getTweetById$$key = (hash: string): unknown[] => [
	"admin",
	"tw",
	hash,
];

export const createNewTweet = createServerFn({ method: "POST" })
	.validator((data) => v.parse(tweetIdSchema, data))
	.handler(async ({ data }) => {
		const db = drizzle(env.DB, { schema });

		const existing = await db.query.tweet.findFirst({
			where: (tweet, { eq }) => eq(tweet.idStr, data),
		});
		if (existing) {
			return { alreadyExists: true, id: data };
		}

		const now = new Date();
		const result = await db.insert(schema.tweet).values({
			idStr: data,
			authorScreenName: null,
			authorName: null,
			text: null,
			createdAt: now,
			likeCount: 0,
			hasMedia: false,
			rawJson: null,
			fetchedAt: null,
			lastReference: null,
			tweetDeleted: false,
		});
		if (!result.success) {
			console.error("Insert failed:", result.error);
			throw new Error(`Insert failed: ${result.error}`);
		}
		return { alreadyExists: false, id: data };
	});

export const deleteTweetById = createServerFn({ method: "POST" })
	.validator((data) => v.parse(tweetIdSchema, data))
	.handler(async ({ data }) => {
		const db = drizzle(env.DB, { schema });

		const result = await db
			.delete(schema.tweet)
			.where(eq(schema.tweet.idStr, data))
			.run();

		if (!result.success) {
			console.error("Delete failed:", result.error);
			throw new Error(`Delete failed: ${result.error}`);
		}

		return { id: data };
	});

export const fetchTweetById = createServerFn()
	.validator((data) => v.parse(tweetIdSchema, data))
	.handler(async ({ data }) => {
		const que = env.OG_QUEUE as Queue<QueueMessage>;
		await que.send({ type: "tweet-fetch", id: data }).catch(console.error);
	});
