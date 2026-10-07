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
	image: v.nullable(v.string()),
	favicon: v.nullable(v.string()),
});

export type OgApiResponse = v.InferOutput<typeof OgApiResponseSchema>;
