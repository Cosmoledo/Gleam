import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Settings from "@/core/Settings";
import {
	applyFilterOnCanvas,
	changeColor,
	createNewCanvas,
	getCanvasConstruct,
	getUsedColors,
	rotateHue,
	splitSpriteSheet,
} from "@/utilities/Canvas";

// Capture `context.filter` at the moment `drawImage` is invoked. drawImage is
// stubbed (no-op), so this only exercises the filter-set / draw / filter-reset
// flow — not pixel output.
function captureFilterOnDraw(run: () => unknown): string {
	let captured = "";
	const spy = vi
		.spyOn(CanvasRenderingContext2D.prototype, "drawImage")
		.mockImplementation(function (this: CanvasRenderingContext2D) {
			captured = this.filter;
		});
	run();
	spy.mockRestore();
	return captured;
}

// ==================== createNewCanvas ====================

describe("createNewCanvas", () => {
	let originalAntialias: boolean;

	beforeEach(() => {
		originalAntialias = Settings.antialias;
	});

	afterEach(() => {
		Settings.antialias = originalAntialias;
	});

	it("returns canvas and context", () => {
		const cc = createNewCanvas(64, 32);
		expect(cc.canvas).toBeInstanceOf(HTMLCanvasElement);
		expect(cc.context).toBeInstanceOf(CanvasRenderingContext2D);
	});

	it("sets the canvas width and height", () => {
		const cc = createNewCanvas(128, 96);
		expect(cc.canvas.width).toBe(128);
		expect(cc.canvas.height).toBe(96);
	});

	it("applies the explicit antialias argument", () => {
		const off = createNewCanvas(10, 10, false);
		expect(off.context.imageSmoothingEnabled).toBe(false);
		const on = createNewCanvas(10, 10, true);
		expect(on.context.imageSmoothingEnabled).toBe(true);
	});

	it("defaults antialias to Settings.antialias", () => {
		Settings.antialias = true;
		const cc = createNewCanvas(10, 10);
		expect(cc.context.imageSmoothingEnabled).toBe(true);

		Settings.antialias = false;
		const cc2 = createNewCanvas(10, 10);
		expect(cc2.context.imageSmoothingEnabled).toBe(false);
	});
});

// ==================== getCanvasConstruct ====================

describe("getCanvasConstruct", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("returns the matched canvas and its context", () => {
		const canvas = document.createElement("canvas");
		canvas.id = "scene";
		document.body.appendChild(canvas);
		const cc = getCanvasConstruct("#scene");
		expect(cc.canvas).toBe(canvas);
		expect(cc.context).toBe(canvas.getContext("2d"));
	});

	it("throws when no element matches", () => {
		expect(() => getCanvasConstruct("#missing")).toThrow(
			"Element not found: #missing",
		);
	});
});

// ==================== applyFilterOnCanvas ====================

describe("applyFilterOnCanvas", () => {
	it("returns a new canvas distinct from the input", () => {
		const src = createNewCanvas(20, 10).canvas;
		const out = applyFilterOnCanvas(src, "blur(2px)");
		expect(out).toBeInstanceOf(HTMLCanvasElement);
		expect(out).not.toBe(src);
	});

	it("defaults width and height to the source image dimensions", () => {
		const src = createNewCanvas(20, 10).canvas;
		const out = applyFilterOnCanvas(src, "none");
		expect(out.width).toBe(20);
		expect(out.height).toBe(10);
	});

	it("uses explicit width and height when provided", () => {
		const src = createNewCanvas(20, 10).canvas;
		const out = applyFilterOnCanvas(src, "none", 50, 40);
		expect(out.width).toBe(50);
		expect(out.height).toBe(40);
	});

	it("applies the filter during the draw", () => {
		const src = createNewCanvas(8, 8).canvas;
		expect(
			captureFilterOnDraw(() => applyFilterOnCanvas(src, "blur(3px)")),
		).toBe("blur(3px)");
	});

	it("resets the filter on the output context so downstream draws are not affected", () => {
		const src = createNewCanvas(8, 8).canvas;
		const out = applyFilterOnCanvas(src, "blur(3px)");
		expect(out.getContext("2d")!.filter).toBe("none");
	});

	it("draws the source image onto the output", () => {
		const src = createNewCanvas(8, 8).canvas;
		const drawSpy = vi.spyOn(
			CanvasRenderingContext2D.prototype,
			"drawImage",
		);
		applyFilterOnCanvas(src, "none");
		expect(drawSpy).toHaveBeenCalledWith(src, 0, 0);
		drawSpy.mockRestore();
	});
});

// ==================== rotateHue ====================

describe("rotateHue", () => {
	it("delegates to applyFilterOnCanvas with a hue-rotate filter", () => {
		const src = createNewCanvas(8, 8).canvas;
		expect(captureFilterOnDraw(() => rotateHue(src, 120))).toBe(
			"hue-rotate(120deg)",
		);
	});

	it("defaults to source dimensions", () => {
		const src = createNewCanvas(12, 6).canvas;
		const out = rotateHue(src, 45);
		expect(out.width).toBe(12);
		expect(out.height).toBe(6);
	});

	it("passes explicit width and height through", () => {
		const src = createNewCanvas(12, 6).canvas;
		const out = rotateHue(src, 45, 24, 12);
		expect(out.width).toBe(24);
		expect(out.height).toBe(12);
	});

	it("handles negative and zero hue", () => {
		const src = createNewCanvas(4, 4).canvas;
		expect(captureFilterOnDraw(() => rotateHue(src, 0))).toBe(
			"hue-rotate(0deg)",
		);
		expect(captureFilterOnDraw(() => rotateHue(src, -90))).toBe(
			"hue-rotate(-90deg)",
		);
	});
});

// ==================== changeColor ====================

describe("changeColor", () => {
	it("preserves caller's globalCompositeOperation across the call", () => {
		const ctx = createNewCanvas(8, 8).context;
		const src = createNewCanvas(8, 8).canvas;
		ctx.globalCompositeOperation = "multiply";
		changeColor(ctx, src, "#ff0000");
		expect(ctx.globalCompositeOperation).toBe("multiply");
	});

	it("preserves caller's fillStyle across the call", () => {
		const ctx = createNewCanvas(8, 8).context;
		const src = createNewCanvas(8, 8).canvas;
		ctx.fillStyle = "#123456";
		changeColor(ctx, src, "#00ff00");
		expect(ctx.fillStyle).toBe("#123456");
	});

	it("invokes the documented composite sequence", () => {
		const ctx = createNewCanvas(8, 8).context;
		const src = createNewCanvas(8, 8).canvas;
		const ops: string[] = [];
		const original = Object.getOwnPropertyDescriptor(
			CanvasRenderingContext2D.prototype,
			"globalCompositeOperation",
		)!;
		Object.defineProperty(ctx, "globalCompositeOperation", {
			configurable: true,
			get: () => ops[ops.length - 1] ?? "source-over",
			set: (v: string) => {
				ops.push(v);
			},
		});
		changeColor(ctx, src, "#ff0000");
		expect(ops).toEqual(["source-over", "color", "destination-in"]);
		Object.defineProperty(ctx, "globalCompositeOperation", original);
	});

	it("clears the canvas before drawing", () => {
		const ctx = createNewCanvas(8, 8).context;
		const src = createNewCanvas(8, 8).canvas;
		const clearSpy = vi.spyOn(ctx, "clearRect");
		changeColor(ctx, src, "#000000");
		expect(clearSpy).toHaveBeenCalledWith(0, 0, 8, 8);
		clearSpy.mockRestore();
	});

	it("draws the source image twice (composite + mask)", () => {
		const ctx = createNewCanvas(8, 8).context;
		const src = createNewCanvas(8, 8).canvas;
		const drawSpy = vi.spyOn(ctx, "drawImage");
		changeColor(ctx, src, "#abcdef");
		expect(drawSpy).toHaveBeenCalledTimes(2);
		drawSpy.mockRestore();
	});

	it("fills a rect covering the source image size", () => {
		const ctx = createNewCanvas(8, 8).context;
		const src = createNewCanvas(16, 12).canvas;
		const fillSpy = vi.spyOn(ctx, "fillRect");
		changeColor(ctx, src, "#abcdef");
		expect(fillSpy).toHaveBeenCalledWith(0, 0, 16, 12);
		fillSpy.mockRestore();
	});
});

// ==================== splitSpriteSheet ====================

describe("splitSpriteSheet", () => {
	it("returns elementsX * elementsY sprites", () => {
		const sheet = createNewCanvas(40, 30).canvas;
		const sprites = splitSpriteSheet(sheet, 4, 3);
		expect(sprites).toHaveLength(12);
	});

	it("sizes each sprite as sheet / elements", () => {
		const sheet = createNewCanvas(40, 30).canvas;
		const sprites = splitSpriteSheet(sheet, 4, 3);
		sprites.forEach(s => {
			expect(s.width).toBe(10);
			expect(s.height).toBe(10);
		});
	});

	it("traverses in row-major order", () => {
		const sheet = createNewCanvas(20, 10).canvas;
		const calls: number[][] = [];
		const subSpy = vi
			.spyOn(HTMLCanvasElement.prototype, "subImage")
			.mockImplementation(function (
				this: HTMLCanvasElement,
				x: number,
				y: number,
				w?: number,
				h?: number,
			) {
				calls.push([x, y, w!, h!]);
				return this;
			});
		splitSpriteSheet(sheet, 2, 2);
		expect(calls).toEqual([
			[0, 0, 10, 5],
			[10, 0, 10, 5],
			[0, 5, 10, 5],
			[10, 5, 10, 5],
		]);
		subSpy.mockRestore();
	});

	it("throws when width does not divide evenly", () => {
		const sheet = createNewCanvas(15, 10).canvas;
		expect(() => splitSpriteSheet(sheet, 4, 2)).toThrow(
			"SpriteSheet doesn't divide evenly: 15x10 / 4x2",
		);
	});

	it("throws when height does not divide evenly", () => {
		const sheet = createNewCanvas(16, 13).canvas;
		expect(() => splitSpriteSheet(sheet, 4, 2)).toThrow(
			"SpriteSheet doesn't divide evenly: 16x13 / 4x2",
		);
	});

	it("supports a 1x1 sheet (single sprite)", () => {
		const sheet = createNewCanvas(20, 20).canvas;
		const sprites = splitSpriteSheet(sheet, 1, 1);
		expect(sprites).toHaveLength(1);
		expect(sprites[0].width).toBe(20);
		expect(sprites[0].height).toBe(20);
	});
});

// ==================== getUsedColors ====================

describe("getUsedColors", () => {
	it("returns a Map keyed by #rrggbb hex", () => {
		const img = createNewCanvas(4, 4).canvas;
		const result = getUsedColors(img);
		expect(result).toBeInstanceOf(Map);
		result.forEach((_, key) => {
			expect(key).toMatch(/^#[0-9a-f]{6}$/);
		});
	});

	it("counts every pixel for a uniform image", () => {
		const img = createNewCanvas(5, 4).canvas;
		const result = getUsedColors(img);
		// vitest-canvas-mock seeds getImageData with all zero bytes → 20 pixels of #000000
		expect(result.get("#000000")).toBe(20);
		expect(result.size).toBe(1);
	});

	it("scales counts by pixelAmount and floors to int", () => {
		const img = createNewCanvas(10, 10).canvas;
		const result = getUsedColors(img, 0.5);
		// 100 * 0.5 = 50
		expect(result.get("#000000")).toBe(50);
	});

	it("drops entries whose scaled count rounds to 0", () => {
		const img = createNewCanvas(4, 4).canvas;
		const result = getUsedColors(img, 0.05);
		// 16 * 0.05 = 0.8 → |0 = 0 → dropped
		expect(result.size).toBe(0);
	});

	it("removeLowerThan drops entries below the threshold", () => {
		const img = createNewCanvas(4, 4).canvas;
		const result = getUsedColors(img, 1, 20);
		// only color has 16 < 20 → dropped
		expect(result.size).toBe(0);
	});

	it("removeHigherThan drops entries above the threshold", () => {
		const img = createNewCanvas(4, 4).canvas;
		const result = getUsedColors(img, 1, 0, 10);
		// only color has 16 > 10 → dropped
		expect(result.size).toBe(0);
	});

	it("keeps entries within the lower/higher band", () => {
		const img = createNewCanvas(4, 4).canvas;
		const result = getUsedColors(img, 1, 10, 20);
		// 16 is between 10 and 20 → kept
		expect(result.get("#000000")).toBe(16);
	});

	it("skips the filter pass entirely with defaults", () => {
		const img = createNewCanvas(3, 3).canvas;
		const result = getUsedColors(img);
		expect(result.get("#000000")).toBe(9);
	});
});
