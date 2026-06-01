import { convert2DTo1D } from "@/utilities/Grid";
import { createNewCanvas } from "@/utilities/Canvas";
import { hex2rgb, type RGB, rgb2Int } from "@/utilities/Color";

declare global {
	interface HTMLCanvasElement {
		autoCrop(): HTMLCanvasElement;
		clone(): HTMLCanvasElement;
		flipX(offsetX?: number): HTMLCanvasElement;
		flipY(offsetY?: number): HTMLCanvasElement;
		getPixelAt(x: number, y: number, output?: "integer"): number;
		getPixelAt(x: number, y: number, output: "array"): [...RGB, number];
		getPixelAt(
			x: number,
			y: number,
			output: "json",
		): { r: number; g: number; b: number; a: number };
		getPixelAt(x: number, y: number, output: "string"): string;
		replaceColors(replacements: Record<string, string>): HTMLCanvasElement;
		hasAnyColor(): boolean;
		resize(size: number, isWidth?: boolean): HTMLCanvasElement;
		rotateBy(radians: number): HTMLCanvasElement;
		rotateByAligned(radians: number): HTMLCanvasElement;
		scaleBy(scaleX?: number, scaleY?: number): HTMLCanvasElement;
		subImage(
			x: number,
			y: number,
			w?: number,
			h?: number,
		): HTMLCanvasElement;
		toImage(): HTMLImageElement;
	}
}

HTMLCanvasElement.prototype.hasAnyColor = function (): boolean {
	const rgba = this.getContext("2d")!.getImageData(
		0,
		0,
		this.width,
		this.height,
	).data;

	for (const value of rgba) {
		if (value !== 0) {
			return true;
		}
	}

	return false;
};

HTMLCanvasElement.prototype.getPixelAt = function (
	this: HTMLCanvasElement,
	x: number,
	y: number,
	output: "integer" | "array" | "json" | "string" = "integer",
) {
	let r = 0;
	let g = 0;
	let b = 0;
	let a = 0;

	if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
		const data = this.getContext("2d")!.getImageData(x, y, 1, 1).data;
		r = data[0];
		g = data[1];
		b = data[2];
		a = data[3];
	}

	switch (output) {
		case "array":
			return [r, g, b, a];

		case "json":
			return { r, g, b, a };

		case "string":
			return `rgba(${r}, ${g}, ${b}, ${a})`;

		case "integer":
		default:
			return rgb2Int(r, g, b, a / 255);
	}
} as HTMLCanvasElement["getPixelAt"];

/**
 * Replace pixel colors by RGB hex key. Alpha is ignored — fully-transparent pixels are skipped, semi-transparent pixels keep their alpha.
 */
HTMLCanvasElement.prototype.replaceColors = function (
	replacements: Record<string, string>,
): HTMLCanvasElement {
	const lookup = new Map<number, RGB>();
	for (const from in replacements) {
		const [fr, fg, fb] = hex2rgb(from);
		const [tr, tg, tb] = hex2rgb(replacements[from]);
		lookup.set(rgb2Int(fr, fg, fb), [tr, tg, tb]);
	}

	const context = this.getContext("2d")!;
	const image = context.getImageData(0, 0, this.width, this.height);
	const { data } = image;

	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] === 0) {
			continue;
		}

		const replacement = lookup.get(
			rgb2Int(data[i], data[i + 1], data[i + 2]),
		);

		if (replacement !== undefined) {
			data[i] = replacement[0];
			data[i + 1] = replacement[1];
			data[i + 2] = replacement[2];
		}
	}

	context.putImageData(image, 0, 0);
	return this;
};

HTMLCanvasElement.prototype.rotateBy = function (
	radians: number,
): HTMLCanvasElement {
	const diam = Math.ceil(
		Math.sqrt(this.width * this.width + this.height * this.height),
	);
	const cc = createNewCanvas(diam, diam);

	cc.context.translate(diam * 0.5, diam * 0.5);
	cc.context.rotate(radians);
	cc.context.drawImage(this, -this.width * 0.5, -this.height * 0.5);
	cc.context.translate(-diam * 0.5, -diam * 0.5);

	return cc.canvas;
};

HTMLCanvasElement.prototype.rotateByAligned = function (
	radians: number,
): HTMLCanvasElement {
	const cc = createNewCanvas(this.width, this.height);

	cc.context.translate(this.width * 0.5, this.height * 0.5);
	cc.context.rotate(radians);
	cc.context.translate(-this.width * 0.5, -this.height * 0.5);
	cc.context.drawImage(this, 0, 0);

	return cc.canvas;
};

// https://stackoverflow.com/a/58882518
HTMLCanvasElement.prototype.autoCrop = function (): HTMLCanvasElement {
	const topLeft = {
		x: this.width,
		y: this.height,
		update(x: number, y: number): void {
			this.x = Math.min(this.x, x);
			this.y = Math.min(this.y, y);
		},
	};

	const bottomRight = {
		x: 0,
		y: 0,
		update(x: number, y: number): void {
			this.x = Math.max(this.x, x);
			this.y = Math.max(this.y, y);
		},
	};

	const context = this.getContext("2d")!;

	const imageData = context.getImageData(0, 0, this.width, this.height);

	Array.from({ length: this.height }).forEach((_, y) => {
		Array.from({ length: this.width }).forEach((_, x) => {
			const alpha =
				imageData.data[convert2DTo1D(x * 4, y * 4, this.width) + 3];

			if (alpha !== 0) {
				topLeft.update(x, y);
				bottomRight.update(x, y);
			}
		});
	});

	const width = bottomRight.x - topLeft.x + 1;
	const height = bottomRight.y - topLeft.y + 1;

	return this.subImage(topLeft.x, topLeft.y, width, height);
};

HTMLCanvasElement.prototype.scaleBy = function (
	scaleX: number = 1,
	scaleY?: number,
): HTMLCanvasElement {
	const sy = scaleY === undefined ? scaleX : scaleY;

	if (scaleX <= 0 || sy <= 0) {
		throw new Error(
			`scaleBy requires positive scale factors, got (${scaleX}, ${sy})`,
		);
	}

	if (scaleX === 1 && sy === 1) {
		return this;
	}

	const cc = createNewCanvas(this.width * scaleX, this.height * sy);

	cc.context.scale(scaleX, sy);
	cc.context.drawImage(this, 0, 0);

	return cc.canvas;
};

HTMLCanvasElement.prototype.resize = function (
	size: number,
	isWidth: boolean = true,
): HTMLCanvasElement {
	if (isWidth) {
		return this.scaleBy(size / this.width);
	}

	return this.scaleBy(size / this.height);
};

HTMLCanvasElement.prototype.flipX = function (offsetX = 0): HTMLCanvasElement {
	const cc = createNewCanvas(this.width, this.height);

	cc.context.translate(this.width + offsetX, 0);
	cc.context.scale(-1, 1);

	cc.context.drawImage(this, 0, 0);

	return cc.canvas;
};

HTMLCanvasElement.prototype.flipY = function (offsetY = 0): HTMLCanvasElement {
	const cc = createNewCanvas(this.width, this.height);

	cc.context.translate(0, this.height + offsetY);
	cc.context.scale(1, -1);

	cc.context.drawImage(this, 0, 0);

	return cc.canvas;
};

HTMLCanvasElement.prototype.subImage = function (
	x: number,
	y: number,
	w: number,
	h: number,
): HTMLCanvasElement {
	if (w === undefined) {
		w = this.width;
	}

	if (h === undefined) {
		h = this.height;
	}

	const cc = createNewCanvas(w, h);
	cc.context.drawImage(this, x, y, w, h, 0, 0, w, h);

	return cc.canvas;
};

HTMLCanvasElement.prototype.clone = function (): HTMLCanvasElement {
	const cc = createNewCanvas(this.width, this.height);
	cc.canvas.id = this.id;
	cc.context.drawImage(this, 0, 0);

	for (const key in this.dataset) {
		cc.canvas.dataset[key] = this.dataset[key];
	}

	return cc.canvas;
};

HTMLCanvasElement.prototype.toImage = function (): HTMLImageElement {
	const img = document.createElement("img");
	img.src = this.toDataURL();
	return img;
};
