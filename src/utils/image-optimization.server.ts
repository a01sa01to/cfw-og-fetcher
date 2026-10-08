import { optimizeImage } from "wasm-image-optimization";
import { imageSize, mimeType } from "./image.server";

export const optimizeImageBuffer = async (
	buffer: Uint8Array,
	outputWidth: number,
	outputHeight: number,
) => {
	const fileType = await mimeType(buffer);

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
		fileType === "image/svg+xml"
			? height2
			: Math.min(dimension.height, height2);
	const width =
		fileType === "image/svg+xml" ? width2 : Math.min(dimension.width, width2);

	const img = await optimizeImage({
		format: "webp",
		height,
		image: buffer,
		quality: 80,
		width,
	});

	return {
		data: img.data,
		contentType: "image/webp",
	};
};
