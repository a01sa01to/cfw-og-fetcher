import type { env } from "cloudflare:workers";
import handler from "@tanstack/react-start/server-entry";
import type { QueueMessage } from "./schema";
import { weImgKey } from "./utils/constants";
import { optimizeImageBuffer } from "./utils/image-optimization.server";
import { ogCrawler } from "./utils/og-crawl.server";
import { tweetCrawler } from "./utils/tweet-crawl.server";

export default {
	fetch: (req) => handler.fetch(req),
	queue: async (batch, env, _ctx): Promise<void> => {
		for (const msg of batch.messages) {
			console.log(`Processing message ${msg.id} of type ${msg.body.type}`);
			try {
				switch (msg.body.type) {
					case "fetch": {
						await ogCrawler(msg.body.hash).catch(console.error);
						break;
					}
					case "img-opt": {
						const origKey = weImgKey(msg.body.hash);
						const orig = await env.OG_BUCKET.get(origKey);
						if (!orig) {
							throw new Error(
								`Original image not found for hash ${msg.body.hash}`,
							);
						}
						const origBuffer = await orig.arrayBuffer();
						const opt = await optimizeImageBuffer(
							new Uint8Array(origBuffer),
							msg.body.width,
							msg.body.height,
						);

						await env.OG_BUCKET.put(`${origKey}/${msg.body.width}`, opt.data, {
							httpMetadata: {
								contentType: opt.contentType,
							},
						});
						break;
					}
					case "tweet-fetch": {
						await tweetCrawler(msg.body.id).catch(console.error);
						break;
					}
				}
				console.log(`Message ${msg.id} processed successfully.`);
				msg.ack();
			} catch (err) {
				console.error(`Error processing message ${msg.id}:`, err);
				msg.retry({ delaySeconds: 60 });
			}
		}
	},
} satisfies ExportedHandler<typeof env, QueueMessage>;
