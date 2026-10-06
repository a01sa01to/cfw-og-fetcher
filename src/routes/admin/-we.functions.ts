import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as v from "valibot";
import * as schema from "~/db/schema";
import { generateHash } from "~/utils/hash";

const UrlDataValidator = v.object({
	url: v.pipe(
		v.string(),
		v.url(),
		v.check((url) => URL.canParse(url)),
	),
});
const HashStringValidator = v.pipe(
	v.string(),
	v.check((hash) => /^[a-f0-9]{64}$/.test(hash)),
);

export const getAllData = createServerFn().handler(async () => {
	const db = drizzle(env.DB, { schema });
	return db.query.og.findMany({
		columns: {
			hash: true,
			url: true,
			title: true,
			createdAt: true,
			fetchedAt: true,
			lastCrawlStatus: true,
			lastReference: true,
		},
		orderBy: (og, { desc }) => [desc(og.fetchedAt)],
	});
});

export const getAllData$$key = (): unknown[] => ["admin", "we", "all"];

export const getDataByHash = createServerFn()
	.validator((data) => v.parse(HashStringValidator, data))
	.handler(async ({ data }) => {
		const db = drizzle(env.DB, { schema });
		const result = await db.query.og.findFirst({
			where: (og, { eq }) => eq(og.hash, data),
		});
		return result;
	});

export const getDataByHash$$key = (hash: string): unknown[] => [
	"admin",
	"we",
	hash,
];

export const createNewData = createServerFn({ method: "POST" })
	.validator((data) => v.parse(UrlDataValidator, data))
	.handler(async ({ data }) => {
		const db = drizzle(env.DB, { schema });

		const existing = await db.query.og.findFirst({
			where: (og, { eq }) => eq(og.url, data.url),
		});
		if (existing) {
			return { alreadyExists: true, url: data.url };
		}

		const now = new Date();
		const result = await db.insert(schema.og).values({
			hash: await generateHash(data.url),
			url: data.url,
			title: null,
			description: null,
			image: null,
			favicon: null,
			createdAt: now,
			fetchedAt: null,
			lastReference: null,
			lastCrawlStatus: null,
		});
		if (!result.success) {
			console.error("Insert failed:", result.error);
			throw new Error(`Insert failed: ${result.error}`);
		}
		return { alreadyExists: false, url: data.url };
	});

export const deleteDataByHash = createServerFn({ method: "POST" })
	.validator((data) => v.parse(HashStringValidator, data))
	.handler(async ({ data }) => {
		const db = drizzle(env.DB, { schema });
		const result = await db
			.delete(schema.og)
			.where(eq(schema.og.hash, data))
			.run();
		if (!result.success) {
			console.error("Delete failed:", result.error);
			throw new Error(`Delete failed: ${result.error}`);
		}
		return { hash: data };
	});
