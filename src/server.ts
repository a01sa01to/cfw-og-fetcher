import type { env } from "cloudflare:workers";
import handler from "@tanstack/react-start/server-entry";
import type { QueueMessage } from "./schema";

export default {
	fetch: (req) => handler.fetch(req),
	queue: async (batch, env, ctx): Promise<void> => {
		for (const msg of batch.messages) {
			console.log(`Processing message ${msg.body}`);
		}
	},
} satisfies ExportedHandler<typeof env, QueueMessage>;
