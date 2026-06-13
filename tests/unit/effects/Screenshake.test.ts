import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Screenshake, { SHAKE_TYPES } from "@/effects/Screenshake";

// ==================== Helpers ====================

let pendingCbs: ((time: number) => void)[] = [];
let rafTime = 0;

function stepFrame(deltaMs: number = 16): void {
	const cb = pendingCbs.shift();
	if (!cb) {
		return;
	}
	rafTime += deltaMs;
	cb(rafTime);
}

function runToCompletion(maxFrames: number = 500): number {
	let frames = 0;
	while (pendingCbs.length > 0 && frames < maxFrames) {
		stepFrame();
		frames++;
	}
	return frames;
}

function makeElement(): HTMLElement {
	return document.createElement("div");
}

function styleSetter(el: HTMLElement) {
	return (key: string, value: string) => {
		el.style[key] = value;
	};
}

beforeEach(() => {
	pendingCbs = [];
	rafTime = 0;
	vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
		pendingCbs.push(cb);
		return pendingCbs.length;
	});
	vi.stubGlobal("cancelAnimationFrame", () => {
		pendingCbs = [];
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

// ==================== SHAKE_TYPES.NORMAL ====================

describe("SHAKE_TYPES.NORMAL.update", () => {
	it("sets transform, webkitTransform, and filter on the style", () => {
		const el = makeElement();
		SHAKE_TYPES.NORMAL.update(styleSetter(el), 1);
		expect(el.style.transform).toMatch(/^rotate\(-?\d+(\.\d+)?deg\)$/);
		expect(el.style.webkitTransform).toBe(el.style.transform);
		expect(el.style.filter).toBe("blur(5px)");
	});

	it("scales blur with the time argument", () => {
		const el = makeElement();
		SHAKE_TYPES.NORMAL.update(styleSetter(el), 0.5);
		expect(el.style.filter).toBe("blur(2.5px)");
	});

	it("has step = 3", () => {
		expect(SHAKE_TYPES.NORMAL.step).toBe(3);
	});
});

// ==================== SHAKE_TYPES.FAST ====================

describe("SHAKE_TYPES.FAST.update", () => {
	it("sets only filter (no transform)", () => {
		const el = makeElement();
		SHAKE_TYPES.FAST.update(styleSetter(el), 1);
		expect(el.style.filter).toBe("blur(3px)");
		expect(el.style.transform).toBe("");
	});

	it("scales blur with the time argument", () => {
		const el = makeElement();
		SHAKE_TYPES.FAST.update(styleSetter(el), 0.25);
		expect(el.style.filter).toBe("blur(0.75px)");
	});

	it("has step = 15", () => {
		expect(SHAKE_TYPES.FAST.step).toBe(15);
	});
});

// ==================== constructor ====================

describe("Screenshake constructor", () => {
	it("does not start a loop on construction", () => {
		new Screenshake(makeElement());
		expect(pendingCbs.length).toBe(0);
	});

	it("does not mutate the element style on construction", () => {
		const el = makeElement();
		el.style.transform = "scale(2)";
		new Screenshake(el);
		expect(el.style.transform).toBe("scale(2)");
	});
});

// ==================== shake — return value ====================

describe("Screenshake.shake return value", () => {
	it("returns a dispose function when starting fresh", () => {
		const s = new Screenshake(makeElement());
		expect(typeof s.shake()).toBe("function");
	});

	it("returns null when already shaking", () => {
		const s = new Screenshake(makeElement());
		s.shake();
		expect(s.shake()).toBe(null);
	});

	it("returns a dispose function again after the previous shake completes", () => {
		const s = new Screenshake(makeElement());
		s.shake();
		runToCompletion();
		expect(typeof s.shake()).toBe("function");
	});
});

// ==================== shake — style effects ====================

describe("Screenshake.shake style effects", () => {
	it("applies NORMAL shake style on the first frame", () => {
		const el = makeElement();
		new Screenshake(el).shake();
		stepFrame();
		expect(el.style.transform).toMatch(/^rotate\(.*deg\)$/);
		expect(el.style.filter).toMatch(/^blur\(.*px\)$/);
	});

	it("applies FAST shake style when given that type", () => {
		const el = makeElement();
		new Screenshake(el).shake(SHAKE_TYPES.FAST);
		stepFrame();
		expect(el.style.filter).toMatch(/^blur\(.*px\)$/);
		expect(el.style.transform).toBe("");
	});

	it("defaults to NORMAL when no type is passed", () => {
		const el = makeElement();
		new Screenshake(el).shake();
		stepFrame();
		expect(el.style.transform).toMatch(/^rotate\(.*deg\)$/);
	});

	it("restores prior inline style values when the shake completes", () => {
		const el = makeElement();
		el.style.transform = "scale(2)";
		el.style.filter = "brightness(0.5)";
		new Screenshake(el).shake();
		runToCompletion();
		expect(el.style.transform).toBe("scale(2)");
		expect(el.style.filter).toBe("brightness(0.5)");
	});

	it("leaves the style empty when there was no prior inline value", () => {
		const el = makeElement();
		new Screenshake(el).shake();
		runToCompletion();
		expect(el.style.transform).toBe("");
		expect(el.style.filter).toBe("");
	});
});

// ==================== shake — lifecycle ====================

describe("Screenshake.shake lifecycle", () => {
	it("stops the rAF loop when the shake completes", () => {
		const s = new Screenshake(makeElement());
		s.shake();
		const frames = runToCompletion();
		expect(frames).toBeGreaterThan(0);
		expect(pendingCbs.length).toBe(0);
	});

	it("FAST completes in fewer frames than NORMAL (step is larger)", () => {
		const a = new Screenshake(makeElement());
		a.shake(SHAKE_TYPES.NORMAL);
		const normalFrames = runToCompletion();

		const b = new Screenshake(makeElement());
		b.shake(SHAKE_TYPES.FAST);
		const fastFrames = runToCompletion();

		expect(fastFrames).toBeLessThan(normalFrames);
	});

	it("stays blocked across mid-shake calls and unblocks only after completion", () => {
		const s = new Screenshake(makeElement());
		s.shake();
		stepFrame();
		expect(s.shake()).toBe(null);
		stepFrame();
		expect(s.shake()).toBe(null);
		runToCompletion();
		expect(typeof s.shake()).toBe("function");
	});
});

// ==================== shake — dispose ====================

describe("Screenshake.shake dispose", () => {
	it("cancels a running shake and restores prior style", () => {
		const el = makeElement();
		el.style.transform = "scale(2)";
		const dispose = new Screenshake(el).shake();
		stepFrame();
		expect(el.style.transform).toMatch(/^rotate\(.*deg\)$/);
		dispose!();
		expect(el.style.transform).toBe("scale(2)");
	});

	it("unblocks the instance for a new shake", () => {
		const s = new Screenshake(makeElement());
		const dispose = s.shake();
		stepFrame();
		dispose!();
		expect(typeof s.shake()).toBe("function");
	});

	it("second call does not re-apply the snapshot over caller writes", () => {
		const el = makeElement();
		el.style.transform = "scale(2)";
		const dispose = new Screenshake(el).shake();
		stepFrame();
		dispose!();
		el.style.transform = "rotate(45deg)";
		dispose!();
		expect(el.style.transform).toBe("rotate(45deg)");
	});

	it("caller call after natural completion is a no-op", () => {
		const el = makeElement();
		el.style.transform = "scale(2)";
		const dispose = new Screenshake(el).shake();
		runToCompletion();
		expect(el.style.transform).toBe("scale(2)");
		el.style.transform = "rotate(45deg)";
		dispose!();
		expect(el.style.transform).toBe("rotate(45deg)");
	});

	it("stale dispose from a prior shake does not corrupt a later shake", () => {
		const el = makeElement();
		const s = new Screenshake(el);
		const dispose1 = s.shake();
		runToCompletion();

		const dispose2 = s.shake();
		stepFrame();
		const midShakeTransform = el.style.transform;

		dispose1!();
		expect(el.style.transform).toBe(midShakeTransform);

		dispose2!();
		expect(el.style.transform).toBe("");
		expect(typeof s.shake()).toBe("function");
	});
});
