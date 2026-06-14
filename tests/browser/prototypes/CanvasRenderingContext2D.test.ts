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

// ==================== drawBar ====================

describe("CanvasRenderingContext2D.drawBar", () => {
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

// ==================== drawCircleV2 / drawCircleV4 ====================

describe("CanvasRenderingContext2D.drawCircleV2", () => {
	it("calls arc with provided center, radius, and full sweep by default", () => {
		const { ctx } = makeCtx();
		const arcSpy = vi.spyOn(ctx, "arc");
		ctx.drawCircleV2({ x: 30, y: 40 }, 10);
		expect(arcSpy).toHaveBeenCalledWith(30, 40, 10, 0, 2 * Math.PI);
	});

	it("scales sweep by amount", () => {
		const { ctx } = makeCtx();
		const arcSpy = vi.spyOn(ctx, "arc");
		ctx.drawCircleV2({ x: 0, y: 0 }, 5, undefined, undefined, 0.25);
		expect(arcSpy).toHaveBeenCalledWith(0, 0, 5, 0, 0.5 * Math.PI);
	});

	it("only writes strokeStyle/lineWidth when supplied", () => {
		const { ctx } = makeCtx();
		const writes: string[] = [];
		Object.defineProperty(ctx, "strokeStyle", {
			configurable: true,
			get: () => "",
			set: () => writes.push("strokeStyle"),
		});
		Object.defineProperty(ctx, "lineWidth", {
			configurable: true,
			get: () => 1,
			set: () => writes.push("lineWidth"),
		});
		ctx.drawCircleV2({ x: 0, y: 0 }, 5);
		expect(writes).toEqual([]);

		ctx.drawCircleV2({ x: 0, y: 0 }, 5, 3, "#f00");
		expect(writes).toEqual(["strokeStyle", "lineWidth"]);
	});

	it("calls beginPath then stroke", () => {
		const { ctx } = makeCtx();
		const begin = vi.spyOn(ctx, "beginPath");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawCircleV2({ x: 0, y: 0 }, 5);
		expect(begin).toHaveBeenCalled();
		expect(stroke).toHaveBeenCalled();
	});
});

describe("CanvasRenderingContext2D.drawCircleV4", () => {
	it("centers arc inside the rect", () => {
		const { ctx } = makeCtx();
		const arcSpy = vi.spyOn(ctx, "arc");
		ctx.drawCircleV4({ x: 10, y: 20, w: 30, h: 40 }, 5);
		expect(arcSpy).toHaveBeenCalledWith(25, 40, 5, 0, 2 * Math.PI);
	});

	it("scales sweep by amount", () => {
		const { ctx } = makeCtx();
		const arcSpy = vi.spyOn(ctx, "arc");
		ctx.drawCircleV4(
			{ x: 0, y: 0, w: 10, h: 10 },
			5,
			undefined,
			undefined,
			0.5,
		);
		expect(arcSpy).toHaveBeenCalledWith(5, 5, 5, 0, Math.PI);
	});

	it("writes strokeStyle and lineWidth when supplied", () => {
		const { ctx } = makeCtx();
		ctx.drawCircleV4({ x: 0, y: 0, w: 10, h: 10 }, 5, 4, "#00ffff");
		expect(ctx.strokeStyle).toBe("#00ffff");
		expect(ctx.lineWidth).toBe(4);
	});
});

// ==================== drawTriangle ====================

describe("CanvasRenderingContext2D.drawTriangle", () => {
	it("draws the three triangle edges and fills", () => {
		const { ctx } = makeCtx();
		const moveTo = vi.spyOn(ctx, "moveTo");
		const lineTo = vi.spyOn(ctx, "lineTo");
		const fill = vi.spyOn(ctx, "fill");
		ctx.drawTriangle(new Rect(10, 20, 30, 40));
		expect(moveTo).toHaveBeenCalledWith(10, 20);
		expect(lineTo).toHaveBeenNthCalledWith(1, 40, 20);
		expect(lineTo).toHaveBeenNthCalledWith(2, 25, 60);
		expect(fill).toHaveBeenCalled();
	});
});

// ==================== drawDottedRect ====================

describe("CanvasRenderingContext2D.drawDottedRect", () => {
	it("sets a 15,15 line dash and resets to []", () => {
		const { ctx } = makeCtx();
		const dashSpy = vi.spyOn(ctx, "setLineDash");
		ctx.drawDottedRect(new Rect(0, 0, 10, 10));
		expect(dashSpy).toHaveBeenNthCalledWith(1, [15, 15]);
		expect(dashSpy).toHaveBeenNthCalledWith(2, []);
	});

	it("sets lineWidth to 5", () => {
		const { ctx } = makeCtx();
		ctx.drawDottedRect(new Rect(0, 0, 10, 10));
		expect(ctx.lineWidth).toBe(5);
	});

	it("closes the path back to start via 4 lineTos", () => {
		const { ctx } = makeCtx();
		const moveTo = vi.spyOn(ctx, "moveTo");
		const lineTo = vi.spyOn(ctx, "lineTo");
		ctx.drawDottedRect(new Rect(2, 3, 8, 6));
		expect(moveTo).toHaveBeenCalledWith(2, 3);
		expect(lineTo).toHaveBeenNthCalledWith(1, 10, 3);
		expect(lineTo).toHaveBeenNthCalledWith(2, 10, 9);
		expect(lineTo).toHaveBeenNthCalledWith(3, 2, 9);
		expect(lineTo).toHaveBeenNthCalledWith(4, 2, 3);
	});
});

// ==================== drawRoundRect ====================

describe("CanvasRenderingContext2D.drawRoundRect", () => {
	it("fills by default", () => {
		const { ctx } = makeCtx();
		const fill = vi.spyOn(ctx, "fill");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawRoundRect(0, 0, 30, 30);
		expect(fill).toHaveBeenCalled();
		expect(stroke).not.toHaveBeenCalled();
	});

	it("strokes when mode is 'stroke'", () => {
		const { ctx } = makeCtx();
		const fill = vi.spyOn(ctx, "fill");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawRoundRect(0, 0, 30, 30, {
			padding: 0,
			radius: 5,
			mode: "stroke",
		});
		expect(fill).not.toHaveBeenCalled();
		expect(stroke).toHaveBeenCalled();
	});

	it("sets fillStyle when color is supplied", () => {
		const { ctx } = makeCtx();
		ctx.drawRoundRect(0, 0, 30, 30, { color: "#abcdef" });
		expect(ctx.fillStyle).toBe("#abcdef");
	});

	it("sets strokeStyle (not fillStyle) when color is supplied and mode is 'stroke'", () => {
		const { ctx } = makeCtx();
		ctx.fillStyle = "#000000";
		ctx.drawRoundRect(0, 0, 30, 30, { color: "#abcdef", mode: "stroke" });
		expect(ctx.strokeStyle).toBe("#abcdef");
		expect(ctx.fillStyle).toBe("#000000");
	});

	it("auto-insets by lineWidth when padding is undefined", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect(0, 0, 100, 100);
		// lineWidth=6 inset → (6, 6, 88, 88), radius default 16
		expect(spy).toHaveBeenCalledWith(6, 6, 88, 88, 16);
	});

	it("respects an explicit positive padding", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect(0, 0, 100, 100, { padding: 10 });
		expect(spy).toHaveBeenCalledWith(10, 10, 80, 80, 16);
	});

	it("respects a custom lineWidth", () => {
		const { ctx } = makeCtx();
		ctx.drawRoundRect(0, 0, 30, 30, { lineWidth: 12 });
		expect(ctx.lineWidth).toBe(12);
	});

	it("uses the custom lineWidth for auto-inset", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect(0, 0, 100, 100, { lineWidth: 4 });
		expect(spy).toHaveBeenCalledWith(4, 4, 92, 92, 16);
	});

	it("delegates corner radius to native roundRect", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect(0, 0, 40, 40, { padding: 0, radius: 5 });
		expect(spy).toHaveBeenCalledWith(0, 0, 40, 40, 5);
	});

	it("accepts a Vector4 as first arg", () => {
		const { ctx } = makeCtx();
		const spy = vi.spyOn(ctx, "roundRect");
		ctx.drawRoundRect(
			{ x: 1, y: 2, w: 30, h: 40 },
			{ padding: 0, radius: 7 },
		);
		expect(spy).toHaveBeenCalledWith(1, 2, 30, 40, 7);
	});

	it("Vector4 overload accepts color option", () => {
		const { ctx } = makeCtx();
		ctx.drawRoundRect({ x: 0, y: 0, w: 30, h: 40 }, { color: "#ff0000" });
		expect(ctx.fillStyle).toBe("#ff0000");
	});
});

// ==================== drawRect ====================

describe("CanvasRenderingContext2D.drawRect", () => {
	it("strokes from a Rect", () => {
		const { ctx } = makeCtx();
		const rect = vi.spyOn(ctx, "rect");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawRect(new Rect(2, 3, 10, 5));
		expect(rect).toHaveBeenCalledWith(2, 3, 10, 5);
		expect(stroke).toHaveBeenCalled();
	});

	it("strokes from explicit coords", () => {
		const { ctx } = makeCtx();
		const rect = vi.spyOn(ctx, "rect");
		ctx.drawRect(1, 2, 3, 4);
		expect(rect).toHaveBeenCalledWith(1, 2, 3, 4);
	});

	it("applies strokeStyle from Rect overload", () => {
		const { ctx } = makeCtx();
		ctx.drawRect(new Rect(0, 0, 10, 10), "#f00");
		expect(ctx.strokeStyle).toBe("#ff0000");
	});

	it("applies strokeStyle from explicit overload", () => {
		const { ctx } = makeCtx();
		ctx.drawRect(0, 0, 10, 10, "#0f0");
		expect(ctx.strokeStyle).toBe("#00ff00");
	});

	it("does not write strokeStyle when omitted", () => {
		const { ctx } = makeCtx();
		ctx.strokeStyle = "#abc123";
		ctx.drawRect(new Rect(0, 0, 10, 10));
		expect(ctx.strokeStyle).toBe("#abc123");
	});
});

// ==================== fillCircle ====================

describe("CanvasRenderingContext2D.fillCircle", () => {
	it("draws an arc at vecPos with radius", () => {
		const { ctx } = makeCtx();
		const arcSpy = vi.spyOn(ctx, "arc");
		const fill = vi.spyOn(ctx, "fill");
		ctx.fillCircle({ x: 20, y: 30 }, 7);
		expect(arcSpy).toHaveBeenCalledWith(20, 30, 7, 0, 2 * Math.PI);
		expect(fill).toHaveBeenCalled();
	});

	it("applies fillStyle when supplied", () => {
		const { ctx } = makeCtx();
		ctx.fillCircle({ x: 0, y: 0 }, 5, "#f0f");
		expect(ctx.fillStyle).toBe("#ff00ff");
	});

	it("does not write fillStyle when omitted", () => {
		const { ctx } = makeCtx();
		ctx.fillStyle = "#abc123";
		ctx.fillCircle({ x: 0, y: 0 }, 5);
		expect(ctx.fillStyle).toBe("#abc123");
	});
});

// ==================== fillRectObject ====================

describe("CanvasRenderingContext2D.fillRectObject", () => {
	it("forwards to fillRect with rect fields", () => {
		const { ctx } = makeCtx();
		const fillSpy = vi.spyOn(ctx, "fillRect");
		ctx.fillRectObject(new Rect(3, 4, 5, 6));
		expect(fillSpy).toHaveBeenCalledWith(3, 4, 5, 6);
	});
});

// ==================== drawLine ====================

describe("CanvasRenderingContext2D.drawLine", () => {
	it("draws a stroked segment between two points", () => {
		const { ctx } = makeCtx();
		const moveTo = vi.spyOn(ctx, "moveTo");
		const lineTo = vi.spyOn(ctx, "lineTo");
		const stroke = vi.spyOn(ctx, "stroke");
		ctx.drawLine(1, 2, 30, 40);
		expect(moveTo).toHaveBeenCalledWith(1, 2);
		expect(lineTo).toHaveBeenCalledWith(30, 40);
		expect(stroke).toHaveBeenCalled();
	});
});

// ==================== drawRotated ====================

describe("CanvasRenderingContext2D.drawRotated", () => {
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
		ctx.drawRotated(img, 100, 200, Math.PI / 4);
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
		ctx.drawRotated(img, 100, 200, 1.5);
		expect(translate).toHaveBeenCalledWith(110, 205);
		expect(rotate).toHaveBeenCalledWith(1.5);
		expect(drawImage).toHaveBeenCalledWith(img, -10, -5);
	});
});

// ==================== drawPolygon ====================

describe("CanvasRenderingContext2D.drawPolygon", () => {
	it("draws sides vertices", () => {
		const { ctx } = makeCtx();
		const lineTo = vi.spyOn(ctx, "lineTo");
		ctx.drawPolygon(6, { x: 0, y: 0, w: 100, h: 100 });
		expect(lineTo).toHaveBeenCalledTimes(6);
	});

	it("sets strokeStyle to provided value (default white)", () => {
		const { ctx } = makeCtx();
		ctx.drawPolygon(3, { x: 0, y: 0, w: 50, h: 50 });
		expect(ctx.strokeStyle).toBe("#ffffff");
		ctx.drawPolygon(3, { x: 0, y: 0, w: 50, h: 50 }, "#ff0000");
		expect(ctx.strokeStyle).toBe("#ff0000");
	});

	it("starts at the right side of the polygon", () => {
		const { ctx } = makeCtx();
		const moveTo = vi.spyOn(ctx, "moveTo");
		ctx.drawPolygon(4, { x: 0, y: 0, w: 40, h: 60 });
		// rad = min(40, 60)/2 = 20; Xcenter = 20, Ycenter = 30 → (20+20, 30)
		expect(moveTo).toHaveBeenCalledWith(40, 30);
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
		ctx.writeText("abcd", 100, 50, undefined, 0);
		expect(fillText).toHaveBeenCalledWith("abcd", 100, 50);
	});

	it("right-aligns when offset is 1", () => {
		const { ctx } = makeCtx();
		const fillText = vi.spyOn(ctx, "fillText");
		ctx.writeText("ab", 100, 50, undefined, 1);
		// width=20 → x = 100 - 20 = 80
		expect(fillText).toHaveBeenCalledWith("ab", 80, 50);
	});

	it("applies font when supplied", () => {
		const { ctx } = makeCtx();
		ctx.writeText("hi", 0, 0, undefined, 0, "20px Arial");
		expect(ctx.font).toContain("Arial");
	});

	it("applies color when supplied", () => {
		const { ctx } = makeCtx();
		ctx.writeText("hi", 0, 0, "#abcdef");
		expect(ctx.fillStyle).toBe("#abcdef");
	});

	it("does not write fillStyle when color omitted", () => {
		const { ctx } = makeCtx();
		ctx.fillStyle = "#123456";
		ctx.writeText("hi", 0, 0);
		expect(ctx.fillStyle).toBe("#123456");
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
		ctx.writeMultilineText("aaa bbb ccc", 5, 0, 40, undefined, 20);
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
			undefined,
			10,
			2,
		);
		expect(result).toBe(false);
		expect(err).toHaveBeenCalled();
		err.mockRestore();
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
