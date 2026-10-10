import { env, waitUntil } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Tweet } from "react-tweet/api";
import * as v from "valibot";
import * as schema from "~/db/schema";
import { tweetIdSchema } from "~/schema";

export const Route = createFileRoute("/api/tw/$id")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { id } = params;

				const headers = new Headers();
				headers.set("Access-Control-Allow-Origin", "*");
				headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

				const parsed = v.safeParse(tweetIdSchema, id);
				if (!parsed.success) {
					return Response.json(
						{ error: "Invalid id format" },
						{ status: 400, headers },
					);
				}

				const db = drizzle(env.DB, { schema });
				const item = (await db.query.tweet.findFirst({
					where: (tweet, { eq }) => eq(tweet.idStr, id),
					columns: {
						rawJson: true,
					},
				})) satisfies { rawJson: Tweet | null } | undefined;

				if (!item?.rawJson) {
					return Response.json(
						{ error: "Not found" },
						{ status: 404, headers },
					);
				}

				waitUntil(
					db
						.update(schema.tweet)
						.set({ lastReference: new Date() })
						.where(eq(schema.tweet.idStr, id))
						.catch(console.error),
				);

				return Response.json(item.rawJson, { status: 200, headers });
			},
			OPTIONS: () => {
				const headers = new Headers();
				headers.set("Access-Control-Allow-Origin", "*");
				headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
				headers.set("Access-Control-Allow-Headers", "Content-Type");
				headers.set("Access-Control-Max-Age", "86400");

				return new Response(null, {
					status: 204,
					headers,
				});
			},
			ANY: () => {
				const headers = new Headers();
				headers.set("Access-Control-Allow-Origin", "*");
				return new Response("Method Not Allowed", {
					status: 405,
					headers,
				});
			},
		},
	},
});
