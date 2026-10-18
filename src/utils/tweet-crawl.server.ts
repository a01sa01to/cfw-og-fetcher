import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Tweet } from "react-tweet/api";
import * as schema from "~/db/schema";

const getToken = (id: string) =>
	((Number(id) / 1e15) * Math.PI).toString(36).replace(/(?:0+|\.)/gu, "");

const getTweet = async (
	id: string,
): Promise<{ data?: Tweet; tombstone?: true; notFound?: true }> => {
	// ref: https://github.com/vercel/react-tweet/blob/main/packages/react-tweet/src/api/fetch-tweet.ts
	const fetchUrl = new URL(`https://cdn.syndication.twimg.com/tweet-result`);
	fetchUrl.searchParams.set("id", id);
	fetchUrl.searchParams.set("lang", "en");
	fetchUrl.searchParams.set(
		"features",
		[
			"tfw_timeline_list:",
			"tfw_follower_count_sunset:true",
			"tfw_tweet_edit_backend:on",
			"tfw_refsrc_session:on",
			"tfw_fosnr_soft_interventions_enabled:on",
			"tfw_show_birdwatch_pivots_enabled:on",
			"tfw_show_business_verified_badge:on",
			"tfw_duplicate_scribes_to_settings:on",
			"tfw_use_profile_image_shape_enabled:on",
			"tfw_show_blue_verified_badge:on",
			"tfw_legacy_timeline_sunset:true",
			"tfw_show_gov_verified_badge:on",
			"tfw_show_business_affiliate_badge:on",
			"tfw_tweet_edit_frontend:on",
		].join(";"),
	);
	fetchUrl.searchParams.set("token", getToken(id));

	const res = await fetch(fetchUrl.toString(), {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
		},
	});

	const isJson = res.headers.get("content-type")?.includes("application/json");
	const data = isJson ? await res.json() : undefined;

	if (res.ok) {
		if (
			typeof data === "object" &&
			data &&
			"__typename" in data &&
			data.__typename === "TweetTombstone"
		) {
			return { tombstone: true };
		}
		if (data && Object.keys(data).length === 0) {
			return { notFound: true };
		}
		return { data: data as Tweet };
	}
	if (res.status === 404) {
		return { notFound: true };
	}

	throw new Error(`Failed to fetch tweet: ${res.status} ${res.statusText}`);
};

export const tweetCrawler = async (id: string) => {
	const db = drizzle(env.DB, { schema });

	const item = await db.query.tweet.findFirst({
		where: (og, { eq }) => eq(og.idStr, id),
	});

	if (!item) {
		throw new Error(`Item with hash ${id} not found`);
	}

	console.log("Fetching Tweet for ID:", id);

	const res: Partial<typeof item> = {
		fetchedAt: new Date(),
		authorName: item.authorName,
		authorScreenName: item.authorScreenName,
		text: item.text,
		likeCount: item.likeCount,
		hasMedia: item.hasMedia,
		rawJson: item.rawJson,
		tweetDeleted: item.tweetDeleted,
	};

	try {
		const { data, notFound, tombstone } = await getTweet(id);
		if (notFound) res.tweetDeleted = true;
		if (notFound || tombstone) return;

		res.authorName = data?.user.name;
		res.authorScreenName = data?.user.screen_name;
		res.text = data?.text;
		res.likeCount = data?.favorite_count;
		res.hasMedia = !!data?.entities?.media?.length;
		res.rawJson = data;
		res.tweetDeleted = false;
	} catch (err) {
		console.error(err);
	} finally {
		await db
			.update(schema.tweet)
			.set(res)
			.where(eq(schema.tweet.idStr, id))
			.run()
			.catch(console.error);
		console.log("Tweet data fetch completed:", id, res);
	}
};
