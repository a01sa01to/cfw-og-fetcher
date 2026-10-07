import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";
import { hashSchema } from "~/schema";

export const Route = createFileRoute("/api/we/$hash/img")({
	server: {
		handlers: {
			GET: async ({ params, request }) => {
				const { hash } = params;

				const headers = new Headers();
				headers.set("Access-Control-Allow-Origin", "*");
				headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

				const parsed = v.safeParse(hashSchema, hash);
				if (!parsed.success) {
					return new Response("Invalid hash format", { status: 400, headers });
				}

				const key = `we/img/${hash}.webp`;
				const obj = await env.OG_BUCKET.get(key, {
					onlyIf: request.headers,
					range: request.headers,
				});

				if (obj === null) {
					return new Response("Not Found", { status: 404, headers });
				}

				obj.writeHttpMetadata(headers);
				headers.set("ETag", obj.httpEtag);

				return new Response("body" in obj ? obj.body : null, {
					status: "body" in obj ? 200 : 412,
					headers,
				});
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
