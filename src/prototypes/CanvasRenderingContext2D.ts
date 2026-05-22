import { createNewCanvas } from "@/utilities/Canvas";
import Rect from "@/core/Rect";

CanvasRenderingContext2D.prototype.drawBar = function (
	rect: Rect,
	amount: number,
	c1 = "white",
	c2 = "black",
): void {
	this.fillStyle = c1;
	this.fillRect(rect.x, rect.y, rect.w, rect.h);

	this.fillStyle = c2;
	this.fillRect(rect.x, rect.y, rect.w * amount, rect.h);
};

CanvasRenderingContext2D.prototype.drawHpBar = function (
	pos: GameLIB.Vector2,
	filled = 0.8,
	offset: GameLIB.Vector2 = {
		x: 0,
		y: 0,
	},
	width = 50,
	height = 12,
	border = 4,
	colors: string[] = ["white", "black", "red"],
): void {
	this.fillStyle = colors[0];
	this.fillRect(offset.x + pos.x, offset.y + pos.y, width, height);

	this.fillStyle = colors[1];
	this.fillRect(
		offset.x + pos.x + border,
		offset.y + pos.y + border,
		width - border * 2,
		height - border * 2,
	);

	if (filled > 0) {
		this.fillStyle = colors[2];
		this.fillRect(
			offset.x + pos.x + border,
			offset.y + pos.y + border,
			filled * (width - border * 2),
			height - border * 2,
		);
	}
};

/**
 * Stroke a circle. Writes `strokeStyle`/`lineWidth` only when supplied; values persist on the context — wrap in `save()`/`restore()` if you need to preserve prior state.
 */
CanvasRenderingContext2D.prototype.drawCircleV2 = function (
	vec2: GameLIB.Vector2,
	rad: number,
	lineWidth?: number,
	strokeStyle?: string,
	amount = 1,
): void {
	this.beginPath();
	this.arc(vec2.x, vec2.y, rad, 0, amount * 2 * Math.PI);

	if (strokeStyle) {
		this.strokeStyle = strokeStyle;
	}

	if (lineWidth) {
		this.lineWidth = lineWidth;
	}

	this.stroke();
};

/**
 * Stroke a circle inscribed in `rect`. Writes `strokeStyle`/`lineWidth` only when supplied; values persist on the context — wrap in `save()`/`restore()` if you need to preserve prior state.
 */
CanvasRenderingContext2D.prototype.drawCircleV4 = function (
	rect: GameLIB.Vector4,
	rad: number,
	lineWidth?: number,
	strokeStyle?: string,
	amount = 1,
): void {
	this.beginPath();
	this.arc(
		rect.x + rect.w * 0.5,
		rect.y + rect.h * 0.5,
		rad,
		0,
		amount * 2 * Math.PI,
	);

	if (strokeStyle) {
		this.strokeStyle = strokeStyle;
	}

	if (lineWidth) {
		this.lineWidth = lineWidth;
	}

	this.stroke();
};

CanvasRenderingContext2D.prototype.drawTriangle = function (rect: Rect): void {
	this.beginPath();
	this.moveTo(rect.x, rect.y);
	this.lineTo(rect.x + rect.w, rect.y);
	this.lineTo(rect.x + rect.w * 0.5, rect.y + rect.h);
	this.fill();
};

CanvasRenderingContext2D.prototype.drawDottedRect = function (
	rect: Rect,
): void {
	this.setLineDash([15, 15]);
	this.lineWidth = 5;
	this.beginPath();
	this.moveTo(rect.x, rect.y);
	this.lineTo(rect.x + rect.w, rect.y);
	this.lineTo(rect.x + rect.w, rect.y + rect.h);
	this.lineTo(rect.x, rect.y + rect.h);
	this.lineTo(rect.x, rect.y);
	this.stroke();
	this.setLineDash([]);
};

CanvasRenderingContext2D.prototype.generateColor = function (
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
} {
	function roundRect(
		context: CanvasRenderingContext2D,
		rect: Rect,
		radius: number,
	): void {
		const rectClone = rect.clone();
		rectClone.x += context.lineWidth;
		rectClone.y += context.lineWidth;
		rectClone.w -= context.lineWidth * 2;
		rectClone.h -= context.lineWidth * 2;
		rectClone.update();

		if (rectClone.w < 2 * radius) {
			radius = rectClone.w * 0.5;
		}
		if (rectClone.h < 2 * radius) {
			radius = rectClone.h * 0.5;
		}

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
		if (allColors[i][0] >= size * 0.5) {
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

/**
 * If padding is less than zero, it will auto padding.
 */
CanvasRenderingContext2D.prototype.roundRect = function (
	x: number,
	y: number,
	w: number,
	h: number,
	color?: string,
	padding = -1,
	radius = 16,
	fill = true,
): void {
	if (color) {
		this.fillStyle = color;
	}
	this.lineWidth = 6;

	if (padding < 0) {
		x += this.lineWidth;
		y += this.lineWidth;
		w -= this.lineWidth * 2;
		h -= this.lineWidth * 2;
	} else if (padding > 0) {
		x += padding;
		y += padding;
		w -= padding * 2;
		h -= padding * 2;
	}

	if (w < 2 * radius) {
		radius = w * 0.5;
	}
	if (h < 2 * radius) {
		radius = h * 0.5;
	}

	this.beginPath();
	this.moveTo(x + radius, y);
	this.arcTo(x + w, y, x + w, y + h, radius);
	this.arcTo(x + w, y + h, x, y + h, radius);
	this.arcTo(x, y + h, x, y, radius);
	this.arcTo(x, y, x + w, y, radius);
	if (fill) {
		this.fill();
	} else {
		this.stroke();
	}
	this.closePath();
};

CanvasRenderingContext2D.prototype.roundRectObject = function (
	rect: GameLIB.Vector4,
	color: string,
	padding?: number,
	radius?: number,
): void {
	this.roundRect(rect.x, rect.y, rect.w, rect.h, color, padding, radius);
};

CanvasRenderingContext2D.prototype.drawRect = function (
	...args: [Rect, string?] | [number, number, number, number, string?]
): void {
	let x: number;
	let y: number;
	let w: number;
	let h: number;
	let strokeStyle: string | undefined;

	if (args[0] instanceof Rect) {
		const [rect, style] = args as [Rect, string?];
		({ x, y, w, h } = rect);
		strokeStyle = style;
	} else {
		[x, y, w, h, strokeStyle] = args as [
			number,
			number,
			number,
			number,
			string?,
		];
	}

	if (strokeStyle) {
		this.strokeStyle = strokeStyle;
	}

	this.beginPath();
	this.rect(x, y, w, h);
	this.stroke();
};

CanvasRenderingContext2D.prototype.fillCircle = function (
	vecPos: GameLIB.Vector2,
	rad: number,
	fillStyle?: string,
): void {
	this.beginPath();
	this.arc(vecPos.x, vecPos.y, rad, 0, 2 * Math.PI);
	if (fillStyle) {
		this.fillStyle = fillStyle;
	}
	this.fill();
};

CanvasRenderingContext2D.prototype.fillRectObject = function (
	rect: Rect,
): void {
	this.fillRect(rect.x, rect.y, rect.w, rect.h);
};

CanvasRenderingContext2D.prototype.drawLine = function (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): void {
	this.beginPath();
	this.moveTo(x1, y1);
	this.lineTo(x2, y2);
	this.stroke();
	this.closePath();
};

CanvasRenderingContext2D.prototype.drawRotated = function (
	image: HTMLCanvasElement,
	x: number,
	y: number,
	radians: number,
): void {
	this.save();
	this.translate(x + image.width * 0.5, y + image.height * 0.5);
	this.rotate(radians);
	this.drawImage(image, -image.width * 0.5, -image.height * 0.5);
	this.restore();
};

CanvasRenderingContext2D.prototype.drawPolygon = function (
	polygonCount: number,
	pos: GameLIB.Vector2,
	strokeStyle = "white",
): void {
	const rad = Math.min(pos.x, pos.y) * 0.5;
	const Xcenter = pos.x * 0.5;
	const Ycenter = pos.y * 0.5;

	this.strokeStyle = strokeStyle;
	this.beginPath();
	this.moveTo(Xcenter + rad, Ycenter);

	for (let i = 1; i <= polygonCount; i++) {
		this.lineTo(
			Math.round(
				Xcenter + rad * Math.cos((i * 2 * Math.PI) / polygonCount),
			),
			Math.round(
				Ycenter + rad * Math.sin((i * 2 * Math.PI) / polygonCount),
			),
		);
	}

	this.stroke();
};

CanvasRenderingContext2D.prototype.writeText = function (
	text: string,
	x: number,
	y: number,
	color?: string,
	measureTextOffset = 0.5,
	font?: string,
): void {
	if (font) {
		this.font = font;
	}

	if (color) {
		this.fillStyle = color;
	}

	this.fillText(
		text,
		x - this.measureText(text).width * measureTextOffset,
		y,
	);
};

CanvasRenderingContext2D.prototype.writeMultilineText = function (
	text: string,
	x: number,
	y: number,
	width: number,
	color?: string,
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
				this.writeText(words.slice(0, count).join(" "), x, y, color, 0);
				words.splice(0, count);
				y += lineOffset;
				break;
			}

			if (i === words.length - 1) {
				textWidth = this.measureText(words.join(" ")).width;

				if (textWidth > width) {
					const count = Math.max(1, i);
					this.writeText(
						words.slice(0, count).join(" "),
						x,
						y,
						color,
						0,
					);
					words.splice(0, count);
					y += lineOffset;
					break;
				} else {
					this.writeText(words.join(" "), x, y, color, 0);
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
