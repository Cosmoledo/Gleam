import Rect from "@/math/Rect";
import { createNewCanvas } from "@/utilities/Canvas";
import type { Vector2, Vector4 } from "@/math/Vec2";

type Mode = "fill" | "stroke";

// #region fillBar
declare global {
	interface CanvasRenderingContext2D {
		/**
		 * Fill a two-color bar sized by `amount`. Writes `fillStyle`; persists on the context — wrap in `save()`/`restore()` to preserve prior state.
		 * @param c1 background, default `"white"`
		 * @param c2 foreground, default `"black"`
		 */
		fillBar(rect: Vector4, amount: number, c1?: string, c2?: string): void;
	}
}

CanvasRenderingContext2D.prototype.fillBar = function (
	rect,
	amount,
	c1 = "white",
	c2 = "black",
): void {
	this.fillStyle = c1;
	this.fillRect(rect.x, rect.y, rect.w, rect.h);

	this.fillStyle = c2;
	this.fillRect(rect.x, rect.y, rect.w * amount, rect.h);
};
// #endregion

// #region fillFramedBar
declare global {
	interface CanvasRenderingContext2D {
		/**
		 * Fill a three-layer framed bar (outer band, frame, fill scaled by `amount`). Writes `fillStyle`; persists on the context — wrap in `save()`/`restore()` to preserve prior state.
		 * @param amount fill fraction in `[0, 1]`. Default `0.8`. `≤ 0` skips the fill layer.
		 * @param padding frame inset on all sides. Default `4`.
		 * @param colors outer band, frame, fill. Default `["white", "black", "red"]`.
		 */
		fillFramedBar(
			rect: Vector4,
			amount?: number,
			padding?: number,
			colors?: [string, string, string],
		): void;
	}
}

CanvasRenderingContext2D.prototype.fillFramedBar = function (
	rect,
	amount = 0.8,
	padding = 4,
	colors = ["white", "black", "red"],
): void {
	this.fillStyle = colors[0];
	this.fillRect(rect.x, rect.y, rect.w, rect.h);

	this.fillStyle = colors[1];
	this.fillRect(
		rect.x + padding,
		rect.y + padding,
		rect.w - padding * 2,
		rect.h - padding * 2,
	);

	if (amount > 0) {
		this.fillStyle = colors[2];
		this.fillRect(
			rect.x + padding,
			rect.y + padding,
			amount * (rect.w - padding * 2),
			rect.h - padding * 2,
		);
	}
};
// #endregion

// #region drawCircle
declare global {
	interface CanvasRenderingContext2D {
		/**
		 * Draws a circle centered at `vecPos`.
		 * @param amount sweep fraction in `[0, 1]`. Default `1` (full circle).
		 */
		drawCircle(
			vecPos: Vector2,
			rad: number,
			mode: Mode,
			amount?: number,
		): void;
	}
}

CanvasRenderingContext2D.prototype.drawCircle = function (
	vecPos,
	rad,
	mode,
	amount = 1,
): void {
	this.beginPath();
	this.arc(vecPos.x, vecPos.y, rad, 0, amount * 2 * Math.PI);

	this[mode]();
};
// #endregion

// #region drawRect
declare global {
	interface CanvasRenderingContext2D {
		/** Draws a rectangle (from `Vector4` or `x, y, w, h`). */
		drawRect(rect: Vector4, mode: Mode): void;
		drawRect(x: number, y: number, w: number, h: number, mode: Mode): void;
	}
}

CanvasRenderingContext2D.prototype.drawRect = function (
	...args: [Vector4, Mode] | [number, number, number, number, Mode]
): void {
	let x: number;
	let y: number;
	let w: number;
	let h: number;
	let mode: Mode;

	if (typeof args[0] === "number") {
		[x, y, w, h, mode] = args as [number, number, number, number, Mode];
	} else {
		[{ x, y, w, h }, mode] = args as [Vector4, Mode];
	}

	this.beginPath();
	this.rect(x, y, w, h);
	this[mode]();
};
// #endregion

// #region drawRoundRect
interface DrawRoundRectOptions {
	/** Inset from the rect edges. Default `0` (no inset). */
	padding?: number;
	/** Corner radius. Default `16`. */
	radius?: number;
}

declare global {
	interface CanvasRenderingContext2D {
		/** Draw a rounded rectangle from a `Vector4` or `x, y, w, h` plus an options bag. Delegates the corner path to native `roundRect` (Safari 16+ / Chrome 99+ / Firefox 113+). */
		drawRoundRect(
			rect: Vector4,
			mode: Mode,
			options?: DrawRoundRectOptions,
		): void;
		drawRoundRect(
			x: number,
			y: number,
			w: number,
			h: number,
			mode: Mode,
			options?: DrawRoundRectOptions,
		): void;
	}
}

CanvasRenderingContext2D.prototype.drawRoundRect = function (
	...args:
		| [Vector4, mode: Mode, DrawRoundRectOptions?]
		| [number, number, number, number, mode: Mode, DrawRoundRectOptions?]
): void {
	let x: number;
	let y: number;
	let w: number;
	let h: number;
	let mode: Mode;
	let options: DrawRoundRectOptions | undefined;

	if (typeof args[0] === "number") {
		[x, y, w, h, mode, options] = args as [
			number,
			number,
			number,
			number,
			Mode,
			DrawRoundRectOptions?,
		];
	} else {
		[{ x, y, w, h }, mode, options] = args as [
			Vector4,
			Mode,
			DrawRoundRectOptions?,
		];
	}

	const { padding = 0, radius = 16 } = options ?? {};

	x += padding;
	y += padding;
	w -= padding * 2;
	h -= padding * 2;

	this.beginPath();
	this.roundRect(x, y, w, h, radius);
	this[mode]();
};
// #endregion

// #region strokeDottedRect
declare global {
	interface CanvasRenderingContext2D {
		/** Stroke a dotted rectangle. Writes `lineWidth` and `setLineDash` — wrap in `save()`/`restore()` to preserve prior state. */
		strokeDottedRect(rect: Vector4): void;
	}
}

CanvasRenderingContext2D.prototype.strokeDottedRect = function (rect): void {
	this.setLineDash([15, 15]);
	this.lineWidth = 5;
	this.beginPath();
	this.moveTo(rect.x, rect.y);
	this.lineTo(rect.x + rect.w, rect.y);
	this.lineTo(rect.x + rect.w, rect.y + rect.h);
	this.lineTo(rect.x, rect.y + rect.h);
	this.lineTo(rect.x, rect.y);
	this.stroke();
};
// #endregion

// #region strokeLine
declare global {
	interface CanvasRenderingContext2D {
		/** Draw a line segment from `(x1, y1)` to `(x2, y2)`. */
		strokeLine(x1: number, y1: number, x2: number, y2: number): void;
	}
}

CanvasRenderingContext2D.prototype.strokeLine = function (
	x1,
	y1,
	x2,
	y2,
): void {
	this.beginPath();
	this.moveTo(x1, y1);
	this.lineTo(x2, y2);
	this.stroke();
	this.closePath();
};
// #endregion

// #region drawPolygon
declare global {
	interface CanvasRenderingContext2D {
		/**
		 * Draw a regular polygon centered in `rect`, with vertices on a circle of radius `min(rect.w, rect.h) * 0.5`.
		 */
		drawPolygon(sides: number, rect: Vector4, mode: Mode): void;
	}
}

CanvasRenderingContext2D.prototype.drawPolygon = function (
	sides,
	rect,
	mode,
): void {
	const rad = Math.min(rect.w, rect.h) * 0.5;
	const Xcenter = rect.x + rect.w * 0.5;
	const Ycenter = rect.y + rect.h * 0.5;

	this.beginPath();
	this.moveTo(Xcenter + rad, Ycenter);

	for (let i = 1; i <= sides; i++) {
		this.lineTo(
			Math.round(Xcenter + rad * Math.cos((i * 2 * Math.PI) / sides)),
			Math.round(Ycenter + rad * Math.sin((i * 2 * Math.PI) / sides)),
		);
	}

	this.closePath();
	this[mode]();
};
// #endregion

// #region drawTriangle
declare global {
	interface CanvasRenderingContext2D {
		/** Draw a triangle: top-left → top-right → bottom-center. */
		drawTriangle(rect: Vector4, mode: Mode): void;
	}
}

CanvasRenderingContext2D.prototype.drawTriangle = function (rect, mode): void {
	this.beginPath();
	this.moveTo(rect.x, rect.y);
	this.lineTo(rect.x + rect.w, rect.y);
	this.lineTo(rect.x + rect.w * 0.5, rect.y + rect.h);
	this[mode]();
};
// #endregion

// #region writeText
declare global {
	interface CanvasRenderingContext2D {
		/**
		 * Write text horizontally offset around `x` by `measureTextOffset` of its measured width.
		 * @param measureTextOffset in `[0, 1]`. Default `0.5` (centered around `x`).
		 */
		writeText(
			text: string,
			x: number,
			y: number,
			measureTextOffset?: number,
		): void;
	}
}

CanvasRenderingContext2D.prototype.writeText = function (
	text,
	x,
	y,
	measureTextOffset = 0.5,
): void {
	this.fillText(
		text,
		x - this.measureText(text).width * measureTextOffset,
		y,
	);
};
// #endregion

// #region writeMultilineText
declare global {
	interface CanvasRenderingContext2D {
		/**
		 * Word-wrap `text` into lines of pixel width `width`, drawing each line via `writeText`. Returns `false` and logs to `console.error` if `maxAttempts` is reached.
		 * @param lineOffset vertical spacing between lines in px. Default `50`.
		 * @param maxAttempts safety cap on wrap iterations. Default `50`.
		 */
		writeMultilineText(
			text: string,
			x: number,
			y: number,
			width: number,
			lineOffset?: number,
			maxAttempts?: number,
		): boolean;
	}
}

CanvasRenderingContext2D.prototype.writeMultilineText = function (
	text,
	x,
	y,
	width,
	lineOffset = 50,
	maxAttempts = 50,
): boolean {
	const words = text.split(" ");
	let attempts = 0;

	while (words.length > 0 && attempts < maxAttempts) {
		for (let i = 0; i < words.length; i++) {
			let textWidth = this.measureText(words.slice(0, i).join(" ")).width;

			if (textWidth > width) {
				const count = Math.max(1, i - 1);
				this.writeText(words.slice(0, count).join(" "), x, y, 0);
				words.splice(0, count);
				y += lineOffset;
				break;
			}

			if (i === words.length - 1) {
				textWidth = this.measureText(words.join(" ")).width;

				if (textWidth > width) {
					const count = Math.max(1, i);
					this.writeText(words.slice(0, count).join(" "), x, y, 0);
					words.splice(0, count);
					y += lineOffset;
					break;
				} else {
					this.writeText(words.join(" "), x, y, 0);
					words.length = 0;
					break;
				}
			}
		}

		attempts++;
	}

	if (attempts >= maxAttempts) {
		console.error("maxAttempts reached", attempts);
	}

	return attempts < maxAttempts;
};
// #endregion

// #region drawImageRotated
declare global {
	interface CanvasRenderingContext2D {
		/**
		 * Draw `image` rotated by `radians` around the center of its placement at `(x, y)`. Saves and restores the transform.
		 * @param radians clockwise positive, in radians.
		 */
		drawImageRotated(
			image: HTMLCanvasElement,
			x: number,
			y: number,
			radians: number,
		): void;
	}
}

CanvasRenderingContext2D.prototype.drawImageRotated = function (
	image,
	x,
	y,
	radians,
): void {
	this.save();
	this.translate(x + image.width * 0.5, y + image.height * 0.5);
	this.rotate(radians);
	this.drawImage(image, -image.width * 0.5, -image.height * 0.5);
	this.restore();
};
// #endregion

// #region generateColor
declare global {
	interface CanvasRenderingContext2D {
		/** Build a colored rounded-rect stencil with a `drawPartialRoundRect` helper. The returned helper writes `fillStyle = "white"` on the caller's context — wrap in `save()`/`restore()` to preserve prior state. */
		generateColor(
			size: number,
			color: string,
		): {
			colors: [number, number][];
			image: HTMLCanvasElement;
			drawPartialRoundRect: (
				rect: Rect,
				amount: number,
				offsetX?: number,
				offsetY?: number,
			) => void;
		};
	}
}

CanvasRenderingContext2D.prototype.generateColor = function (size, color) {
	function roundRect(
		context: CanvasRenderingContext2D,
		rect: Rect,
		radius: number,
	): void {
		const rectClone = rect.clone().inflate(-context.lineWidth);

		/* c8 ignore start -- generateColor always passes a square rect at fixed size, so the w-clamp's else-branch and the entire h-clamp are dead under current usage; kept for future callers that may pass non-square or larger rects. */
		if (rectClone.w < 2 * radius) {
			radius = rectClone.w * 0.5;
		}
		if (rectClone.h < 2 * radius) {
			radius = rectClone.h * 0.5;
		}
		/* c8 ignore stop */

		context.beginPath();
		context.moveTo(rectClone.x + radius, rectClone.y);
		context.arcTo(
			rectClone.sides.right,
			rectClone.y,
			rectClone.sides.right,
			rectClone.sides.bottom,
			radius,
		);
		context.arcTo(
			rectClone.sides.right,
			rectClone.sides.bottom,
			rectClone.x,
			rectClone.sides.bottom,
			radius,
		);
		context.arcTo(
			rectClone.x,
			rectClone.sides.bottom,
			rectClone.x,
			rectClone.y,
			radius,
		);
		context.arcTo(
			rectClone.x,
			rectClone.y,
			rectClone.sides.right,
			rectClone.y,
			radius,
		);
		context.closePath();
		context.stroke();
	}

	const cc = createNewCanvas(size, size);
	cc.context.strokeStyle = color;
	cc.context.lineWidth = 6;
	roundRect(cc.context, new Rect(0, 0, size, size), 15);

	const data = cc.context.getImageData(0, 0, size, size).data;
	const allColors: [number, number][] = [];
	for (let i = 0; i < data.length; i += 4) {
		if (data[i] || data[i + 1] || data[i + 2]) {
			allColors.push([(i / 4) % size, (i / 4 / size) | 0]);
		}
	}

	const colors: [number, number][] = [];

	for (let i = 0; i < allColors.length; i++) {
		if (allColors[i][0] > size * 0.5) {
			colors.push(allColors[i]);
		}
	}

	for (let i = allColors.length - 1; i > 0; i--) {
		if (allColors[i][0] <= size * 0.5) {
			colors.push(allColors[i]);
		}
	}

	const drawPartialRoundRect = (
		rect: Rect,
		amount: number,
		offsetX = 0,
		offsetY = 0,
	): void => {
		this.drawImage(cc.canvas, rect.x + offsetX, rect.y + offsetY);

		this.fillStyle = "white";

		for (
			let i = 0;
			i < Math.min(amount * colors.length, colors.length);
			i++
		) {
			this.fillRect(
				rect.x + colors[i][0] + offsetX,
				rect.y + colors[i][1] + offsetY,
				1,
				1,
			);
		}
	};

	return { colors, image: cc.canvas, drawPartialRoundRect };
};
// #endregion
