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
