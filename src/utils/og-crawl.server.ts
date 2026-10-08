import { env } from "cloudflare:workers";
import * as cheerio from "cheerio";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "~/db/schema";
import type { QueueMessage } from "~/schema";
import { weFavKey, weImgKey } from "./constants";
import { imageSize, mimeType, supportedImageMimeTypes } from "./image.server";
import { optimizeImageBuffer } from "./image-optimization.server";

const userAgent =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0";

const unescapeHtml = (str: string) => {
	const $ = cheerio.load(str);
	return $("body").text();
};

const parseHtmlEntities = async (url: string, response: Response) => {
	const urlObj = new URL(url);
	const defaultFavicon = `${urlObj.origin}/favicon.ico`;

	const resp = {
		title: url,
		description: undefined as string | undefined,
		image: undefined as string | undefined,
		favicon: defaultFavicon,
	};

	const res = new HTMLRewriter()
		.on("meta", {
			element(el) {
				const property = el.getAttribute("property");
				const name = el.getAttribute("name");
				const content = el.getAttribute("content");
				switch (property) {
					case "og:title":
						if (resp.title === url) resp.title = content ?? url;
						break;
					case "og:description":
						resp.description ??= content ?? undefined;
						break;
					case "og:image":
						resp.image ??= content ?? undefined;
						break;
				}
				switch (name) {
					case "title":
						if (resp.title === url) resp.title = content ?? url;
						break;
					case "description":
						resp.description ??= content ?? undefined;
						break;
					case "image":
						resp.image ??= content ?? undefined;
						break;
				}
			},
		})
		.on("link", {
			element(el) {
				const rel = el.getAttribute("rel");
				const href = el.getAttribute("href");
				if (rel === "icon" || rel === "shortcut icon")
					resp.favicon = href ?? defaultFavicon;
			},
		})
		.transform(response.clone());

	await res.text();

	// もし og:title がなかったら title タグから取得する
	if (resp.title === url) {
		const htmlText = await response.text();
		const $ = cheerio.load(htmlText);
		const titleTag = $("title").first();
		if (titleTag.length > 0) {
			resp.title = titleTag.text() || url;
		}
	}

	if (resp.image?.startsWith("/"))
		resp.image = new URL(resp.image, urlObj.origin).toString();
	if (resp.favicon?.startsWith("/"))
		resp.favicon = new URL(resp.favicon, urlObj.origin).toString();

	resp.title = unescapeHtml(resp.title);
	resp.description = resp.description
		? // タグが含まれているかもなので 2 回 unescape する
			unescapeHtml(unescapeHtml(resp.description))
		: undefined;
	resp.image = resp.image ? unescapeHtml(resp.image) : undefined;
	resp.favicon = unescapeHtml(resp.favicon);

	return resp;
};

export const ogCrawler = async (hash: string) => {
	const db = drizzle(env.DB, { schema });

	const item = await db.query.og.findFirst({
		where: (og, { eq }) => eq(og.hash, hash),
	});

	if (!item) {
		throw new Error(`Item with hash ${hash} not found`);
	}

	console.log("Fetching OG data for URL:", item.url);

	const res: Partial<typeof item> = {
		fetchedAt: new Date(),
	};

	const que = env.OG_QUEUE as Queue<QueueMessage>;

	try {
		const response = await fetch(item.url, {
			headers: {
				"User-Agent": userAgent,
			},
		});

		res.lastCrawlStatus = response.status;

		if (!response.ok) return; // Memo: finally は early return しても実行される

		const parsed = await parseHtmlEntities(item.url, response.clone());
		res.title = parsed.title;
		res.description = parsed.description;

		if (parsed.image) {
			console.log("Fetching OG image:", parsed.image);
			const imgRes = await fetch(parsed.image, {
				headers: {
					"User-Agent": userAgent,
				},
			});
			if (imgRes.ok) {
				const key = weImgKey(hash);
				const buf = await imgRes.arrayBuffer();
				const u8buf = new Uint8Array(buf);
				const mime = await mimeType(u8buf);

				if (supportedImageMimeTypes.includes(mime ?? "")) {
					const siz = imageSize(u8buf);
					res.originalImageWidth = siz.width;

					await env.OG_BUCKET.put(key, u8buf, {
						httpMetadata: {
							contentType: mime,
						},
					});

					// Twitter, Facebook などは 1200x628 なので ÷4 して 300x157 から開始したい
					for (let i = 300; i <= 1200; i += 300) {
						if (i <= siz.width) {
							await que.send({
								type: "img-opt",
								hash,
								width: i,
								height: Math.ceil((i / siz.width) * siz.height),
							});
							console.log("Enqueued image optimization for width:", i);
						}
					}
				}
			}
		}
		{
			console.log("Fetching favicon:", parsed.favicon);
			const favRes = await fetch(parsed.favicon, {
				headers: {
					"User-Agent": userAgent,
				},
			});
			if (favRes.ok) {
				const key = weFavKey(hash);
				const buf = await favRes.arrayBuffer();
				try {
					const opt = await optimizeImageBuffer(new Uint8Array(buf), 32, 32);
					if (opt) {
						await env.OG_BUCKET.put(key, opt.data, {
							httpMetadata: {
								contentType: opt.contentType,
							},
						});
					}
				} catch (err) {
					console.error("Favicon optimization failed:", err);
					await env.OG_BUCKET.put(key, new Uint8Array(buf), {
						httpMetadata: {
							contentType: await mimeType(new Uint8Array(buf)),
						},
					});
				}
			}
		}
	} catch (err) {
		console.error(err);
		res.lastCrawlStatus = -1;
	} finally {
		await db
			.update(schema.og)
			.set(res)
			.where(eq(schema.og.hash, hash))
			.run()
			.catch(console.error);
		console.log("OG data fetch completed:", item.url, res);
	}
};
