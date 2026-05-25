import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ==================== Imports ====================

import {
	debounce,
	delay,
	isTouchPrimary,
	rafLoop,
	throttle,
} from "@/utilities/Functions";

// ==================== debounce ====================

describe("debounce", () => {
	it("calls the callback after the delay", async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);
		debounced("hello");
		expect(fn).not.toHaveBeenCalled();
		await new Promise(res => setTimeout(res, 60));
		expect(fn).toHaveBeenCalledWith("hello");
	});

	it("resets the timer when called again before delay", async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);
		debounced("first");
		await new Promise(res => setTimeout(res, 30));
		debounced("second");
		expect(fn).not.toHaveBeenCalled();
		await new Promise(res => setTimeout(res, 40));
		expect(fn).not.toHaveBeenCalled();
		await new Promise(res => setTimeout(res, 30));
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("second");
	});

	it("does not call callback when cancelled by another call", async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);
		debounced("first");
		await new Promise(res => setTimeout(res, 25));
		debounced("second");
		await new Promise(res => setTimeout(res, 25));
		debounced("third");
		await new Promise(res => setTimeout(res, 60));
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("third");
	});

	it("passes multiple arguments correctly", async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);
		debounced("a", "b", "c");
		await new Promise(res => setTimeout(res, 60));
		expect(fn).toHaveBeenCalledWith("a", "b", "c");
	});

	it("works with no arguments", async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);
		debounced();
		await new Promise(res => setTimeout(res, 60));
		expect(fn).toHaveBeenCalled();
	});

	it("uses the latest arguments each time", async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);
		debounced(1);
		await new Promise(res => setTimeout(res, 60));
		debounced(2);
		await new Promise(res => setTimeout(res, 60));
		expect(fn).toHaveBeenNthCalledWith(1, 1);
		expect(fn).toHaveBeenNthCalledWith(2, 2);
	});
});

// ==================== delay ====================

describe("delay", () => {
	it("resolves after the given time", async () => {
		const start = Date.now();
		await delay(50);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(45);
	});

	it("resolves with undefined", async () => {
		const result = await delay(10);
		expect(result).toBeUndefined();
	});

	it("can be awaited multiple times", async () => {
		await delay(10);
		await delay(10);
		expect(true).toBe(true);
	});
});

// ==================== isTouchPrimary ====================

describe("isTouchPrimary", () => {
	it("returns a boolean", () => {
		const result = isTouchPrimary();
		expect(typeof result).toBe("boolean");
	});

	it("returns true when pointer is coarse", () => {
		const original = window.matchMedia;
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockReturnValue({ matches: true }),
		});
		expect(isTouchPrimary()).toBe(true);
		Object.defineProperty(window, "matchMedia", { value: original });
	});

	it("returns false when pointer is not coarse", () => {
		const original = window.matchMedia;
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockReturnValue({ matches: false }),
		});
		expect(isTouchPrimary()).toBe(false);
		Object.defineProperty(window, "matchMedia", { value: original });
	});
});

// ==================== rafLoop ====================

describe("rafLoop", () => {
	let pendingCbs: (() => void)[] = [];
	let callCount = 0;
	let allowCalls = 1;
	let rafTime = 0;

	beforeEach(() => {
		pendingCbs = [];
		callCount = 0;
		rafTime = 0;
		vi.stubGlobal("requestAnimationFrame", (cb: (time: number) => void) => {
			callCount++;
			rafTime += 16;
			if (callCount <= allowCalls) {
				cb(rafTime);
			}
			pendingCbs.push(cb as () => void);
			return callCount;
		});
		vi.stubGlobal("cancelAnimationFrame", () => {
			pendingCbs = [];
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("calls tick immediately with dt=0 on first frame", () => {
		const fn = vi.fn();
		const cancel = rafLoop(fn);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(0);
		cancel();
	});

	it("passes dt as seconds since previous frame", () => {
		allowCalls = 2;
		const fns: number[] = [];
		rafLoop(dt => {
			fns.push(dt);
		});
		expect(fns[0]).toBe(0);
		expect(fns[1]).toBeGreaterThan(0);
	});

	it("stops calling tick after cancel", () => {
		const fn = vi.fn();
		let count = 0;
		const cancel = rafLoop(() => {
			count++;
			if (count >= 3) {
				cancel();
			}
		});
		expect(fn).not.toHaveBeenCalled();
	});

	it("returns a cancel function", () => {
		const fn = vi.fn();
		const cancel = rafLoop(fn);
		expect(typeof cancel).toBe("function");
		cancel();
	});

	it("only calls tick once when cancelled immediately", () => {
		allowCalls = 1;
		const fn = vi.fn();
		const cancel = rafLoop(fn);
		cancel();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("calls tick once after cancel (else branch of if(running))", () => {
		allowCalls = 0;
		const fn = vi.fn();
		const cancel = rafLoop(fn);
		cancel();
		pendingCbs[0]();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("calls tick once after cancel (covers else branch of if(running))", () => {
		allowCalls = 0;
		const fn = vi.fn();
		const cancel = rafLoop(fn);
		cancel();
		pendingCbs[0]();
		expect(fn).toHaveBeenCalledTimes(1);
	});
});

// ==================== throttle ====================

describe("throttle", () => {
	let nowSpy: ReturnType<typeof vi.spyOn>;
	let baseTime = 100;

	beforeEach(() => {
		baseTime = 100;
		nowSpy = vi
			.spyOn(performance, "now")
			.mockImplementation(() => baseTime);
	});

	afterEach(() => {
		nowSpy.mockRestore();
	});

	it("calls callback immediately on first call", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 50);
		throttled();
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenNthCalledWith(1, 1);
	});

	it("does not call callback again until delay has passed", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 50);
		throttled();
		throttled();
		throttled();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("calls callback with accumulated call count after delay", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 50);
		throttled();
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenNthCalledWith(1, 1);

		baseTime = 110;
		throttled();
		throttled();

		baseTime = 160;
		throttled();
		expect(fn).toHaveBeenCalledTimes(2);
		expect(fn).toHaveBeenNthCalledWith(2, 3);
	});

	it("resets call count after each firing", () => {
		const counts: number[] = [];
		const throttled = throttle(count => {
			counts.push(count);
		}, 50);

		throttled();
		expect(counts).toEqual([1]);

		baseTime = 160;
		throttled();
		expect(counts).toEqual([1, 1]);

		baseTime = 160;
		throttled();
		throttled();
		throttled();

		baseTime = 220;
		throttled();
		expect(counts).toEqual([1, 1, 4]);
	});

	it("fires again after delay from previous fire", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 50);
		throttled();
		expect(fn).toHaveBeenCalledTimes(1);

		baseTime = 155;
		throttled();
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("works with no arguments", () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 50);
		throttled();
		expect(fn).toHaveBeenCalled();
	});
});
