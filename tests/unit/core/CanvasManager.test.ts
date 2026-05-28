import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import CanvasManager, { CANVAS_TYPES } from "@/core/CanvasManager";
import Settings from "@/core/Settings";
import Vec2 from "@/math/Vec2";
import type Game from "@/core/Game";
import { EVENT_NAMES, EventSystem } from "@/core/EventSystem";

// ==================== Helpers ====================

function makeCanvasEl(
	id: string,
	w: number = 800,
	h: number = 600,
): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.id = id;
	c.width = w;
	c.height = h;
	document.body.appendChild(c);
	return c;
}

function makeGameWithEvents(): Game {
	return { events: new EventSystem() } as unknown as Game;
}

function withWindow(width: number, height: number): () => void {
	const origW = window.innerWidth;
	const origH = window.innerHeight;
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		value: width,
	});
	Object.defineProperty(window, "innerHeight", {
		configurable: true,
		value: height,
	});
	return () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: origW,
		});
		Object.defineProperty(window, "innerHeight", {
			configurable: true,
			value: origH,
		});
	};
}

let savedEnableResize: boolean;

beforeEach(() => {
	document.body.innerHTML = "";
	savedEnableResize = Settings.enableResize;
});

afterEach(() => {
	Settings.enableResize = savedEnableResize;
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

// ==================== setupCanvas ====================

describe("CanvasManager.setupCanvas", () => {
	it("throws when the selector does not match any element", () => {
		const cm = new CanvasManager();
		expect(() => cm.setupCanvas(CANVAS_TYPES.MAIN, "#missing")).toThrow(
			/Canvas '#missing' does not exist/,
		);
	});

	it("throws when the same selector is registered twice", () => {
		makeCanvasEl("scene");
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#scene");
		expect(() => cm.setupCanvas(CANVAS_TYPES.MAIN, "#scene")).toThrow(
			/Canvas '#scene' was already registered/,
		);
	});

	it("stores the holder under the selector stripped of '#'", () => {
		makeCanvasEl("scene");
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#scene");
		expect(cm.canvasHolder.scene).toBeDefined();
		expect(cm.canvasHolder.scene.id).toBe("#scene");
	});

	it("returns the registered holder with type, resize, canvas, and context", () => {
		makeCanvasEl("scene");
		const cm = new CanvasManager();
		const holder = cm.setupCanvas(CANVAS_TYPES.MAIN, "#scene", false);
		expect(holder.type).toBe(CANVAS_TYPES.MAIN);
		expect(holder.resize).toBe(false);
		expect(holder.canvas).toBeInstanceOf(HTMLCanvasElement);
		expect(holder.context).toBe(holder.canvas.getContext("2d"));
	});

	it("defaults resize to true", () => {
		makeCanvasEl("scene");
		const cm = new CanvasManager();
		const holder = cm.setupCanvas(CANVAS_TYPES.MAIN, "#scene");
		expect(holder.resize).toBe(true);
	});

	it("seeds the context with fillStyle='white', strokeStyle='white', font='12px Arial'", () => {
		makeCanvasEl("scene");
		const cm = new CanvasManager();
		const holder = cm.setupCanvas(CANVAS_TYPES.MAIN, "#scene");
		expect(holder.context.fillStyle).toBe("#ffffff");
		expect(holder.context.strokeStyle).toBe("#ffffff");
		expect(holder.context.font).toBe("12px Arial");
	});
});

// ==================== finishSetup ====================

describe("CanvasManager.finishSetup", () => {
	it("throws when no MAIN canvas is registered", () => {
		makeCanvasEl("bg");
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.BACKGROUND, "#bg");
		expect(() => cm.finishSetup(makeGameWithEvents())).toThrow(
			/No main canvas defined/,
		);
	});

	it("throws when two MAIN canvases are registered", () => {
		makeCanvasEl("a");
		makeCanvasEl("b");
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#a");
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#b");
		expect(() => cm.finishSetup(makeGameWithEvents())).toThrow(
			/Multiple main canvas defined/,
		);
	});

	it("binds canvas/canvasContext/width/height to the MAIN holder", () => {
		makeCanvasEl("bg", 200, 100);
		const main = makeCanvasEl("main", 800, 600);
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.BACKGROUND, "#bg");
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		cm.finishSetup(makeGameWithEvents());
		expect(cm.canvas).toBe(main);
		expect(cm.canvasContext).toBe(main.getContext("2d"));
		expect(cm.width).toBe(800);
		expect(cm.height).toBe(600);
	});

	it("captures the bounding client rect of the MAIN canvas", () => {
		const main = makeCanvasEl("main");
		const rect = { left: 5, top: 10, width: 800, height: 600 } as DOMRect;
		vi.spyOn(main, "getBoundingClientRect").mockReturnValue(rect);
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		cm.finishSetup(makeGameWithEvents());
		expect(cm.canvasBoundingClientRect).toBe(rect);
	});

	it("subscribes resize() to RESIZED when Settings.enableResize is true", () => {
		Settings.enableResize = true;
		makeCanvasEl("main");
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		const game = makeGameWithEvents();
		cm.finishSetup(game);
		const resize = vi.spyOn(cm, "resize");
		game.events.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(resize).toHaveBeenCalledTimes(1);
	});

	it("does not subscribe to RESIZED when Settings.enableResize is false", () => {
		Settings.enableResize = false;
		makeCanvasEl("main");
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		const game = makeGameWithEvents();
		cm.finishSetup(game);
		const resize = vi.spyOn(cm, "resize");
		game.events.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(resize).not.toHaveBeenCalled();
	});
});

// ==================== resize ====================

describe("CanvasManager.resize", () => {
	it("scales the main canvas to fit when windowRatio < canvasRatio (height-bound)", () => {
		// canvas 800x600 → canvasRatio = 0.75
		// window 1200x600 → windowRatio = 0.5 (< 0.75)
		const restore = withWindow(1200, 600);
		try {
			const main = makeCanvasEl("main", 800, 600);
			const cm = new CanvasManager();
			cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
			cm.finishSetup(makeGameWithEvents());
			cm.resize();
			// height = innerHeight = 600; width = 600 / 0.75 = 800
			expect(main.style.height).toBe("600px");
			expect(main.style.width).toBe("800px");
			expect(cm.resizedSize.x).toBe(800);
			expect(cm.resizedSize.y).toBe(600);
			expect(cm.ratio).toBe(1);
		} finally {
			restore();
		}
	});

	it("scales the main canvas to fit when windowRatio >= canvasRatio (width-bound)", () => {
		// canvas 800x600 → canvasRatio = 0.75
		// window 1000x900 → windowRatio = 0.9 (>= 0.75)
		const restore = withWindow(1000, 900);
		try {
			const main = makeCanvasEl("main", 800, 600);
			const cm = new CanvasManager();
			cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
			cm.finishSetup(makeGameWithEvents());
			cm.resize();
			// width = innerWidth = 1000; height = 1000 * 0.75 = 750
			expect(main.style.width).toBe("1000px");
			expect(main.style.height).toBe("750px");
			expect(cm.resizedSize.x).toBe(1000);
			expect(cm.resizedSize.y).toBe(750);
			expect(cm.ratio).toBeCloseTo(1000 / 800);
		} finally {
			restore();
		}
	});

	it("skips holders whose resize flag is false", () => {
		const restore = withWindow(1000, 900);
		try {
			makeCanvasEl("main", 800, 600);
			const bg = makeCanvasEl("bg", 800, 600);
			const cm = new CanvasManager();
			cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
			cm.setupCanvas(CANVAS_TYPES.BACKGROUND, "#bg", false);
			cm.finishSetup(makeGameWithEvents());
			cm.resize();
			expect(bg.style.width).toBe("");
			expect(bg.style.height).toBe("");
		} finally {
			restore();
		}
	});

	it("resizes non-main holders without touching resizedSize or ratio", () => {
		const restore = withWindow(1000, 900);
		try {
			makeCanvasEl("main", 800, 600);
			const bg = makeCanvasEl("bg", 400, 200);
			const cm = new CanvasManager();
			cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
			cm.setupCanvas(CANVAS_TYPES.BACKGROUND, "#bg");
			cm.finishSetup(makeGameWithEvents());
			cm.resize();
			// bg ratio = 0.5; window ratio = 0.9 (>= 0.5) → width-bound
			expect(bg.style.width).toBe("1000px");
			expect(bg.style.height).toBe("500px");
			// main is 800x600 (ratio 0.75), still width-bound at this window size
			expect(cm.resizedSize.x).toBe(1000);
		} finally {
			restore();
		}
	});

	it("refreshes canvasBoundingClientRect after the resize", () => {
		const restore = withWindow(1000, 900);
		try {
			const main = makeCanvasEl("main", 800, 600);
			let callCount = 0;
			vi.spyOn(main, "getBoundingClientRect").mockImplementation(
				() =>
					({
						left: ++callCount,
						top: 0,
						width: 0,
						height: 0,
					}) as DOMRect,
			);
			const cm = new CanvasManager();
			cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
			cm.finishSetup(makeGameWithEvents());
			const before = cm.canvasBoundingClientRect;
			cm.resize();
			expect(cm.canvasBoundingClientRect).not.toBe(before);
		} finally {
			restore();
		}
	});
});

// ==================== getters / setters ====================

describe("CanvasManager dimension getters", () => {
	it("size returns a new Vec2 of (width, height)", () => {
		makeCanvasEl("main", 320, 240);
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		cm.finishSetup(makeGameWithEvents());
		const size = cm.size;
		expect(size).toBeInstanceOf(Vec2);
		expect(size.x).toBe(320);
		expect(size.y).toBe(240);
		// fresh instance each read
		expect(cm.size).not.toBe(size);
	});

	it("width setter writes through to the underlying canvas", () => {
		const main = makeCanvasEl("main", 100, 100);
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		cm.finishSetup(makeGameWithEvents());
		cm.width = 256;
		expect(main.width).toBe(256);
	});

	it("height setter writes through to the underlying canvas", () => {
		const main = makeCanvasEl("main", 100, 100);
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		cm.finishSetup(makeGameWithEvents());
		cm.height = 128;
		expect(main.height).toBe(128);
	});
});

// ==================== setFontSize ====================

describe("CanvasManager.setFontSize", () => {
	it("uses Settings.font by default", () => {
		const savedFont = Settings.font;
		Settings.font = "Arial";
		try {
			makeCanvasEl("main");
			const cm = new CanvasManager();
			cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
			cm.finishSetup(makeGameWithEvents());
			cm.setFontSize(20);
			expect(cm.canvasContext.font).toBe("20px \"Arial\"");
		} finally {
			Settings.font = savedFont;
		}
	});

	it("uses an explicit font when provided", () => {
		makeCanvasEl("main");
		const cm = new CanvasManager();
		cm.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		cm.finishSetup(makeGameWithEvents());
		cm.setFontSize(14, "Times New Roman");
		expect(cm.canvasContext.font).toBe("14px \"Times New Roman\"");
	});
});
