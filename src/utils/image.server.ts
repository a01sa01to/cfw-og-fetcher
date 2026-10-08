import { detectXml } from "@file-type/xml";
import { FileTypeParser } from "file-type";
import imageSizeLib from "image-size";

const fileTypeParser = new FileTypeParser({ customDetectors: [detectXml] });

export const mimeType = async (buf: Uint8Array) => {
	const fileType = await fileTypeParser.fromBuffer(buf);
	return fileType?.mime;
};

export const imageSize = (buf: Uint8Array) => {
	const dimension = imageSizeLib(buf);
	return dimension;
};

export const supportedImageMimeTypes = [
	"image/svg+xml",
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif",
];
