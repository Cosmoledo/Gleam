import Settings from "@/core/Settings";
import { getElement } from "./DOM";
import { rgb2Int } from "./Color";

import "@/prototypes/HTMLCanvasElement"; // splitSpriteSheet relies on the subImage patch

/** A `<canvas>` element paired with its 2D rendering context. Returned by {@link createNewCanvas} / {@link getCanvasConstruct} and inherited by {@link CanvasHolder}. */
export interface CanvasConstruct {
	/** The `<canvas>` element. */
	canvas: HTMLCanvasElement;
	/** Its 2D rendering context. */
	context: CanvasRenderingContext2D;
}

/**
 * Create a new `<canvas>` of the given size with its 2D context. Antialiasing defaults to `Settings.antialias`.
 */
export function createNewCanvas(
	width: number,
	height: number,
	antialias: boolean = Settings.antialias,
): CanvasConstruct {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext("2d")!;
	context.imageSmoothingEnabled = antialias;

	return {
		canvas,
		context,
	};
}

/**
 * Look up an existing canvas by CSS selector and return it with its 2D context.
 */
export function getCanvasConstruct(selector: string): CanvasConstruct {
	const canvas = getElement<HTMLCanvasElement>(selector);
	const context = canvas.getContext("2d")!;

	return {
		canvas,
		context,
	};
}

/**
 * Apply a CSS `filter` string to an image and return the result as a new canvas.
 * @param width default `image.width`
 * @param height default `image.height`
 */
export function applyFilterOnCanvas(
	image: HTMLCanvasElement | HTMLImageElement,
	filter: string,
	width: number = image.width,
	height: number = image.height,
): HTMLCanvasElement {
	const cc = createNewCanvas(width, height);

	cc.context.filter = filter;
	cc.context.drawImage(image, 0, 0);
	cc.context.filter = "none";

	return cc.canvas;
}

/**
 * Rotate the hue of an image by `hue` degrees via CSS `hue-rotate(...)` filter.
 */
export function rotateHue(
	image: HTMLCanvasElement | HTMLImageElement,
	hue: number,
	width?: number,
	height?: number,
): HTMLCanvasElement {
	return applyFilterOnCanvas(
		image,
		"hue-rotate(" + hue + "deg)",
		width,
		height,
	);
}

/**
 * Recolor an opaque canvas in place using composite operations,
 * preserving the alpha mask of the source image. Wraps the body in `save`/`restore`
 * so `fillStyle` / `globalCompositeOperation` writes don't leak to the caller's context.
 * https://stackoverflow.com/a/45201094
 */
export function changeColor(
	context: CanvasRenderingContext2D,
	oriImg: HTMLCanvasElement,
	newColor: string,
): void {
	context.save();

	context.clearRect(0, 0, oriImg.width, oriImg.height);
	context.globalCompositeOperation = "source-over";
	context.drawImage(oriImg, 0, 0, oriImg.width, oriImg.height);

	context.globalCompositeOperation = "color";
	context.fillStyle = newColor;
	context.fillRect(0, 0, oriImg.width, oriImg.height);

	context.globalCompositeOperation = "destination-in";
	context.drawImage(oriImg, 0, 0, oriImg.width, oriImg.height);

	context.restore();
}

/**
 * Split a sprite-sheet image into individual sprite canvases laid out as `elementsX × elementsY`.
 * Throws if the image dimensions don't divide evenly — sheets are expected to be authored that way.
 */
export function splitSpriteSheet(
	img: HTMLCanvasElement,
	elementsX: number,
	elementsY: number,
): HTMLCanvasElement[] {
	if (img.width % elementsX !== 0 || img.height % elementsY !== 0) {
		throw new Error(
			`SpriteSheet doesn't divide evenly: ${img.width}x${img.height} / ${elementsX}x${elementsY}`,
		);
	}

	const sizeX = img.width / elementsX;
	const sizeY = img.height / elementsY;
	const sprites: HTMLCanvasElement[] = [];

	Array.from({ length: elementsY }).forEach((_, row) => {
		Array.from({ length: elementsX }).forEach((_, col) => {
			sprites.push(img.subImage(col * sizeX, row * sizeY, sizeX, sizeY));
		});
	});

	return sprites;
}

/**
 * Count occurrences of each color in an image, keyed by `#rrggbb`.
 * `pixelAmount` multiplies each count and floors to int; values < 1 will drop low-count colors entirely (count rounds to 0).
 * `removeLowerThan` / `removeHigherThan` drop entries outside the range; `0` disables either bound.
 */
export function getUsedColors(
	image: HTMLCanvasElement,
	pixelAmount = 1,
	removeLowerThan = 0,
	removeHigherThan = 0,
): Map<string, number> {
	const data = image
		.getContext("2d")!
		.getImageData(0, 0, image.width, image.height).data;
	const counts = new Map<number, number>();

	for (let i = 0; i < data.length; i += 4) {
		const key = rgb2Int(data[i], data[i + 1], data[i + 2]);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	if (pixelAmount < 1 || removeLowerThan > 0 || removeHigherThan > 0) {
		counts.forEach((value, key) => {
			const newAmount = (value * pixelAmount) | 0;

			if (
				newAmount === 0 ||
				(removeLowerThan > 0 && newAmount < removeLowerThan) ||
				(removeHigherThan > 0 && newAmount > removeHigherThan)
			) {
				counts.delete(key);
			} else {
				counts.set(key, newAmount);
			}
		});
	}

	const result = new Map<string, number>();
	counts.forEach((count, rgbInt) => {
		result.set("#" + (0x1000000 + rgbInt).toString(16).slice(1), count);
	});

	return result;
}
