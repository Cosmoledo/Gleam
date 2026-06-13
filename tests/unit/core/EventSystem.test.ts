import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import EventSystem from "@/core/EventSystem";

// ==================== Helpers ====================

type Listeners = Record<string, Map<number, unknown> | undefined>;

function internalListeners(): Listeners {
	return (EventSystem as unknown as { eventListener: Listeners })
		.eventListener;
}

function bucketSize(name: string): number | undefined {
	return internalListeners()[name]?.size;
}

beforeEach(() => {
	(EventSystem as unknown as { eventListener: Listeners }).eventListener = {};
});

// ==================== dispatchEvent: empty ====================

describe("EventSystem.dispatchEvent (no listeners)", () => {
	it("is a no-op when nothing has been registered for the event", () => {
		expect(() => EventSystem.dispatchEvent("resized")).not.toThrow();
	});

	it("does not lazily create a bucket for events with no listeners", () => {
		EventSystem.dispatchEvent("resized");
		expect(internalListeners()["resized"]).toBeUndefined();
	});
});

// ==================== addEventListener: storage ====================

describe("EventSystem.addEventListener", () => {
	it("creates a fresh listener bucket on the first add", () => {
		EventSystem.addEventListener("resized", () => {});
		expect(bucketSize("resized")).toBe(1);
	});

	it("appends to the existing bucket on subsequent adds", () => {
		EventSystem.addEventListener("resized", () => {});
		EventSystem.addEventListener("resized", () => {});
		EventSystem.addEventListener("resized", () => {});
		expect(bucketSize("resized")).toBe(3);
	});

	it("keeps separate buckets per event name", () => {
		EventSystem.addEventListener("resized", () => {});
		EventSystem.addEventListener("gameloopStopped", () => {});
		expect(bucketSize("resized")).toBe(1);
		expect(bucketSize("gameloopStopped")).toBe(1);
	});
});

// ==================== dispatchEvent: callbacks + params ====================

describe("EventSystem.dispatchEvent invokes callbacks", () => {
	it("calls every registered listener exactly once per dispatch", () => {
		const a = vi.fn();
		const b = vi.fn();
		const c = vi.fn();
		EventSystem.addEventListener("resized", a);
		EventSystem.addEventListener("resized", b);
		EventSystem.addEventListener("resized", c);
		EventSystem.dispatchEvent("resized");
		expect(a).toHaveBeenCalledTimes(1);
		expect(b).toHaveBeenCalledTimes(1);
		expect(c).toHaveBeenCalledTimes(1);
	});

	it("forwards dispatch params to each callback", () => {
		const cb = vi.fn();
		EventSystem.addEventListener("inputKeyboard", cb);
		const keys = { KeyA: true };
		EventSystem.dispatchEvent("inputKeyboard", keys, "KeyA", true);
		expect(cb).toHaveBeenCalledWith(keys, "KeyA", true);
	});

	it("invokes listeners in registration order (FIFO)", () => {
		const order: string[] = [];
		EventSystem.addEventListener("resized", () => order.push("first"));
		EventSystem.addEventListener("resized", () => order.push("second"));
		EventSystem.addEventListener("resized", () => order.push("third"));
		EventSystem.dispatchEvent("resized");
		expect(order).toEqual(["first", "second", "third"]);
	});
});

// ==================== once ====================

describe("EventSystem once: true", () => {
	it("invokes the listener on the first dispatch", () => {
		const cb = vi.fn();
		EventSystem.addEventListener("resized", cb, { once: true });
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("does not invoke the listener on subsequent dispatches", () => {
		const cb = vi.fn();
		EventSystem.addEventListener("resized", cb, { once: true });
		EventSystem.dispatchEvent("resized");
		EventSystem.dispatchEvent("resized");
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("removes once-listeners from the internal bucket after dispatch", () => {
		EventSystem.addEventListener("resized", () => {}, { once: true });
		EventSystem.addEventListener("resized", () => {});
		EventSystem.dispatchEvent("resized");
		expect(bucketSize("resized")).toBe(1);
	});

	it("keeps non-once listeners alongside once-listeners", () => {
		const persistent = vi.fn();
		const oneShot = vi.fn();
		EventSystem.addEventListener("resized", persistent);
		EventSystem.addEventListener("resized", oneShot, { once: true });
		EventSystem.dispatchEvent("resized");
		EventSystem.dispatchEvent("resized");
		expect(persistent).toHaveBeenCalledTimes(2);
		expect(oneShot).toHaveBeenCalledTimes(1);
	});

	it("defaults `once` to false when omitted", () => {
		const cb = vi.fn();
		EventSystem.addEventListener("resized", cb);
		EventSystem.dispatchEvent("resized");
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(2);
	});
});

// ==================== snapshot semantics ====================

describe("EventSystem dispatch snapshot", () => {
	it("does not invoke listeners that were registered during the dispatch", () => {
		const lateCb = vi.fn();
		EventSystem.addEventListener("resized", () => {
			EventSystem.addEventListener("resized", lateCb);
		});
		EventSystem.dispatchEvent("resized");
		expect(lateCb).not.toHaveBeenCalled();
	});

	it("invokes listeners registered mid-dispatch on the next dispatch", () => {
		const lateCb = vi.fn();
		let added = false;
		EventSystem.addEventListener("resized", () => {
			if (!added) {
				EventSystem.addEventListener("resized", lateCb);
				added = true;
			}
		});
		EventSystem.dispatchEvent("resized");
		EventSystem.dispatchEvent("resized");
		expect(lateCb).toHaveBeenCalledTimes(1);
	});
});

// ==================== re-entrant dispatch ====================

describe("EventSystem re-entrant dispatch", () => {
	it("skips a once-listener that the outer loop already consumed via a nested dispatch", () => {
		const oneShot = vi.fn();
		let nested = false;
		EventSystem.addEventListener("resized", () => {
			if (nested) {
				return;
			}
			nested = true;
			// re-dispatch from within a listener — consumes oneShot before
			// the outer loop reaches it.
			EventSystem.dispatchEvent("resized");
		});
		EventSystem.addEventListener("resized", oneShot, { once: true });
		// outer dispatch: the trigger runs first (FIFO), nested dispatch consumes oneShot,
		// then outer loop reaches the same oneShot entry and must skip it (consumed=true).
		EventSystem.dispatchEvent("resized");
		expect(oneShot).toHaveBeenCalledTimes(1);
	});
});

// ==================== listener error isolation ====================

describe("EventSystem listener errors", () => {
	let errSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		errSpy.mockRestore();
	});

	it("continues dispatching to remaining listeners when one throws", () => {
		const after = vi.fn();
		EventSystem.addEventListener("resized", () => {
			throw new Error("boom-1");
		});
		EventSystem.addEventListener("resized", after);
		EventSystem.dispatchEvent("resized");
		expect(after).toHaveBeenCalledTimes(1);
	});

	it("logs the thrown error to console.error", () => {
		EventSystem.addEventListener("resized", () => {
			throw new Error("boom-2");
		});
		EventSystem.dispatchEvent("resized");
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][0]).toMatch(/"resized" threw/);
	});

	it("removes a once-listener even when it throws", () => {
		const cb = vi.fn(() => {
			throw new Error("boom-3");
		});
		EventSystem.addEventListener("resized", cb, { once: true });
		EventSystem.dispatchEvent("resized");
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("logs a non-Error throwable by stringifying it", () => {
		EventSystem.addEventListener("resized", () => {
			throw "plain-string-throw";
		});
		EventSystem.dispatchEvent("resized");
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][1]).toBe("plain-string-throw");
	});

	it("includes a suppressed-count suffix when re-firing after throttle window", () => {
		const nowSpy = vi.spyOn(performance, "now").mockReturnValue(1_000_000);
		try {
			EventSystem.addEventListener("resized", () => {
				throw new Error("repeated");
			});
			EventSystem.dispatchEvent("resized");
			EventSystem.dispatchEvent("resized");
			EventSystem.dispatchEvent("resized");
			nowSpy.mockReturnValue(1_002_000);
			EventSystem.dispatchEvent("resized");
			expect(errSpy).toHaveBeenCalledTimes(2);
			expect(errSpy.mock.calls[1][0]).toMatch(/x3 since last log/);
		} finally {
			nowSpy.mockRestore();
		}
	});
});

// ==================== addEventListener disposer ====================

describe("EventSystem.addEventListener disposer", () => {
	it("detaches the listener from subsequent dispatches", () => {
		const cb = vi.fn();
		const off = EventSystem.addEventListener("resized", cb);
		EventSystem.dispatchEvent("resized");
		off();
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("removes the listener from the internal bucket", () => {
		const off = EventSystem.addEventListener("resized", () => {});
		expect(bucketSize("resized")).toBe(1);
		off();
		expect(bucketSize("resized")).toBeUndefined();
	});

	it("is idempotent: second call is a no-op", () => {
		const off = EventSystem.addEventListener("resized", () => {});
		off();
		expect(() => off()).not.toThrow();
		expect(bucketSize("resized")).toBeUndefined();
	});

	it("is a no-op after a once-listener has already fired", () => {
		const off = EventSystem.addEventListener("resized", () => {}, {
			once: true,
		});
		EventSystem.dispatchEvent("resized");
		expect(() => off()).not.toThrow();
	});

	it("removes only the matching registration when the same callback is registered twice", () => {
		const cb = vi.fn();
		const off1 = EventSystem.addEventListener("resized", cb);
		EventSystem.addEventListener("resized", cb);
		off1();
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("detaches a listener that disposes itself from inside its callback", () => {
		const cb = vi.fn();
		const after = vi.fn();
		let off: () => void;
		off = EventSystem.addEventListener("resized", () => {
			cb();
			off();
		});
		EventSystem.addEventListener("resized", after);
		EventSystem.dispatchEvent("resized");
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(1);
		expect(after).toHaveBeenCalledTimes(2);
	});

	it("skips a sibling listener disposed mid-dispatch in the same tick", () => {
		const later = vi.fn();
		let offLater: () => void;
		EventSystem.addEventListener("resized", () => {
			offLater();
		});
		offLater = EventSystem.addEventListener("resized", later);
		EventSystem.dispatchEvent("resized");
		expect(later).not.toHaveBeenCalled();
	});
});

// ==================== addEventListener signal ====================

describe("EventSystem.addEventListener signal", () => {
	it("does not register the listener when signal is already aborted", () => {
		const controller = new AbortController();
		controller.abort();
		const cb = vi.fn();
		EventSystem.addEventListener("resized", cb, {
			signal: controller.signal,
		});
		EventSystem.dispatchEvent("resized");
		expect(cb).not.toHaveBeenCalled();
		expect(internalListeners()["resized"]).toBeUndefined();
	});

	it("returns a no-op disposer when signal is already aborted", () => {
		const controller = new AbortController();
		controller.abort();
		const off = EventSystem.addEventListener("resized", () => {}, {
			signal: controller.signal,
		});
		expect(() => off()).not.toThrow();
	});

	it("detaches the listener when the signal aborts after registration", () => {
		const controller = new AbortController();
		const cb = vi.fn();
		EventSystem.addEventListener("resized", cb, {
			signal: controller.signal,
		});
		EventSystem.dispatchEvent("resized");
		controller.abort();
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(1);
		expect(bucketSize("resized")).toBeUndefined();
	});

	it("skips later signal-bound listeners when the signal aborts mid-dispatch", () => {
		const controller = new AbortController();
		const later = vi.fn();
		EventSystem.addEventListener("resized", () => {
			controller.abort();
		});
		EventSystem.addEventListener("resized", later, {
			signal: controller.signal,
		});
		EventSystem.dispatchEvent("resized");
		expect(later).not.toHaveBeenCalled();
	});

	it("interacts cleanly with once: firing once then aborting is a safe no-op", () => {
		const controller = new AbortController();
		const cb = vi.fn();
		EventSystem.addEventListener("resized", cb, {
			once: true,
			signal: controller.signal,
		});
		EventSystem.dispatchEvent("resized");
		expect(() => controller.abort()).not.toThrow();
		EventSystem.dispatchEvent("resized");
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("aborts multiple listeners across different events with one controller", () => {
		const controller = new AbortController();
		const onResize = vi.fn();
		const onKey = vi.fn();
		EventSystem.addEventListener("resized", onResize, {
			signal: controller.signal,
		});
		EventSystem.addEventListener("inputKeyboard", onKey, {
			signal: controller.signal,
		});
		controller.abort();
		EventSystem.dispatchEvent("resized");
		EventSystem.dispatchEvent("inputKeyboard", {}, "KeyA", true);
		expect(onResize).not.toHaveBeenCalled();
		expect(onKey).not.toHaveBeenCalled();
	});

	it("does not throw when the same controller is aborted twice", () => {
		const controller = new AbortController();
		EventSystem.addEventListener("resized", () => {}, {
			signal: controller.signal,
		});
		controller.abort();
		expect(() => controller.abort()).not.toThrow();
		expect(bucketSize("resized")).toBeUndefined();
	});
});
