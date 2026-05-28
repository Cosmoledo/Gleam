import { beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import { EventSystem } from "@/core/EventSystem";

// ==================== Helpers ====================

type Listeners = Record<string, { consumed?: boolean }[]>;

function internalListeners(): Listeners {
	return (EventSystem as unknown as { eventListener: Listeners })
		.eventListener;
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
		expect(internalListeners()["resized"]).toHaveLength(1);
	});

	it("appends to the existing bucket on subsequent adds", () => {
		EventSystem.addEventListener("resized", () => {});
		EventSystem.addEventListener("resized", () => {});
		EventSystem.addEventListener("resized", () => {});
		expect(internalListeners()["resized"]).toHaveLength(3);
	});

	it("keeps separate buckets per event name", () => {
		EventSystem.addEventListener("resized", () => {});
		EventSystem.addEventListener("gameloopStopped", () => {});
		expect(internalListeners()["resized"]).toHaveLength(1);
		expect(internalListeners()["gameloopStopped"]).toHaveLength(1);
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
		EventSystem.dispatchEvent("inputKeyboard", keys, "KeyA");
		expect(cb).toHaveBeenCalledWith(keys, "KeyA");
	});

	it("invokes listeners in reverse registration order (LIFO)", () => {
		const order: string[] = [];
		EventSystem.addEventListener("resized", () => order.push("first"));
		EventSystem.addEventListener("resized", () => order.push("second"));
		EventSystem.addEventListener("resized", () => order.push("third"));
		EventSystem.dispatchEvent("resized");
		expect(order).toEqual(["third", "second", "first"]);
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
		expect(internalListeners()["resized"]).toHaveLength(1);
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
		EventSystem.addEventListener("resized", oneShot, { once: true });
		EventSystem.addEventListener("resized", () => {
			if (nested) {
				return;
			}
			nested = true;
			// re-dispatch from within a listener — consumes oneShot before
			// the outer loop reaches it.
			EventSystem.dispatchEvent("resized");
		});
		// outer dispatch: the trigger runs first (LIFO), nested dispatch consumes oneShot,
		// then outer loop reaches the same oneShot entry and must skip it (consumed=true).
		EventSystem.dispatchEvent("resized");
		expect(oneShot).toHaveBeenCalledTimes(1);
	});
});
