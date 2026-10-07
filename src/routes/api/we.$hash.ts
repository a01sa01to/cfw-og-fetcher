import { env, waitUntil } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";
import * as schema from "~/db/schema";
import { hashSchema, type OgApiResponse } from "~/schema";

export const Route = createFileRoute("/api/we/$hash")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const { hash } = params;

				const headers = new Headers();
				headers.set("Access-Control-Allow-Origin", "*");
				headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

				const parsed = v.safeParse(hashSchema, hash);
				if (!parsed.success) {
					return Response.json(
						{ error: "Invalid hash format" },
						{ status: 400, headers },
					);
				}

				const db = drizzle(env.DB, { schema });
				const item = (await db.query.og.findFirst({
					where: (og, { eq }) => eq(og.hash, hash),
					columns: {
						url: true,
						title: true,
						description: true,
						image: true,
						favicon: true,
					},
				})) satisfies OgApiResponse | undefined;

				if (!item) {
					return Response.json(
						{ error: "Not found" },
						{ status: 404, headers },
					);
				}

				waitUntil(
					db
						.update(schema.og)
						.set({ lastReference: new Date() })
						.where(eq(schema.og.hash, hash))
						.catch(console.error),
				);

				return Response.json(item, { status: 200, headers });
			},
			OPTIONS: async () => {
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
		},
	},
});
