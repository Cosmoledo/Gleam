import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Gameloop from "@/core/Gameloop";
import Settings from "@/core/Settings";
import type Game from "@/core/Game";

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

interface GameStub {
	canman: { canvasContext: object };
	events: { dispatchEvent: ReturnType<typeof vi.fn> };
	keyboard: { reset: ReturnType<typeof vi.fn> };
}

function makeGameStub(): GameStub {
	return {
		canman: { canvasContext: {} },
		events: { dispatchEvent: vi.fn() },
		keyboard: { reset: vi.fn() },
	};
}

function makeGameloop(stub: GameStub = makeGameStub()): {
	gl: Gameloop;
	update: ReturnType<typeof vi.fn>;
	draw: ReturnType<typeof vi.fn>;
	stub: GameStub;
} {
	const update = vi.fn();
	const draw = vi.fn();
	const gl = new Gameloop(stub as unknown as Game, update, draw);
	return { gl, update, draw, stub };
}

let savedFps: number;

beforeEach(() => {
	pendingCbs = [];
	rafTime = 0;
	vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
		pendingCbs.push(cb);
		return pendingCbs.length;
	});
	vi.spyOn(console, "log").mockImplementation(() => {});
	savedFps = Settings.fps;
});

afterEach(() => {
	Settings.fps = savedFps;
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
		const { gl, draw, stub } = makeGameloop();
		gl.startLoop();
		stepFrame(16);
		expect(draw).toHaveBeenCalledTimes(1);
		expect(draw).toHaveBeenLastCalledWith(stub.canman.canvasContext);
	});

	it("accumulates real time into levelTime in milliseconds", () => {
		Settings.fps = 1; // do not consume the accumulator with updates
		const { gl } = makeGameloop();
		gl.startLoop();
		stepFrame(16); // first frame: dt=0 (lastTime starts at 0)
		stepFrame(16); // dt = (32-16)/1000 = 0.016 → levelTime += 16
		stepFrame(16); // dt = (48-32)/1000 = 0.016 → levelTime += 16
		expect(gl.levelTime).toBeCloseTo(32);
	});

	it("calls update once per fps-sized accumulator slot, then drains the accumulator", () => {
		Settings.fps = 0.01; // 10ms slots
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

// ==================== stop path inside the loop ====================

describe("Gameloop stop path", () => {
	it("dispatches GAMELOOP_STOPPED, resets keyboard, and tears down on the next frame", () => {
		const { gl, stub } = makeGameloop();
		gl.startLoop();
		gl.stopLoop();
		stepFrame();
		expect(stub.events.dispatchEvent).toHaveBeenCalledWith(
			"gameloopStopped",
		);
		expect(stub.keyboard.reset).toHaveBeenCalledTimes(1);
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
