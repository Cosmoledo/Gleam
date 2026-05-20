import { randomBeetweenInt } from "./Math";
import Settings from "@/core/Settings";

/**
 * Recolor an opaque canvas in place using composite operations,
 * preserving the alpha mask of the source image.
 * https://stackoverflow.com/a/45201094
 */
export function changeColor(
	context: CanvasRenderingContext2D,
	oriImg: HTMLCanvasElement,
	newColor: string,
): void {
	context.clearRect(0, 0, oriImg.width, oriImg.height);
	context.globalCompositeOperation = "source-over";
	context.drawImage(oriImg, 0, 0, oriImg.width, oriImg.height);

	context.globalCompositeOperation = "color";
	context.fillStyle = newColor;
	context.fillRect(0, 0, oriImg.width, oriImg.height);

	context.globalCompositeOperation = "destination-in";
	context.drawImage(oriImg, 0, 0, oriImg.width, oriImg.height);

	context.globalCompositeOperation = "source-over";
}

/**
 * Create a new `<canvas>` of the given size with its 2D context, with all
 * vendor-prefixed `imageSmoothingEnabled` flags set. Antialiasing defaults to `Settings.antialias`.
 */
export function createNewCanvas(
	width: number,
	height: number,
	antialias: boolean = Settings.antialias,
): GameLIB.CanvasConstruct {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext("2d") as CanvasRenderingContext2D;
	context.imageSmoothingEnabled = antialias; // Standard
	(context as any).oImageSmoothingEnabled = antialias; // Opera
	(context as any).webkitImageSmoothingEnabled = antialias; // Safari
	(context as any).msImageSmoothingEnabled = antialias; // IE

	return {
		canvas,
		context,
	};
}

/**
 * Apply a CSS `filter` string to an image and return the result as a new canvas.
 */
export function applyFilterOnCanvas(
	image: HTMLCanvasElement,
	filter: string,
	width: number = image.width,
	height: number = image.height,
): HTMLCanvasElement {
	const cc = createNewCanvas(width, height);

	cc.context.filter = filter;
	cc.context.drawImage(image, 0, 0);

	return cc.canvas;
}

/**
 * Rotate the hue of an image by `hue` degrees via CSS `hue-rotate(...)` filter.
 */
export function rotateHue(
	image: HTMLCanvasElement,
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
 * Convert an `(r, g, b)` triple (0-255) to a `#rrggbb` hex string.
 * Low-level; prefer `Color.toHex()` outside hot per-pixel loops.
 */
export function rgb2hex(red: number, green: number, blue: number): string {
	return (
		"#" +
		(0x1000000 + (blue | (green << 8) | (red << 16))).toString(16).slice(1)
	);
}

/**
 * Convert a `#rgb` or `#rrggbb` hex string to an `[r, g, b]` integer array.
 * Low-level; prefer `Color.fromHex()` outside hot per-pixel loops.
 */
export function hex2rgb(hex: string): number[] {
	return hex
		.replace(
			/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
			(_: string, r: string, g: string, b: string) =>
				"#" + r + r + g + g + b + b,
		)
		.substring(1)
		.match(/.{2}/g)!
		.map((x: string) => parseInt(x, 16));
}

/**
 * Wrap `value` so it stays in `[min, max)`, repeatedly adding/subtracting `adjustBy`
 * (defaults to `max`). Useful for cyclic ranges like angles.
 */
export function wrapValue(
	value: number,
	min: number,
	max: number,
	adjustBy: number = max,
): number {
	while (value < min) {
		value += adjustBy;
	}

	while (value >= max) {
		value -= adjustBy;
	}

	return value;
}

/**
 * Wrap an angle in radians into `[-PI, PI)`.
 */
export function wrapRadians(angle: number): number {
	return wrapValue(angle, -Math.PI, Math.PI, Math.PI * 2);
}

/**
 * Random `#rgb` short hex color.
 */
export function randomHex(): string {
	return "#" + Math.random().toString(16).slice(2, 6);
}

/**
 * Random `[r, g, b]` integer array; each channel uniform in `[min, max]`.
 */
export function randomRgb(min = 0, max = 255): number[] {
	return new Array(3).fill(0).map(() => randomBeetweenInt(min, max));
}

/**
 * Split an array into chunks of at most `maxLength` elements each.
 */
export function splitArray<T = any>(array: T[], maxLength: number): T[][] {
	const result: T[][] = [];
	let part: T[] = [];

	for (let i = 0; i < array.length; i++) {
		part.push(array[i]);

		if (part.length === maxLength || i === array.length - 1) {
			result.push(part);
			part = [];
		}
	}

	return result;
}

/**
 * Convert a 1D index to `{x, y}` for a 2D grid of the given row width.
 */
export function convert1DTo2D(index: number, width: number): GameLIB.Vector2 {
	return {
		x: index % width,
		y: (index / width) | 0,
	};
}

/**
 * Convert 2D `(x, y)` coordinates to a 1D index for a grid of the given row width.
 */
export function convert2DTo1D(
	indexX: number,
	indexY: number,
	width: number,
): number {
	return indexX + width * indexY;
}

/**
 * Pick a uniformly random element from `array`.
 */
export function randomItem<T>(array: T[]): T {
	return array[(Math.random() * array.length) | 0];
}

/**
 * Generate a `height × width` 2D array filled with `defaultValue`.
 * If `defaultValue` is a function it is invoked per cell.
 */
export function generateArray<T>(
	height: number,
	width: number,
	defaultValue: T,
): T[][] {
	const array: T[][] = [];

	for (let y = 0; y < height; y++) {
		array[y] = [];

		for (let x = 0; x < width; x++) {
			array[y][x] =
				typeof defaultValue === "function"
					? defaultValue()
					: defaultValue;
		}
	}

	return array;
}

/**
 * Look up an existing canvas by CSS selector and return it with its 2D context.
 */
export function getCanvasConstruct(selector: string): GameLIB.CanvasConstruct {
	const canvas = document.querySelector(selector) as HTMLCanvasElement;
	const context = canvas.getContext("2d") as CanvasRenderingContext2D;

	return {
		canvas,
		context,
	};
}

/**
 * Promise that resolves after `time` milliseconds.
 */
export function delay(time: number): Promise<void> {
	return new Promise(res => setTimeout(res, time));
}

/**
 * Split a sprite-sheet image into individual sprite canvases laid out as `elementsX × elementsY`.
 */
export function SpriteSheetHandler(
	img: HTMLCanvasElement,
	elementsX: number,
	elementsY: number,
): HTMLCanvasElement[] {
	const sprites: HTMLCanvasElement[] = [];

	const sizeX = img.width / elementsX;
	const sizeY = img.height / elementsY;

	for (let y = 0; y < img.height; y += sizeY) {
		for (let x = 0; x < img.width; x += sizeX) {
			sprites.push(img.subImage(x, y, sizeX, sizeY));
		}
	}

	return sprites;
}

/**
 * Count occurrences of each color in an image, keyed by `#rrggbb`.
 * Optionally scale counts by `pixelAmount` and drop entries below/above thresholds
 * (`removeLowerThan` / `removeHigherThan`, both ignored when `0`).
 */
export function getUsedColors(
	image: HTMLCanvasElement,
	pixelAmount = 1,
	removeLowerThan = 0,
	removeHigherThan = 0,
): Map<string, number> {
	const data = (
		image.getContext("2d") as CanvasRenderingContext2D
	).getImageData(0, 0, image.width, image.height).data;
	const counts = new Map<number, number>();

	for (let i = 0; i < data.length; i += 4) {
		const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
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

/**
 * Call `callback` immediately on mousedown of the matched element, then keep
 * calling it every `delay` ms until mouseup or mouseout. Throws if no element matches.
 */
export function doWhileClicked(
	querySelector: string,
	callback: () => void,
	delay = 200,
): void {
	const element = document.querySelector(querySelector);
	if (!element) {
		throw new Error("Element does not exists!");
	}

	let timeout: any;

	element.addEventListener(
		"mousedown",
		() => {
			callback();
			timeout = setInterval(() => callback(), delay);
		},
		false,
	);
	element.addEventListener("mouseup", () => clearInterval(timeout), false);
	element.addEventListener("mouseout", () => clearInterval(timeout), false);
}

/**
 * `querySelector` variant that throws when no element matches.
 * Optionally narrow the return type per tag, e.g. `getElement<HTMLCanvasElement>("canvas")`.
 */
export function getElement<T extends Element = HTMLElement>(
	query: string,
	parent: ParentNode = document,
): T {
	const el = parent.querySelector<T>(query);
	if (!el) {
		throw new Error(`Element not found: ${query}`);
	}
	return el;
}

/**
 * Resolves the next time `type` fires on `element` (one-shot listener).
 */
export async function waitForEvent<K extends keyof HTMLElementEventMap>(
	type: K,
	element: Element,
): Promise<void> {
	return new Promise(res =>
		element.addEventListener(type, () => res(), {
			once: true,
		}),
	);
}

/**
 * Returns `get` / `set` helpers for CSS custom properties (`--name`) on the `:root` element.
 */
export function initCSSVariables() {
	const root = getElement(":root");

	return {
		root,
		get(name: string): string {
			return getComputedStyle(root).getPropertyValue("--" + name);
		},
		set(name: string, value: string): void {
			root.style.setProperty("--" + name, value);
		},
	};
}

/**
 * Apply a partial `CSSStyleDeclaration` to an element.
 */
export function styleElement(
	element: HTMLElement,
	styles: Partial<CSSStyleDeclaration>,
): void {
	for (const [key, value] of Object.entries(styles)) {
		element.style.setProperty(key, value as string);
	}
}

/**
 * Toggle `element.style.display` between `""` (active) and `"none"` (inactive).
 */
export function setDisplay(element: HTMLElement, active: boolean): void {
	element.style.display = active ? "" : "none";
}

/**
 * Toggle `element.style.visibility` between `""` (active) and `"hidden"` (inactive).
 */
export function setVisibility(element: HTMLElement, active: boolean): void {
	element.style.visibility = active ? "" : "hidden";
}

/**
 * Heuristic: returns `true` if the user-agent looks mobile or the page exposes `window.orientation`.
 */
export function isMobile(): boolean {
	const mobileTest1 =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);

	// https://coderwall.com/p/i817wa/one-line-function-to-detect-mobile-devices-with-javascript
	const mobileTest2 =
		typeof window.orientation !== "undefined" ||
		navigator.userAgent.indexOf("IEMobile") !== -1;

	return mobileTest1 || mobileTest2;
}

/**
 * HSL → RGB channel helper used by `Color.fromHSL`. Inputs are normalized to `[0, 1]`.
 */
export function hueToRGB(p: number, q: number, t: number): number {
	if (t < 0) {
		t += 1;
	}

	if (t > 1) {
		t -= 1;
	}

	if (t < 1 / 6) {
		return p + (q - p) * 6 * t;
	}

	if (t < 1 / 2) {
		return q;
	}

	if (t < 2 / 3) {
		return p + (q - p) * (2 / 3 - t) * 6;
	}

	return p;
}
