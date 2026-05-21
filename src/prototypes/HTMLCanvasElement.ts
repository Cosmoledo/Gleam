import { createNewCanvas } from "@/utilities/Canvas";
import { rgb2hex, hex2rgb } from "@/utilities/Color";
import { convert2DTo1D } from "@/utilities/Grid";

HTMLCanvasElement.prototype.hasAnyColor = function (): boolean {
	const rgba = (
		this.getContext("2d") as CanvasRenderingContext2D
	).getImageData(0, 0, this.width, this.height).data;

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

	if (x >= 0 && x <= this.width && y >= 0 && y <= this.height) {
		const data = (
			this.getContext("2d") as CanvasRenderingContext2D
		).getImageData(x, y, 1, 1).data;
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
			return (r << 24) + (g << 16) + (b << 8) + a;
	}
} as HTMLCanvasElement["getPixelAt"];

HTMLCanvasElement.prototype.replaceColors = function (
	replacements: Record<string, string>,
): HTMLCanvasElement {
	const repl: any = {};
	for (const key in replacements) {
		repl[key.toLowerCase()] = replacements[key].toLowerCase();
	}
	replacements = repl;

	const context = this.getContext("2d")!;

	const image = context.getImageData(0, 0, this.width, this.height);
	const { data } = image;

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i + 0];
		const g = data[i + 1];
		const b = data[i + 2];

		const value = rgb2hex(r, g, b);

		for (const key in replacements) {
			if (value !== key) {
				continue;
			}

			const newValue = hex2rgb(replacements[key]);
			data[i + 0] = newValue[0];
			data[i + 1] = newValue[1];
			data[i + 2] = newValue[2];
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

	for (let y = 0; y < this.height; y++) {
		for (let x = 0; x < this.width; x++) {
			const alpha =
				imageData.data[convert2DTo1D(x * 4, y * 4, this.width) + 3];

			if (alpha !== 0) {
				topLeft.update(x, y);
				bottomRight.update(x, y);
			}
		}
	}

	const width = bottomRight.x - topLeft.x;
	const height = bottomRight.y - topLeft.y;

	return this.subImage(topLeft.x, topLeft.y, width, height);
};

HTMLCanvasElement.prototype.scaleBy = function (
	scaleX: number = 1,
	scaleY?: number,
): HTMLCanvasElement {
	if (scaleX === 1 && (scaleY === undefined || scaleY === 1)) {
		return this;
	}

	const cc = createNewCanvas(
		this.width * scaleX,
		this.height * (scaleY || scaleX),
	);

	cc.context.scale(scaleX, scaleY || scaleX);
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
	w = w || this.width;
	h = h || this.height;
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
