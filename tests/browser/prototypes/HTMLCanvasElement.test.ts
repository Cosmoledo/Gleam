import { beforeEach, describe, expect, it, vi } from "vitest";

import "@/prototypes/index";

function makeCanvas(
	width: number,
	height: number,
	fill?: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	if (fill) {
		fill(canvas.getContext("2d")!);
	}
	return canvas;
}

// ==================== hasAnyColor ====================

describe("HTMLCanvasElement.hasAnyColor", () => {
	it("returns false for a blank transparent canvas", () => {
		expect(makeCanvas(4, 4).hasAnyColor()).toBe(false);
	});

	it("returns true when at least one pixel has any non-zero channel", () => {
		const canvas = makeCanvas(4, 4, ctx => {
			ctx.fillStyle = "#ff0000";
			ctx.fillRect(1, 1, 1, 1);
		});
		expect(canvas.hasAnyColor()).toBe(true);
	});

	it("returns true for a fully-opaque black fill (alpha alone)", () => {
		const canvas = makeCanvas(2, 2, ctx => {
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, 2, 2);
		});
		expect(canvas.hasAnyColor()).toBe(true);
	});
});

// ==================== getPixelAt ====================

describe("HTMLCanvasElement.getPixelAt", () => {
	let canvas: HTMLCanvasElement;

	beforeEach(() => {
		canvas = makeCanvas(4, 4, ctx => {
			ctx.fillStyle = "rgba(255, 0, 0, 1)";
			ctx.fillRect(1, 1, 1, 1);
		});
	});

	it("returns an integer by default", () => {
		const px = canvas.getPixelAt(1, 1);
		expect(typeof px).toBe("number");
	});

	it("returns array [r, g, b, a] when requested", () => {
		const px = canvas.getPixelAt(1, 1, "array");
		expect(px).toEqual([255, 0, 0, 255]);
	});

	it("returns json {r, g, b, a} when requested", () => {
		const px = canvas.getPixelAt(1, 1, "json");
		expect(px).toEqual({ r: 255, g: 0, b: 0, a: 255 });
	});

	it("returns rgba string when requested", () => {
		expect(canvas.getPixelAt(1, 1, "string")).toBe("rgba(255, 0, 0, 255)");
	});

	it("returns zero/transparent for out-of-bounds coords", () => {
		expect(canvas.getPixelAt(-1, 0, "array")).toEqual([0, 0, 0, 0]);
		expect(canvas.getPixelAt(0, -1, "array")).toEqual([0, 0, 0, 0]);
		expect(canvas.getPixelAt(canvas.width, 0, "array")).toEqual([
			0, 0, 0, 0,
		]);
		expect(canvas.getPixelAt(0, canvas.height, "array")).toEqual([
			0, 0, 0, 0,
		]);
	});

	it("returns transparent for a blank pixel inside bounds", () => {
		expect(canvas.getPixelAt(0, 0, "array")).toEqual([0, 0, 0, 0]);
	});
});

// ==================== replaceColors ====================

describe("HTMLCanvasElement.replaceColors", () => {
	it("swaps the targeted color in place", () => {
		const canvas = makeCanvas(2, 1, ctx => {
			ctx.fillStyle = "#ff0000";
			ctx.fillRect(0, 0, 1, 1);
			ctx.fillStyle = "#00ff00";
			ctx.fillRect(1, 0, 1, 1);
		});
		canvas.replaceColors({ "#ff0000": "#0000ff" });
		expect(canvas.getPixelAt(0, 0, "array")).toEqual([0, 0, 255, 255]);
		expect(canvas.getPixelAt(1, 0, "array")).toEqual([0, 255, 0, 255]);
	});

	it("returns the same canvas (chainable in place)", () => {
		const canvas = makeCanvas(1, 1, ctx => {
			ctx.fillStyle = "#ff0000";
			ctx.fillRect(0, 0, 1, 1);
		});
		expect(canvas.replaceColors({ "#ff0000": "#00ff00" })).toBe(canvas);
	});

	it("skips fully-transparent pixels", () => {
		const canvas = makeCanvas(1, 1);
		canvas.replaceColors({ "#000000": "#ff0000" });
		expect(canvas.getPixelAt(0, 0, "array")).toEqual([0, 0, 0, 0]);
	});

	it("ignores colors not in the replacement map", () => {
		const canvas = makeCanvas(1, 1, ctx => {
			ctx.fillStyle = "#abcdef";
			ctx.fillRect(0, 0, 1, 1);
		});
		canvas.replaceColors({ "#ff0000": "#00ff00" });
		const [r, g, b] = canvas.getPixelAt(0, 0, "array");
		expect([r, g, b]).toEqual([0xab, 0xcd, 0xef]);
	});

	it("preserves alpha of semi-transparent matched pixels", () => {
		const canvas = makeCanvas(1, 1, ctx => {
			ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
			ctx.fillRect(0, 0, 1, 1);
		});
		const [r, g, b, a] = canvas.getPixelAt(0, 0, "array");
		canvas.replaceColors({
			[`#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`]:
				"#00ff00",
		});
		const after = canvas.getPixelAt(0, 0, "array");
		expect(after[3]).toBe(a);
		expect([after[0], after[1], after[2]]).toEqual([0, 255, 0]);
	});
});

// ==================== rotateBy / rotateByAligned ====================

describe("HTMLCanvasElement.rotateBy", () => {
	it("returns a square canvas sized by the diagonal", () => {
		const canvas = makeCanvas(8, 6);
		const out = canvas.rotateBy(Math.PI / 4);
		const expected = Math.ceil(Math.sqrt(8 * 8 + 6 * 6));
		expect(out.width).toBe(expected);
		expect(out.height).toBe(expected);
	});

	it("returns a new canvas distinct from the source", () => {
		const canvas = makeCanvas(4, 4);
		const out = canvas.rotateBy(0);
		expect(out).not.toBe(canvas);
		expect(out).toBeInstanceOf(HTMLCanvasElement);
	});
});

describe("HTMLCanvasElement.rotateByAligned", () => {
	it("preserves the source dimensions", () => {
		const canvas = makeCanvas(10, 6);
		const out = canvas.rotateByAligned(Math.PI / 2);
		expect(out.width).toBe(10);
		expect(out.height).toBe(6);
	});

	it("returns a new canvas distinct from the source", () => {
		const canvas = makeCanvas(4, 4);
		const out = canvas.rotateByAligned(0);
		expect(out).not.toBe(canvas);
	});
});

// ==================== autoCrop ====================

describe("HTMLCanvasElement.autoCrop", () => {
	it("crops to the bounding box of non-transparent pixels", () => {
		const canvas = makeCanvas(16, 16, ctx => {
			ctx.fillStyle = "#ff0000";
			ctx.fillRect(3, 4, 5, 6);
		});
		const cropped = canvas.autoCrop();
		expect(cropped.width).toBe(5);
		expect(cropped.height).toBe(6);
	});

	it("crops to a single pixel for a one-pixel image", () => {
		const canvas = makeCanvas(8, 8, ctx => {
			ctx.fillStyle = "#00ff00";
			ctx.fillRect(2, 3, 1, 1);
		});
		const cropped = canvas.autoCrop();
		expect(cropped.width).toBe(1);
		expect(cropped.height).toBe(1);
	});
});

// ==================== scaleBy ====================

describe("HTMLCanvasElement.scaleBy", () => {
	it("scales both axes uniformly when only scaleX is given", () => {
		const canvas = makeCanvas(10, 6);
		const out = canvas.scaleBy(2);
		expect(out.width).toBe(20);
		expect(out.height).toBe(12);
	});

	it("scales axes independently when both are given", () => {
		const canvas = makeCanvas(10, 6);
		const out = canvas.scaleBy(2, 3);
		expect(out.width).toBe(20);
		expect(out.height).toBe(18);
	});

	it("returns the same canvas when both scales are 1", () => {
		const canvas = makeCanvas(10, 6);
		expect(canvas.scaleBy(1, 1)).toBe(canvas);
	});

	it("defaults to 1 for scaleX when called with no args", () => {
		const canvas = makeCanvas(10, 6);
		expect(canvas.scaleBy()).toBe(canvas);
	});

	it("throws on zero scale", () => {
		const canvas = makeCanvas(4, 4);
		expect(() => canvas.scaleBy(0)).toThrow(
			"scaleBy requires positive scale factors",
		);
	});

	it("throws on negative scale", () => {
		const canvas = makeCanvas(4, 4);
		expect(() => canvas.scaleBy(-1)).toThrow();
		expect(() => canvas.scaleBy(1, -2)).toThrow();
	});
});

// ==================== resize ====================

describe("HTMLCanvasElement.resize", () => {
	it("resizes by width by default and scales height proportionally", () => {
		const canvas = makeCanvas(100, 50);
		const out = canvas.resize(50);
		expect(out.width).toBe(50);
		expect(out.height).toBe(25);
	});

	it("resizes by height when isWidth is false", () => {
		const canvas = makeCanvas(100, 50);
		const out = canvas.resize(25, false);
		expect(out.width).toBe(50);
		expect(out.height).toBe(25);
	});
});

// ==================== flipX / flipY ====================

describe("HTMLCanvasElement.flipX", () => {
	it("returns a canvas of the same size", () => {
		const canvas = makeCanvas(10, 6);
		const out = canvas.flipX();
		expect(out.width).toBe(10);
		expect(out.height).toBe(6);
	});

	it("mirrors a colored pixel horizontally", () => {
		const canvas = makeCanvas(4, 1, ctx => {
			ctx.fillStyle = "#ff0000";
			ctx.fillRect(0, 0, 1, 1);
		});
		const out = canvas.flipX();
		expect(out.getPixelAt(3, 0, "array")).toEqual([255, 0, 0, 255]);
		expect(out.getPixelAt(0, 0, "array")).toEqual([0, 0, 0, 0]);
	});

	it("accepts an offset", () => {
		const canvas = makeCanvas(4, 1);
		const out = canvas.flipX(2);
		expect(out.width).toBe(4);
	});
});

describe("HTMLCanvasElement.flipY", () => {
	it("returns a canvas of the same size", () => {
		const canvas = makeCanvas(6, 10);
		const out = canvas.flipY();
		expect(out.width).toBe(6);
		expect(out.height).toBe(10);
	});

	it("mirrors a colored pixel vertically", () => {
		const canvas = makeCanvas(1, 4, ctx => {
			ctx.fillStyle = "#00ff00";
			ctx.fillRect(0, 0, 1, 1);
		});
		const out = canvas.flipY();
		expect(out.getPixelAt(0, 3, "array")).toEqual([0, 255, 0, 255]);
		expect(out.getPixelAt(0, 0, "array")).toEqual([0, 0, 0, 0]);
	});

	it("accepts an offset", () => {
		const canvas = makeCanvas(1, 4);
		const out = canvas.flipY(2);
		expect(out.height).toBe(4);
	});
});

// ==================== subImage ====================

describe("HTMLCanvasElement.subImage", () => {
	it("returns a new canvas with the given dimensions", () => {
		const canvas = makeCanvas(20, 20);
		const out = canvas.subImage(2, 3, 8, 6);
		expect(out.width).toBe(8);
		expect(out.height).toBe(6);
	});

	it("copies the source pixels at the supplied offset", () => {
		const canvas = makeCanvas(8, 8, ctx => {
			ctx.fillStyle = "#0000ff";
			ctx.fillRect(2, 2, 1, 1);
		});
		const out = canvas.subImage(2, 2, 4, 4);
		expect(out.getPixelAt(0, 0, "array")).toEqual([0, 0, 255, 255]);
	});

	it("defaults width and height to the source dimensions when omitted", () => {
		const canvas = makeCanvas(7, 5);
		const out = canvas.subImage(0, 0);
		expect(out.width).toBe(7);
		expect(out.height).toBe(5);
	});

	it("defaults only the height when only width is supplied", () => {
		const canvas = makeCanvas(7, 5);
		const out = canvas.subImage(0, 0, 3);
		expect(out.width).toBe(3);
		expect(out.height).toBe(5);
	});
});

// ==================== clone ====================

describe("HTMLCanvasElement.clone", () => {
	it("returns a new canvas with the same dimensions", () => {
		const canvas = makeCanvas(12, 8);
		const out = canvas.clone();
		expect(out).not.toBe(canvas);
		expect(out.width).toBe(12);
		expect(out.height).toBe(8);
	});

	it("preserves the id", () => {
		const canvas = makeCanvas(4, 4);
		canvas.id = "scene";
		expect(canvas.clone().id).toBe("scene");
	});

	it("copies dataset entries", () => {
		const canvas = makeCanvas(4, 4);
		canvas.dataset.role = "background";
		canvas.dataset.layer = "2";
		const out = canvas.clone();
		expect(out.dataset.role).toBe("background");
		expect(out.dataset.layer).toBe("2");
	});

	it("draws the source image onto the clone", () => {
		const canvas = makeCanvas(4, 4, ctx => {
			ctx.fillStyle = "#ff00ff";
			ctx.fillRect(1, 1, 1, 1);
		});
		const out = canvas.clone();
		expect(out.getPixelAt(1, 1, "array")).toEqual([255, 0, 255, 255]);
	});
});

// ==================== toImage ====================

describe("HTMLCanvasElement.toImage", () => {
	it("returns an HTMLImageElement", () => {
		const canvas = makeCanvas(4, 4);
		const img = canvas.toImage();
		expect(img).toBeInstanceOf(HTMLImageElement);
	});

	it("sets src to a data URL produced by the canvas", () => {
		const canvas = makeCanvas(4, 4);
		const spy = vi
			.spyOn(canvas, "toDataURL")
			.mockReturnValue("data:image/png;base64,FAKE");
		const img = canvas.toImage();
		expect(img.src).toBe("data:image/png;base64,FAKE");
		spy.mockRestore();
	});
});

// ==================== HTMLImageElement.subImage (shared impl) ====================

describe("HTMLImageElement.subImage", () => {
	it("is aliased to HTMLCanvasElement.subImage", () => {
		expect(HTMLImageElement.prototype.subImage).toBe(
			HTMLCanvasElement.prototype.subImage,
		);
	});
});
