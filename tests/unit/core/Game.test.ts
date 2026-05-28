import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Game from "@/core/Game";
import Settings from "@/core/Settings";
import { CANVAS_TYPES } from "@/core/CanvasManager";

// ==================== Helpers ====================

class TestGame extends Game {
	public initSpy = vi.fn(async () => {});
	public drawCalls: CanvasRenderingContext2D[] = [];

	public override draw(context: CanvasRenderingContext2D): void {
		this.drawCalls.push(context);
	}

	public override update(_dt: number): void {}

	public override async init(): Promise<void> {
		await this.initSpy();
	}

	public async callPreInit(doInit: boolean = true): Promise<void> {
		// `preInit` is protected — expose it for tests
		await (
			this as unknown as { preInit: (d: boolean) => Promise<void> }
		).preInit(doInit);
	}
}

function createFakeStorage(): Storage {
	const map = new Map<string, string>();
	return {
		get length(): number {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
		key: (i: number) => Array.from(map.keys())[i] ?? null,
		removeItem: (k: string) => {
			map.delete(k);
		},
		setItem: (k: string, v: string) => {
			map.set(k, v);
		},
	};
}

function setupMainCanvas(id: string = "main"): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.id = id;
	c.width = 800;
	c.height = 600;
	document.body.appendChild(c);
	return c;
}

let pendingCbs: ((t: number) => void)[];
let savedAutoloop: boolean;
let savedScrollRestoration: ScrollRestoration;

beforeEach(() => {
	document.body.innerHTML = "";
	savedAutoloop = Settings.autoloop;
	savedScrollRestoration = history.scrollRestoration;
	vi.stubGlobal("localStorage", createFakeStorage());
	pendingCbs = [];
	vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
		pendingCbs.push(cb);
		return pendingCbs.length;
	});
});

afterEach(() => {
	Settings.autoloop = savedAutoloop;
	history.scrollRestoration = savedScrollRestoration;
	document.body.innerHTML = "";
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

// ==================== constructor ====================

describe("Game constructor", () => {
	it("sets history.scrollRestoration to 'manual'", () => {
		setupMainCanvas();
		history.scrollRestoration = "auto";
		new TestGame();
		expect(history.scrollRestoration).toBe("manual");
	});

	it("creates gameloop and keyboard instances", () => {
		setupMainCanvas();
		const g = new TestGame();
		expect(g.gameloop).toBeDefined();
		expect(g.keyboard).toBeDefined();
	});

	it("forwards Settings overrides to Settings.init", () => {
		setupMainCanvas();
		const initSpy = vi.spyOn(Settings, "init");
		const g = new TestGame({ backgroundColor: "#123456" });
		expect(initSpy).toHaveBeenCalledWith({ backgroundColor: "#123456" }, g);
	});
});

// ==================== default draw / update / init ====================

describe("Game default lifecycle methods", () => {
	it("throws when draw is not overridden", () => {
		setupMainCanvas();
		const g = new TestGame();
		// reach through the prototype chain to grab the base implementation
		const baseDraw = Object.getPrototypeOf(Object.getPrototypeOf(g)).draw;
		expect(() => baseDraw.call(g, {} as CanvasRenderingContext2D)).toThrow(
			/Override draw/,
		);
	});

	it("throws when update is not overridden", () => {
		setupMainCanvas();
		const g = new TestGame();
		const baseUpdate = Object.getPrototypeOf(
			Object.getPrototypeOf(g),
		).update;
		expect(() => baseUpdate.call(g, 0.016)).toThrow(/Override update/);
	});

	it("throws when init is not overridden", async () => {
		setupMainCanvas();
		const g = new TestGame();
		const baseInit = Object.getPrototypeOf(Object.getPrototypeOf(g)).init;
		await expect(baseInit.call(g)).rejects.toThrow(/Override init/);
	});
});

// ==================== preInit ====================

describe("Game.preInit", () => {
	it("calls canman.finishSetup", async () => {
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		const spy = vi.spyOn(g.canman, "finishSetup");
		await g.callPreInit(false);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("registers a contextmenu listener that calls preventDefault", async () => {
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		const addSpy = vi.spyOn(document, "addEventListener");
		await g.callPreInit(false);
		const entry = addSpy.mock.calls.find(c => c[0] === "contextmenu");
		expect(entry).toBeDefined();
		const handler = entry![1] as EventListener;
		const event = { preventDefault: vi.fn() } as unknown as Event;
		handler(event);
		expect(event.preventDefault).toHaveBeenCalledTimes(1);
	});

	it("registers a resize listener on window", async () => {
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		const addSpy = vi.spyOn(window, "addEventListener");
		await g.callPreInit(false);
		const types = addSpy.mock.calls.map(c => c[0]);
		expect(types).toContain("resize");
	});

	it("resets gameloop.levelTime to 0", async () => {
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		g.gameloop.levelTime = 1234;
		await g.callPreInit(false);
		expect(g.gameloop.levelTime).toBe(0);
	});

	it("calls init when doInit=true", async () => {
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		await g.callPreInit(true);
		expect(g.initSpy).toHaveBeenCalledTimes(1);
	});

	it("skips init when doInit=false", async () => {
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		await g.callPreInit(false);
		expect(g.initSpy).not.toHaveBeenCalled();
	});

	it("dispatches RESIZED after init", async () => {
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		const resized = vi.fn();
		g.events.addEventListener("resized", resized);
		await g.callPreInit(false);
		expect(resized).toHaveBeenCalledTimes(1);
	});

	it("dispatches RESIZED through the debounced resize listener", async () => {
		Settings.autoloop = false; // keep gameloop out of the timer queue
		vi.useFakeTimers();
		try {
			setupMainCanvas();
			const g = new TestGame();
			g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
			const addSpy = vi.spyOn(window, "addEventListener");
			await g.callPreInit(false);
			const handler = addSpy.mock.calls.find(
				c => c[0] === "resize",
			)?.[1] as EventListener | undefined;
			expect(handler).toBeDefined();
			const resized = vi.fn();
			g.events.addEventListener("resized", resized);
			handler!(new Event("resize"));
			expect(resized).not.toHaveBeenCalled(); // still debounced
			vi.advanceTimersByTime(250);
			expect(resized).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it("starts the gameloop when Settings.autoloop is true", async () => {
		Settings.autoloop = true;
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		const start = vi.spyOn(g.gameloop, "startLoop");
		await g.callPreInit(false);
		expect(start).toHaveBeenCalledTimes(1);
	});

	it("does not start the gameloop when Settings.autoloop is false", async () => {
		Settings.autoloop = false;
		setupMainCanvas();
		const g = new TestGame();
		g.canman.setupCanvas(CANVAS_TYPES.MAIN, "#main");
		const start = vi.spyOn(g.gameloop, "startLoop");
		await g.callPreInit(false);
		expect(start).not.toHaveBeenCalled();
	});
});
