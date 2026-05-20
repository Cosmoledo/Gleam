import { clamp } from "./Number";
import { randomBeetweenInt } from "./Math";
import Game from "@/core/Game";

export const shadeColor = (color: string, percent: number): string => {
	const f = parseInt(color.slice(1), 16);
	const t = percent < 0 ? 0 : 255;
	const p = Math.abs(percent);
	const R = f >> 16;
	const G = (f >> 8) & 0x00ff;
	const B = f & 0x0000ff;

	return (
		"#" +
		(
			0x1000000 +
			(Math.round((t - R) * p) + R) * 0x10000 +
			(Math.round((t - G) * p) + G) * 0x100 +
			(Math.round((t - B) * p) + B)
		)
			.toString(16)
			.slice(1)
	);
};

export const _colorChannelMixer = (
	colorChannelA: number,
	colorChannelB: number,
	amountToMix: number,
): number => {
	const channelA = colorChannelA * (1 - amountToMix);
	const channelB = colorChannelB * amountToMix;
	return (channelA + channelB) | 0;
};

/*
 * https://stackoverflow.com/a/32171077
 */
export const colorMixer = (
	start: number[],
	end: number[],
	amountToMix: number,
	alpha = 1,
	asString = true,
): string | number[] => {
	alpha = clamp(alpha, 0, 1);

	const r = _colorChannelMixer(start[0], end[0], amountToMix);
	const g = _colorChannelMixer(start[1], end[1], amountToMix);
	const b = _colorChannelMixer(start[2], end[2], amountToMix);

	if (asString) {
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	return [r, g, b, (alpha * 255) | 0];
};

/*
 * https://stackoverflow.com/a/45201094
 */
export const changeColor = (
	context: CanvasRenderingContext2D,
	oriImg: HTMLCanvasElement,
	newColor: string,
): void => {
	context.clearRect(0, 0, oriImg.width, oriImg.height);
	context.globalCompositeOperation = "source-over";
	context.drawImage(oriImg, 0, 0, oriImg.width, oriImg.height);

	context.globalCompositeOperation = "color";
	context.fillStyle = newColor;
	context.fillRect(0, 0, oriImg.width, oriImg.height);

	context.globalCompositeOperation = "destination-in";
	context.drawImage(oriImg, 0, 0, oriImg.width, oriImg.height);

	context.globalCompositeOperation = "source-over";
};

export const createNewCanvas = (
	width: number,
	height: number,
	antialias: boolean = Game.settings.antialias,
): GameLIB.CanvasConstruct => {
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
};

export const applyFilterOnCanvas = (
	image: HTMLCanvasElement,
	filter: string,
	width: number = image.width,
	height: number = image.height,
): HTMLCanvasElement => {
	const cc = createNewCanvas(width, height);

	cc.context.filter = filter;
	cc.context.drawImage(image, 0, 0);

	return cc.canvas;
};

export const rotateHue = (
	image: HTMLCanvasElement,
	hue: number,
	width?: number,
	height?: number,
): HTMLCanvasElement => {
	return applyFilterOnCanvas(
		image,
		"hue-rotate(" + hue + "deg)",
		width,
		height,
	);
};

export const rgb2hex = (red: number, green: number, blue: number): string =>
	"#" +
	(0x1000000 + (blue | (green << 8) | (red << 16))).toString(16).slice(1);

export const hex2rgb = (hex: string): number[] => {
	return hex
		.replace(
			/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
			(_: string, r: string, g: string, b: string) =>
				"#" + r + r + g + g + b + b,
		)
		.substring(1)
		.match(/.{2}/g)!
		.map((x: string) => parseInt(x, 16));
};

export const wrapValue = (
	value: number,
	min: number,
	max: number,
	adjustBy: number = max,
): number => {
	while (value < min) {
		value += adjustBy;
	}

	while (value >= max) {
		value -= adjustBy;
	}

	return value;
};

export const wrapRadians = (angle: number): number => {
	return wrapValue(angle, -Math.PI, Math.PI, Math.PI * 2);
};

export const randomHex = (): string =>
	"#" + Math.random().toString(16).slice(2, 6);

export const randomRgb = (min = 0, max = 255): number[] =>
	new Array(3).fill(0).map(() => randomBeetweenInt(min, max));

export const splitArray = <T = any>(array: T[], maxLength: number): T[][] => {
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
};

export const convert1DTo2D = (
	index: number,
	width: number,
): GameLIB.Vector2 => {
	return {
		x: index % width,
		y: (index / width) | 0,
	};
};

export const convert2DTo1D = (
	indexX: number,
	indexY: number,
	width: number,
): number => {
	return indexX + width * indexY;
};

export const randomItem = <T>(array: T[]): T => {
	return array[(Math.random() * array.length) | 0];
};

export const generateArray = <T>(
	height: number,
	width: number,
	defaultValue: T,
): T[][] => {
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
};

export const getCanvasConstruct = (
	selector: string,
): GameLIB.CanvasConstruct => {
	const canvas = document.querySelector(selector) as HTMLCanvasElement;
	const context = canvas.getContext("2d") as CanvasRenderingContext2D;

	return {
		canvas,
		context,
	};
};

export const delay = (time: number): Promise<void> =>
	new Promise(res => setTimeout(res, time));

export const SpriteSheetHandler = (
	img: HTMLCanvasElement,
	elementsX: number,
	elementsY: number,
): HTMLCanvasElement[] => {
	const sprites: HTMLCanvasElement[] = [];

	const sizeX = img.width / elementsX;
	const sizeY = img.height / elementsY;

	for (let y = 0; y < img.height; y += sizeY) {
		for (let x = 0; x < img.width; x += sizeX) {
			sprites.push(img.subImage(x, y, sizeX, sizeY));
		}
	}

	return sprites;
};

export const getUsedColors = (
	image: HTMLCanvasElement,
	pixelAmount = 1,
	removeLowerThan = 0,
	removeHigherThan = 0,
): Map<string, number> => {
	const data = (
		image.getContext("2d") as CanvasRenderingContext2D
	).getImageData(0, 0, image.width, image.height).data;
	const allColors: Map<string, number> = new Map();

	for (let i = 0; i < data.length; i += 4) {
		const color = rgb2hex(data[i], data[i + 1], data[i + 2]);

		if (allColors.has(color)) {
			allColors.set(color, allColors.get(color)! + 1);
		} else {
			allColors.set(color, 1);
		}
	}

	if (pixelAmount < 1 || removeLowerThan > 0 || removeHigherThan > 0) {
		allColors.forEach((value, key) => {
			const newAmount = (value * pixelAmount) | 0;

			if (
				newAmount === 0 ||
				(removeLowerThan > 0 && newAmount < removeLowerThan) ||
				(removeHigherThan > 0 && newAmount > removeHigherThan)
			) {
				allColors.delete(key);
			} else {
				allColors.set(key, newAmount);
			}
		});
	}

	return allColors;
};

export const doWhileClicked = (
	querySelector: string,
	callback: () => void,
	delay = 200,
): void => {
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
};

export function getElement(query: string, parent: any = document): HTMLElement {
	return parent.querySelector(query)!;
}

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

export function styleElement(
	element: HTMLElement,
	styles: Partial<CSSStyleDeclaration>,
): void {
	for (const [key, value] of Object.entries(styles)) {
		element.style.setProperty(key, value as string);
	}
}

export function setDisplay(element: HTMLElement, active: boolean): void {
	element.style.display = active ? "" : "none";
}

export function setVisibility(element: HTMLElement, active: boolean): void {
	element.style.visibility = active ? "" : "hidden";
}
