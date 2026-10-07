import { detectXml } from "@file-type/xml";
import { FileTypeParser } from "file-type";
import imageSize from "image-size";
import { optimizeImage } from "wasm-image-optimization";

const fileTypeParser = new FileTypeParser({ customDetectors: [detectXml] });

export const optimizeImageBuffer = async (
	buffer: Uint8Array,
	outputWidth: number,
	outputHeight: number,
) => {
	const fileType = await fileTypeParser.fromBuffer(buffer);

	if (!fileType) return null;
	if (!fileType.mime.startsWith("image/")) return null;

	// svg, jpeg, png, webp, avif のみ対応
	// それ以外はそのままストリームで返す
	if (
		![
			"image/svg+xml",
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/avif",
		].includes(fileType.mime)
	) {
		return {
			data: buffer,
			contentType: fileType.mime,
		};
	}

	const dimension = imageSize(new Uint8Array(buffer));

	// 短辺に合わせる
	const heightTmp = Math.ceil(
		(outputWidth / dimension.width) * dimension.height,
	);
	const widthTmp = Math.ceil(
		(outputHeight / dimension.height) * dimension.width,
	);
	const height2 = Math.min(heightTmp, outputHeight);
	const width2 = Math.min(widthTmp, outputWidth);

	// 拡大はしない (svg は viewBox が返されるらしいので例外)
	const height =
		fileType.ext === "svg" ? height2 : Math.min(dimension.height, height2);
	const width =
		fileType.ext === "svg" ? width2 : Math.min(dimension.width, width2);

	const img = await optimizeImage({
		format: "webp",
		height,
		image: buffer,
		quality: 80,
		width,
	});

	// うまくいかなかったら元の画像を返す
	if (!img) {
		return {
			data: buffer,
			contentType: fileType.mime,
		};
	}

	return {
		data: img.data,
		contentType: "image/webp",
	};
};
