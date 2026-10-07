import { env } from "cloudflare:workers";
import * as cheerio from "cheerio";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "~/db/schema";
import { weFavKey, weImgKey } from "./constants";
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
			const imgRes = await fetch(parsed.image, {
				headers: {
					"User-Agent": userAgent,
				},
			});
			if (imgRes.ok) {
				const key = weImgKey(hash);
				const buf = await imgRes.arrayBuffer();
				// Twitter, Facebook などは 1200x628 なので ÷4 して 300x157 にする
				const opt = await optimizeImageBuffer(new Uint8Array(buf), 300, 157);
				if (opt) {
					await env.OG_BUCKET.put(key, opt.data, {
						httpMetadata: {
							contentType: opt.contentType,
						},
					});
				}
			}
		}
		{
			const favRes = await fetch(parsed.favicon, {
				headers: {
					"User-Agent": userAgent,
				},
			});
			if (favRes.ok) {
				const key = weFavKey(hash);
				const buf = await favRes.arrayBuffer();
				const opt = await optimizeImageBuffer(new Uint8Array(buf), 32, 32);
				if (opt) {
					await env.OG_BUCKET.put(key, opt.data, {
						httpMetadata: {
							contentType: opt.contentType,
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
