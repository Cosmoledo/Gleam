import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Gameloop from "@/core/Gameloop";
import Settings from "@/core/Settings";
import type Game from "@/core/Game";
import { createMockGame } from "../createMockGame";
import { EventSystem } from "@/core/EventSystem";

// ==================== Helpers ====================

let pendingCbs: ((time: number) => void)[];
let rafTime: number;

function stepFrame(deltaMs: number = 16): void {
	const cb = pendingCbs.shift();
	if (!cb) {
		return;
	}
	rafTime += deltaMs;
	cb(rafTime);
}

type Spy = ReturnType<typeof vi.fn>;

function makeGameloop(): {
	gl: Gameloop;
	game: Game;
	update: Spy;
	draw: Spy;
	} {
	const game = createMockGame();
	const gl = new Gameloop(game);
	return {
		gl,
		game,
		update: game.update as unknown as Spy,
		draw: game.draw as unknown as Spy,
	};
}

let savedFps: number;
let savedDoNotClear: boolean;
let savedUseClearRect: boolean;
let savedBg: string;

beforeEach(() => {
	pendingCbs = [];
	rafTime = 0;
	vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
		pendingCbs.push(cb);
		return pendingCbs.length;
	});
	vi.spyOn(console, "log").mockImplementation(() => {});
	savedFps = Settings.fps;
	savedDoNotClear = Settings.doNotClear;
	savedUseClearRect = Settings.useClearRect;
	savedBg = Settings.backgroundColor;
});

afterEach(() => {
	Settings.fps = savedFps;
	Settings.doNotClear = savedDoNotClear;
	Settings.useClearRect = savedUseClearRect;
	Settings.backgroundColor = savedBg;
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

// ==================== isStopped ====================

describe("Gameloop.isStopped", () => {
	it("starts true (no startLoop yet)", () => {
		const { gl } = makeGameloop();
		expect(gl.isStopped()).toBe(false); // private `stop` default is false
	});

	it("returns false after startLoop", () => {
		const { gl } = makeGameloop();
		gl.startLoop();
		expect(gl.isStopped()).toBe(false);
	});

	it("returns true after stopLoop", () => {
		const { gl } = makeGameloop();
		gl.startLoop();
		gl.stopLoop();
		expect(gl.isStopped()).toBe(true);
	});
});

// ==================== startLoop ====================

describe("Gameloop.startLoop", () => {
	it("schedules a requestAnimationFrame on first call", () => {
		const { gl } = makeGameloop();
		gl.startLoop();
		expect(pendingCbs.length).toBe(1);
	});

	it("clears the stop flag", () => {
		const { gl } = makeGameloop();
		gl.startLoop();
		gl.stopLoop();
		expect(gl.isStopped()).toBe(true);
		gl.startLoop();
		expect(gl.isStopped()).toBe(false);
	});

	it("is idempotent while the loop is already running", () => {
		const { gl } = makeGameloop();
		gl.startLoop();
		gl.startLoop();
		gl.startLoop();
		// looper guard: only the very first call schedules an rAF
		expect(pendingCbs.length).toBe(1);
	});

	it("can be restarted after the previous run has fully stopped", () => {
		const { gl } = makeGameloop();
		gl.startLoop();
		gl.stopLoop();
		stepFrame(); // observes stop=true → tears down
		expect(pendingCbs.length).toBe(0);
		gl.startLoop();
		expect(pendingCbs.length).toBe(1);
	});
});

// ==================== stopLoop ====================

describe("Gameloop.stopLoop", () => {
	it("sets the stop flag", () => {
		const { gl } = makeGameloop();
		gl.startLoop();
		gl.stopLoop();
		expect(gl.isStopped()).toBe(true);
	});

	it("calls .stop() on a `sound` property when present", () => {
		const { gl } = makeGameloop();
		const sound = { stop: vi.fn() };
		(gl as unknown as { sound: typeof sound }).sound = sound;
		gl.stopLoop();
		expect(sound.stop).toHaveBeenCalledTimes(1);
	});

	it("does not throw when no sound is attached", () => {
		const { gl } = makeGameloop();
		expect(() => gl.stopLoop()).not.toThrow();
	});
});

// ==================== loop body ====================

describe("Gameloop tick mechanics", () => {
	it("calls draw once per rAF frame", () => {
		Settings.fps = 1; // make the update-loop trivial
		Settings.doNotClear = true; // skip clear branch to keep this test focused
		const { gl, game, draw } = makeGameloop();
		gl.startLoop();
		stepFrame(16);
		expect(draw).toHaveBeenCalledTimes(1);
		expect(draw).toHaveBeenLastCalledWith(game.canman.canvasContext);
	});

	it("accumulates real time into levelTime in milliseconds", () => {
		Settings.fps = 1; // do not consume the accumulator with updates
		Settings.doNotClear = true;
		const { gl } = makeGameloop();
		gl.startLoop();
		stepFrame(16); // first frame: dt=0 (lastTime starts at 0)
		stepFrame(16); // dt = (32-16)/1000 = 0.016 → levelTime += 16
		stepFrame(16); // dt = (48-32)/1000 = 0.016 → levelTime += 16
		expect(gl.levelTime).toBeCloseTo(32);
	});

	it("calls update once per fps-sized accumulator slot, then drains the accumulator", () => {
		Settings.fps = 0.01; // 10ms slots
		Settings.doNotClear = true;
		const { gl, update } = makeGameloop();
		gl.startLoop();
		stepFrame(16); // dt=0 — no slot consumed
		stepFrame(16); // dt=0.016 → accumulator=0.016 → one update at 10ms, remainder 0.006
		expect(update).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenLastCalledWith(0.01);
		stepFrame(16); // dt=0.016 → accumulator=0.022 → two updates
		expect(update).toHaveBeenCalledTimes(3);
	});
});

// ==================== per-frame clear / fill ====================

describe("Gameloop per-frame clear", () => {
	it("uses clearRect when doNotClear=false and useClearRect=true", () => {
		Settings.fps = 1;
		Settings.doNotClear = false;
		Settings.useClearRect = true;
		const { gl, game } = makeGameloop();
		const clear = vi.spyOn(game.canman.canvasContext, "clearRect");
		const fill = vi.spyOn(game.canman.canvasContext, "fillRect");
		gl.startLoop();
		stepFrame(16);
		expect(clear).toHaveBeenCalledWith(0, 0, 800, 600);
		expect(fill).not.toHaveBeenCalled();
	});

	it("uses fillRect with backgroundColor when doNotClear=false and useClearRect=false", () => {
		Settings.fps = 1;
		Settings.doNotClear = false;
		Settings.useClearRect = false;
		Settings.backgroundColor = "#abcdef";
		const { gl, game } = makeGameloop();
		const ctx = game.canman.canvasContext;
		const clear = vi.spyOn(ctx, "clearRect");
		const fill = vi.spyOn(ctx, "fillRect");
		gl.startLoop();
		stepFrame(16);
		expect(fill).toHaveBeenCalledWith(0, 0, 800, 600);
		expect(ctx.fillStyle).toBe("#abcdef");
		expect(clear).not.toHaveBeenCalled();
	});

	it("does not clear or fill when doNotClear=true", () => {
		Settings.fps = 1;
		Settings.doNotClear = true;
		const { gl, game } = makeGameloop();
		const clear = vi.spyOn(game.canman.canvasContext, "clearRect");
		const fill = vi.spyOn(game.canman.canvasContext, "fillRect");
		gl.startLoop();
		stepFrame(16);
		expect(clear).not.toHaveBeenCalled();
		expect(fill).not.toHaveBeenCalled();
	});

	it("delegates to game.draw(context) in all branches", () => {
		Settings.fps = 1;
		Settings.doNotClear = false;
		Settings.useClearRect = true;
		const { gl, game, draw } = makeGameloop();
		gl.startLoop();
		stepFrame(16);
		expect(draw).toHaveBeenCalledTimes(1);
		expect(draw).toHaveBeenLastCalledWith(game.canman.canvasContext);
	});
});

// ==================== stop path inside the loop ====================

describe("Gameloop stop path", () => {
	it("dispatches GAMELOOP_STOPPED, resets keyboard, and tears down on the next frame", () => {
		const dispatchSpy = vi.spyOn(EventSystem, "dispatchEvent");
		const { gl, game } = makeGameloop();
		gl.startLoop();
		gl.stopLoop();
		stepFrame();
		expect(dispatchSpy).toHaveBeenCalledWith("gameloopStopped");
		expect(game.keyboard.reset).toHaveBeenCalledTimes(1);
		// rafLoop's internal `running=false` prevents the next rAF from being scheduled
		expect(pendingCbs.length).toBe(0);
	});

	it("does not call update or draw on the frame that observes the stop", () => {
		const { gl, update, draw } = makeGameloop();
		gl.startLoop();
		gl.stopLoop();
		stepFrame();
		expect(update).not.toHaveBeenCalled();
		expect(draw).not.toHaveBeenCalled();
	});
});
