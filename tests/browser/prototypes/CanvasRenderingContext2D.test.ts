import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Rect from "@/math/Rect";

import "@/prototypes/index";

function makeCtx(
	width = 100,
	height = 100,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return { canvas, ctx: canvas.getContext("2d")! };
}

// ==================== fillBar ====================

describe("CanvasRenderingContext2D.fillBar", () => {
	it("fills background then foreground rect with default colors", () => {
		const { ctx } = makeCtx();
		const fillSpy = vi.spyOn(ctx, "fillRect");
		const rect = new Rect(10, 20, 100, 8);
		ctx.fillBar(rect, 0.5);
		expect(fillSpy).toHaveBeenCalledTimes(2);
		expect(fillSpy).toHaveBeenNthCalledWith(1, 10, 20, 100, 8);
		expect(fillSpy).toHaveBeenNthCalledWith(2, 10, 20, 50, 8);
	});

	it("uses provided colors", () => {
		const { ctx } = makeCtx();
		const values: string[] = [];
		Object.defineProperty(ctx, "fillStyle", {
			configurable: true,
			get: () => values[values.length - 1] ?? "",
			set: (v: string) => {
				values.push(v);
			},
		});
		ctx.fillBar(new Rect(0, 0, 10, 4), 0.3, "#f00", "#0f0");
		expect(values).toEqual(["#f00", "#0f0"]);
	});

	it("foreground width scales with amount=1 (full bar)", () => {
		const { ctx } = makeCtx();
		const fillSpy = vi.spyOn(ctx, "fillRect");
		ctx.fillBar(new Rect(0, 0, 40, 4), 1);
		expect(fillSpy).toHaveBeenNthCalledWith(2, 0, 0, 40, 4);
	});

	it("foreground width is 0 when amount=0", () => {
		const { ctx } = makeCtx();
		const fillSpy = vi.spyOn(ctx, "fillRect");
		ctx.fillBar(new Rect(0, 0, 40, 4), 0);
		expect(fillSpy).toHaveBeenNthCalledWith(2, 0, 0, 0, 4);
	});
});

// ==================== fillFramedBar ====================

describe("CanvasRenderingContext2D.fillFramedBar", () => {
	it("draws outer, frame, and fill (3 fillRects) with defaults", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "fillRect");
		ctx.fillFramedBar({ x: 0, y: 0, w: 50, h: 12 });
		expect(spy).toHaveBeenCalledTimes(3);
		expect(spy).toHaveBeenNthCalledWith(1, 0, 0, 50, 12);
		expect(spy).toHaveBeenNthCalledWith(2, 4, 4, 42, 4);
	});

	it("skips fill when amount <= 0", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "fillRect");
		ctx.fillFramedBar({ x: 0, y: 0, w: 50, h: 12 }, 0);
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("scales fill width by amount", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "fillRect");
		ctx.fillFramedBar({ x: 0, y: 0, w: 50, h: 12 }, 0.5);
		expect(spy).toHaveBeenNthCalledWith(3, 4, 4, 21, 4);
	});

	it("respects explicit padding", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "fillRect");
		ctx.fillFramedBar({ x: 15, y: 27, w: 100, h: 20 }, 1, 2);
		expect(spy).toHaveBeenNthCalledWith(1, 15, 27, 100, 20);
		expect(spy).toHaveBeenNthCalledWith(2, 17, 29, 96, 16);
		expect(spy).toHaveBeenNthCalledWith(3, 17, 29, 96, 16);
	});
});

// ==================== drawCircle ====================

describe("CanvasRenderingContext2D.drawCircle", () => {
	it("calls arc with provided center, radius, and full sweep by default", () => {
		const { ctx } = makeCtx();
		const arcSpy = vi.spyOn(ctx, "arc");
		ctx.drawCircle({ x: 30, y: 40 }, 10, "stroke");
		expect(arcSpy).toHaveBeenCalledWith(30, 40, 10, 0, 2 * Math.PI);
	});

	it("scales sweep by amount", () => {
		const { ctx } = makeCtx();
		const arcSpy = vi.spyOn(ctx, "arc");
		ctx.drawCircle({ x: 0, y: 0 }, 5, "stroke", 0.25);
		expect(arcSpy).toHaveBeenCalledWith(0, 0, 5, 0, 0.5 * Math.PI);
	});

	it("strokes when mode is 'stroke'", () => {
		const { ctx } = makeCtx();
		const stroke = vi.spyOn(ctx, "stroke");
		const fill = vi.spyOn(ctx, "fill");
		ctx.drawCircle({ x: 0, y: 0 }, 5, "stroke");
		expect(stroke).toHaveBeenCalled();
		expect(fill).not.toHaveBeenCalled();
	});

	it("fills when mode is 'fill'", () => {
		const { ctx } = makeCtx();
		const stroke = vi.spyOn(ctx, "stroke");
		const fill = vi.spyOn(ctx, "fill");
		ctx.drawCircle({ x: 0, y: 0 }, 5, "fill");
		expect(fill).toHaveBeenCalled();
		expect(stroke).not.toHaveBeenCalled();
	});

	it("does not write strokeStyle, lineWidth, or fillStyle", () => {
		const { ctx } = makeCtx();
		ctx.strokeStyle = "#abc123";
		ctx.lineWidth = 7;
		ctx.fillStyle = "#def456";
		ctx.drawCircle({ x: 0, y: 0 }, 5, "stroke");
		ctx.drawCircle({ x: 0, y: 0 }, 5, "fill");
		expect(ctx.strokeStyle).toBe("#abc123");
		expect(ctx.lineWidth).toBe(7);
		expect(ctx.fillStyle).toBe("#def456");
	});
});

// ==================== drawRect ====================

describe("CanvasRenderingContext2D.drawRect", () => {
	it("strokes from a Rect when mode is 'stroke'", () => {
		const { ctx } = makeCtx();
		const rect = vi.spyOn(ctx, "rect");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawRect(new Rect(2, 3, 10, 5), "stroke");
		expect(rect).toHaveBeenCalledWith(2, 3, 10, 5);
		expect(stroke).toHaveBeenCalled();
	});

	it("fills from a Rect when mode is 'fill'", () => {
		const { ctx } = makeCtx();
		const fill = vi.spyOn(ctx, "fill");
		ctx.drawRect(new Rect(0, 0, 10, 10), "fill");
		expect(fill).toHaveBeenCalled();
	});

	it("accepts explicit coords", () => {
		const { ctx } = makeCtx();
		const rect = vi.spyOn(ctx, "rect");
		ctx.drawRect(1, 2, 3, 4, "stroke");
		expect(rect).toHaveBeenCalledWith(1, 2, 3, 4);
	});

	it("does not write strokeStyle or fillStyle", () => {
		const { ctx } = makeCtx();
		ctx.strokeStyle = "#abc123";
		ctx.fillStyle = "#def456";
		ctx.drawRect(new Rect(0, 0, 10, 10), "stroke");
		ctx.drawRect(new Rect(0, 0, 10, 10), "fill");
		expect(ctx.strokeStyle).toBe("#abc123");
		expect(ctx.fillStyle).toBe("#def456");
	});
});

// ==================== drawRoundRect ====================

describe("CanvasRenderingContext2D.drawRoundRect", () => {
	it("fills when mode is 'fill'", () => {
		const { ctx } = makeCtx();
		const fill = vi.spyOn(ctx, "fill");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawRoundRect(0, 0, 30, 30, "fill");
		expect(fill).toHaveBeenCalled();
		expect(stroke).not.toHaveBeenCalled();
	});

	it("strokes when mode is 'stroke'", () => {
		const { ctx } = makeCtx();
		const fill = vi.spyOn(ctx, "fill");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawRoundRect(0, 0, 30, 30, "stroke", { padding: 0, radius: 5 });
		expect(fill).not.toHaveBeenCalled();
		expect(stroke).toHaveBeenCalled();
	});

	it("does not inset when padding is undefined", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect(0, 0, 100, 100, "fill");
		// default radius 16, no padding inset
		expect(spy).toHaveBeenCalledWith(0, 0, 100, 100, 16);
	});

	it("respects an explicit positive padding", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect(0, 0, 100, 100, "fill", { padding: 10 });
		expect(spy).toHaveBeenCalledWith(10, 10, 80, 80, 16);
	});

	it("delegates corner radius to native roundRect", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect(0, 0, 40, 40, "fill", { padding: 0, radius: 5 });
		expect(spy).toHaveBeenCalledWith(0, 0, 40, 40, 5);
	});

	it("accepts a Vector4 as first arg", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect({ x: 1, y: 2, w: 30, h: 40 }, "fill", {
			padding: 0,
			radius: 7,
		});
		expect(spy).toHaveBeenCalledWith(1, 2, 30, 40, 7);
	});

	it("does not write fillStyle, strokeStyle, or lineWidth", () => {
		const { ctx } = makeCtx();
		ctx.fillStyle = "#abc123";
		ctx.strokeStyle = "#def456";
		ctx.lineWidth = 7;
		ctx.drawRoundRect(0, 0, 30, 30, "fill");
		ctx.drawRoundRect(0, 0, 30, 30, "stroke");
		expect(ctx.fillStyle).toBe("#abc123");
		expect(ctx.strokeStyle).toBe("#def456");
		expect(ctx.lineWidth).toBe(7);
	});
});

// ==================== strokeDottedRect ====================

describe("CanvasRenderingContext2D.strokeDottedRect", () => {
	it("sets a 15,15 line dash", () => {
		const { ctx } = makeCtx();
		const dashSpy = vi.spyOn(ctx, "setLineDash");
		ctx.strokeDottedRect(new Rect(0, 0, 10, 10));
		expect(dashSpy).toHaveBeenCalledWith([15, 15]);
	});

	it("sets lineWidth to 5", () => {
		const { ctx } = makeCtx();
		ctx.strokeDottedRect(new Rect(0, 0, 10, 10));
		expect(ctx.lineWidth).toBe(5);
	});

	it("closes the path back to start via 4 lineTos", () => {
		const { ctx } = makeCtx();
		const moveTo = vi.spyOn(ctx, "moveTo");
		const lineTo = vi.spyOn(ctx, "lineTo");
		ctx.strokeDottedRect(new Rect(2, 3, 8, 6));
		expect(moveTo).toHaveBeenCalledWith(2, 3);
		expect(lineTo).toHaveBeenNthCalledWith(1, 10, 3);
		expect(lineTo).toHaveBeenNthCalledWith(2, 10, 9);
		expect(lineTo).toHaveBeenNthCalledWith(3, 2, 9);
		expect(lineTo).toHaveBeenNthCalledWith(4, 2, 3);
	});
});

// ==================== strokeLine ====================

describe("CanvasRenderingContext2D.strokeLine", () => {
	it("draws a stroked segment between two points", () => {
		const { ctx } = makeCtx();
		const moveTo = vi.spyOn(ctx, "moveTo");
		const lineTo = vi.spyOn(ctx, "lineTo");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.strokeLine(1, 2, 30, 40);
		expect(moveTo).toHaveBeenCalledWith(1, 2);
		expect(lineTo).toHaveBeenCalledWith(30, 40);
		expect(stroke).toHaveBeenCalled();
	});
});

// ==================== drawPolygon ====================

describe("CanvasRenderingContext2D.drawPolygon", () => {
	it("draws sides vertices", () => {
		const { ctx } = makeCtx();
		const lineTo = vi.spyOn(ctx, "lineTo");
		ctx.drawPolygon(6, { x: 0, y: 0, w: 100, h: 100 }, "stroke");
		expect(lineTo).toHaveBeenCalledTimes(6);
	});

	it("strokes when mode is 'stroke'", () => {
		const { ctx } = makeCtx();
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawPolygon(3, { x: 0, y: 0, w: 50, h: 50 }, "stroke");
		expect(stroke).toHaveBeenCalled();
	});

	it("fills when mode is 'fill'", () => {
		const { ctx } = makeCtx();
		const fill = vi.spyOn(ctx, "fill");
		ctx.drawPolygon(3, { x: 0, y: 0, w: 50, h: 50 }, "fill");
		expect(fill).toHaveBeenCalled();
	});

	it("starts at the right side of the polygon", () => {
		const { ctx } = makeCtx();
		const moveTo = vi.spyOn(ctx, "moveTo");
		ctx.drawPolygon(4, { x: 0, y: 0, w: 40, h: 60 }, "stroke");
		// rad = min(40, 60)/2 = 20; Xcenter = 20, Ycenter = 30 → (20+20, 30)
		expect(moveTo).toHaveBeenCalledWith(40, 30);
	});
});

// ==================== drawTriangle ====================

describe("CanvasRenderingContext2D.drawTriangle", () => {
	it("draws the three triangle edges", () => {
		const { ctx } = makeCtx();
		const moveTo = vi.spyOn(ctx, "moveTo");
		const lineTo = vi.spyOn(ctx, "lineTo");
		ctx.drawTriangle(new Rect(10, 20, 30, 40), "fill");
		expect(moveTo).toHaveBeenCalledWith(10, 20);
		expect(lineTo).toHaveBeenNthCalledWith(1, 40, 20);
		expect(lineTo).toHaveBeenNthCalledWith(2, 25, 60);
	});

	it("fills when mode is 'fill'", () => {
		const { ctx } = makeCtx();
		const fill = vi.spyOn(ctx, "fill");
		ctx.drawTriangle(new Rect(0, 0, 10, 10), "fill");
		expect(fill).toHaveBeenCalled();
	});

	it("strokes when mode is 'stroke'", () => {
		const { ctx } = makeCtx();
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawTriangle(new Rect(0, 0, 10, 10), "stroke");
		expect(stroke).toHaveBeenCalled();
	});
});

// ==================== writeText ====================

describe("CanvasRenderingContext2D.writeText", () => {
	let measureRestore: () => void;

	beforeEach(() => {
		const orig = CanvasRenderingContext2D.prototype.measureText;
		CanvasRenderingContext2D.prototype.measureText = function (
			this: CanvasRenderingContext2D,
			s: string,
		) {
			return { width: s.length * 10 } as TextMetrics;
		};
		measureRestore = () => {
			CanvasRenderingContext2D.prototype.measureText = orig;
		};
	});

	afterEach(() => {
		measureRestore();
	});

	it("centers text horizontally by default (offset 0.5)", () => {
		const { ctx } = makeCtx();
		const fillText = vi.spyOn(ctx, "fillText");
		ctx.writeText("abc", 100, 50);
		// width=30, offset=0.5 → x = 100 - 15 = 85
		expect(fillText).toHaveBeenCalledWith("abc", 85, 50);
	});

	it("places text at supplied x when offset is 0", () => {
		const { ctx } = makeCtx();
		const fillText = vi.spyOn(ctx, "fillText");
		ctx.writeText("abcd", 100, 50, 0);
		expect(fillText).toHaveBeenCalledWith("abcd", 100, 50);
	});

	it("right-aligns when offset is 1", () => {
		const { ctx } = makeCtx();
		const fillText = vi.spyOn(ctx, "fillText");
		ctx.writeText("ab", 100, 50, 1);
		// width=20 → x = 100 - 20 = 80
		expect(fillText).toHaveBeenCalledWith("ab", 80, 50);
	});

	it("does not write fillStyle or font", () => {
		const { ctx } = makeCtx();
		ctx.fillStyle = "#123456";
		const fontBefore = ctx.font;
		ctx.writeText("hi", 0, 0);
		expect(ctx.fillStyle).toBe("#123456");
		expect(ctx.font).toBe(fontBefore);
	});
});

// ==================== writeMultilineText ====================

describe("CanvasRenderingContext2D.writeMultilineText", () => {
	let measureRestore: () => void;

	beforeEach(() => {
		const orig = CanvasRenderingContext2D.prototype.measureText;
		// Each character is 10px wide
		CanvasRenderingContext2D.prototype.measureText = function (
			this: CanvasRenderingContext2D,
			s: string,
		) {
			return { width: s.length * 10 } as TextMetrics;
		};
		measureRestore = () => {
			CanvasRenderingContext2D.prototype.measureText = orig;
		};
	});

	afterEach(() => {
		measureRestore();
	});

	it("returns true when the text fits within maxAttempts", () => {
		const { ctx } = makeCtx();
		expect(ctx.writeMultilineText("hello world foo bar", 0, 0, 60)).toBe(
			true,
		);
	});

	it("writes a single line when the entire string fits", () => {
		const { ctx } = makeCtx();
		const fillText = vi.spyOn(ctx, "fillText");
		ctx.writeMultilineText("short text", 0, 0, 1000);
		expect(fillText).toHaveBeenCalledTimes(1);
	});

	it("wraps into multiple lines when width is exceeded", () => {
		const { ctx } = makeCtx();
		const fillText = vi.spyOn(ctx, "fillText");
		ctx.writeMultilineText("aaa bbb ccc ddd", 0, 0, 40);
		expect(fillText.mock.calls.length).toBeGreaterThan(1);
	});

	it("advances y by lineOffset between lines", () => {
		const { ctx } = makeCtx();
		const fillText = vi.spyOn(ctx, "fillText");
		ctx.writeMultilineText("aaa bbb ccc", 5, 0, 40, 20);
		const ys = fillText.mock.calls.map(c => c[2]);
		expect(ys[1]).toBe((ys[0] as number) + 20);
	});

	it("breaks a single word that exceeds width onto its own line", () => {
		const { ctx } = makeCtx();
		const fillText = vi.spyOn(ctx, "fillText");
		// "supercalifragilistic" is 200px wide, > width 50 → should still write it
		const ok = ctx.writeMultilineText("supercalifragilistic ok", 0, 0, 50);
		expect(ok).toBe(true);
		expect(fillText).toHaveBeenCalled();
	});

	it("returns false and logs when maxAttempts is exceeded", () => {
		const { ctx } = makeCtx();
		const err = vi.spyOn(console, "error").mockImplementation(() => {});
		const result = ctx.writeMultilineText(
			"a b c d e f g h i j k",
			0,
			0,
			5,
			10,
			2,
		);
		expect(result).toBe(false);
		expect(err).toHaveBeenCalled();
		err.mockRestore();
	});
});

// ==================== drawImageRotated ====================

describe("CanvasRenderingContext2D.drawImageRotated", () => {
	let savedCalls: string[];

	beforeEach(() => {
		savedCalls = [];
	});

	it("wraps draw in save/restore", () => {
		const { ctx } = makeCtx();
		const save = vi.spyOn(ctx, "save").mockImplementation(() => {
			savedCalls.push("save");
		});
		const restore = vi.spyOn(ctx, "restore").mockImplementation(() => {
			savedCalls.push("restore");
		});
		const img = document.createElement("canvas");
		img.width = 20;
		img.height = 10;
		ctx.drawImageRotated(img, 100, 200, Math.PI / 4);
		expect(save).toHaveBeenCalledTimes(1);
		expect(restore).toHaveBeenCalledTimes(1);
		expect(savedCalls[0]).toBe("save");
		expect(savedCalls[savedCalls.length - 1]).toBe("restore");
	});

	it("translates to image center, rotates, then draws image centered", () => {
		const { ctx } = makeCtx();
		const translate = vi.spyOn(ctx, "translate");
		const rotate = vi.spyOn(ctx, "rotate");
		const drawImage = vi.spyOn(ctx, "drawImage");
		const img = document.createElement("canvas");
		img.width = 20;
		img.height = 10;
		ctx.drawImageRotated(img, 100, 200, 1.5);
		expect(translate).toHaveBeenCalledWith(110, 205);
		expect(rotate).toHaveBeenCalledWith(1.5);
		expect(drawImage).toHaveBeenCalledWith(img, -10, -5);
	});
});

// ==================== generateColor ====================

describe("CanvasRenderingContext2D.generateColor", () => {
	it("returns an image canvas of the requested size", () => {
		const { ctx } = makeCtx();
		const result = ctx.generateColor(40, "#ff0000");
		expect(result.image).toBeInstanceOf(HTMLCanvasElement);
		expect(result.image.width).toBe(40);
		expect(result.image.height).toBe(40);
	});

	it("returns a non-empty colors array (border pixels detected)", () => {
		const { ctx } = makeCtx();
		const result = ctx.generateColor(40, "#ff0000");
		expect(result.colors.length).toBeGreaterThan(0);
		result.colors.forEach(([x, y]) => {
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThan(40);
			expect(y).toBeGreaterThanOrEqual(0);
			expect(y).toBeLessThan(40);
		});
	});

	it("returns a drawPartialRoundRect function", () => {
		const { ctx } = makeCtx();
		const result = ctx.generateColor(40, "#ff0000");
		expect(typeof result.drawPartialRoundRect).toBe("function");
	});

	it("drawPartialRoundRect draws the stencil and white-fills proportionally", () => {
		const { ctx } = makeCtx();
		const drawImage = vi.spyOn(ctx, "drawImage");
		const fillRect = vi.spyOn(ctx, "fillRect");
		const result = ctx.generateColor(40, "#00ff00");
		result.drawPartialRoundRect(new Rect(10, 10, 40, 40), 0.5);
		expect(drawImage).toHaveBeenCalledWith(result.image, 10, 10);
		// Loop runs `i < amount * colors.length` (strict-less-than), so the
		// count is ceil() when the product is non-integer.
		expect(fillRect).toHaveBeenCalledTimes(
			Math.ceil(0.5 * result.colors.length),
		);
	});

	it("drawPartialRoundRect skips fillRect when amount=0", () => {
		const { ctx } = makeCtx();
		const fillRect = vi.spyOn(ctx, "fillRect");
		const result = ctx.generateColor(40, "#0000ff");
		result.drawPartialRoundRect(new Rect(0, 0, 40, 40), 0);
		expect(fillRect).not.toHaveBeenCalled();
	});

	it("drawPartialRoundRect sets fillStyle to white", () => {
		const { ctx } = makeCtx();
		const result = ctx.generateColor(40, "#0000ff");
		result.drawPartialRoundRect(new Rect(0, 0, 40, 40), 1);
		expect(ctx.fillStyle).toBe("#ffffff");
	});

	it("drawPartialRoundRect respects offsetX/offsetY", () => {
		const { ctx } = makeCtx();
		const drawImage = vi.spyOn(ctx, "drawImage");
		const result = ctx.generateColor(40, "#0000ff");
		result.drawPartialRoundRect(new Rect(5, 7, 40, 40), 0, 100, 200);
		expect(drawImage).toHaveBeenCalledWith(result.image, 105, 207);
	});
});
