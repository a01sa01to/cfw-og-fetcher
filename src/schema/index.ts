import * as v from "valibot";

export const hashSchema = v.pipe(
	v.string(),
	v.regex(/^[a-f0-9]{64}$/, "Invalid hash format"),
);

export const absUrlSchema = v.pipe(
	v.string(),
	v.url(),
	v.check((url) => URL.canParse(url)),
);

export const OgApiResponseSchema = v.object({
	url: absUrlSchema,
	title: v.nullable(v.string()),
	description: v.nullable(v.string()),
	originalImageWidth: v.nullable(v.number()),
});

export type OgApiResponse = v.InferOutput<typeof OgApiResponseSchema>;

export const QueueMessageSchema = v.union([
	v.object({
		type: v.literal("fetch"),
		hash: hashSchema,
	}),
	v.object({
		type: v.literal("img-opt"),
		hash: hashSchema,
		width: v.number(),
		height: v.number(),
	}),
]);

export type QueueMessage = v.InferOutput<typeof QueueMessageSchema>;
