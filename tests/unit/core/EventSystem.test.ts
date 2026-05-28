import { describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import { EVENT_NAMES, EventSystem } from "@/core/EventSystem";

// ==================== Helpers ====================

type Listeners = Record<string, { consumed?: boolean }[]>;

function internalListeners(es: EventSystem): Listeners {
	return (es as unknown as { eventListener: Listeners }).eventListener;
}

// ==================== dispatchEvent: empty ====================

describe("EventSystem.dispatchEvent (no listeners)", () => {
	it("is a no-op when nothing has been registered for the event", () => {
		const es = new EventSystem();
		expect(() => es.dispatchEvent(EVENT_NAMES.RESIZED)).not.toThrow();
	});

	it("does not lazily create a bucket for events with no listeners", () => {
		const es = new EventSystem();
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(internalListeners(es)[EVENT_NAMES.RESIZED]).toBeUndefined();
	});
});

// ==================== addEventListener: storage ====================

describe("EventSystem.addEventListener", () => {
	it("creates a fresh listener bucket on the first add", () => {
		const es = new EventSystem();
		es.addEventListener(EVENT_NAMES.RESIZED, () => {});
		expect(internalListeners(es)[EVENT_NAMES.RESIZED]).toHaveLength(1);
	});

	it("appends to the existing bucket on subsequent adds", () => {
		const es = new EventSystem();
		es.addEventListener(EVENT_NAMES.RESIZED, () => {});
		es.addEventListener(EVENT_NAMES.RESIZED, () => {});
		es.addEventListener(EVENT_NAMES.RESIZED, () => {});
		expect(internalListeners(es)[EVENT_NAMES.RESIZED]).toHaveLength(3);
	});

	it("keeps separate buckets per event name", () => {
		const es = new EventSystem();
		es.addEventListener(EVENT_NAMES.RESIZED, () => {});
		es.addEventListener(EVENT_NAMES.GAMELOOP_STOPPED, () => {});
		expect(internalListeners(es)[EVENT_NAMES.RESIZED]).toHaveLength(1);
		expect(
			internalListeners(es)[EVENT_NAMES.GAMELOOP_STOPPED],
		).toHaveLength(1);
	});
});

// ==================== dispatchEvent: callbacks + params ====================

describe("EventSystem.dispatchEvent invokes callbacks", () => {
	it("calls every registered listener exactly once per dispatch", () => {
		const es = new EventSystem();
		const a = vi.fn();
		const b = vi.fn();
		const c = vi.fn();
		es.addEventListener(EVENT_NAMES.RESIZED, a);
		es.addEventListener(EVENT_NAMES.RESIZED, b);
		es.addEventListener(EVENT_NAMES.RESIZED, c);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(a).toHaveBeenCalledTimes(1);
		expect(b).toHaveBeenCalledTimes(1);
		expect(c).toHaveBeenCalledTimes(1);
	});

	it("forwards dispatch params to each callback", () => {
		const es = new EventSystem();
		const cb = vi.fn();
		es.addEventListener(EVENT_NAMES.INPUT_KEYBOARD, cb);
		const keys = { KeyA: true };
		es.dispatchEvent(EVENT_NAMES.INPUT_KEYBOARD, keys, "KeyA");
		expect(cb).toHaveBeenCalledWith(keys, "KeyA");
	});

	it("invokes listeners in reverse registration order (LIFO)", () => {
		const es = new EventSystem();
		const order: string[] = [];
		es.addEventListener(EVENT_NAMES.RESIZED, () => order.push("first"));
		es.addEventListener(EVENT_NAMES.RESIZED, () => order.push("second"));
		es.addEventListener(EVENT_NAMES.RESIZED, () => order.push("third"));
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(order).toEqual(["third", "second", "first"]);
	});
});

// ==================== once ====================

describe("EventSystem once: true", () => {
	it("invokes the listener on the first dispatch", () => {
		const es = new EventSystem();
		const cb = vi.fn();
		es.addEventListener(EVENT_NAMES.RESIZED, cb, true);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("does not invoke the listener on subsequent dispatches", () => {
		const es = new EventSystem();
		const cb = vi.fn();
		es.addEventListener(EVENT_NAMES.RESIZED, cb, true);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("removes once-listeners from the internal bucket after dispatch", () => {
		const es = new EventSystem();
		es.addEventListener(EVENT_NAMES.RESIZED, () => {}, true);
		es.addEventListener(EVENT_NAMES.RESIZED, () => {});
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(internalListeners(es)[EVENT_NAMES.RESIZED]).toHaveLength(1);
	});

	it("keeps non-once listeners alongside once-listeners", () => {
		const es = new EventSystem();
		const persistent = vi.fn();
		const oneShot = vi.fn();
		es.addEventListener(EVENT_NAMES.RESIZED, persistent);
		es.addEventListener(EVENT_NAMES.RESIZED, oneShot, true);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(persistent).toHaveBeenCalledTimes(2);
		expect(oneShot).toHaveBeenCalledTimes(1);
	});

	it("defaults `once` to false when omitted", () => {
		const es = new EventSystem();
		const cb = vi.fn();
		es.addEventListener(EVENT_NAMES.RESIZED, cb);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(cb).toHaveBeenCalledTimes(2);
	});
});

// ==================== snapshot semantics ====================

describe("EventSystem dispatch snapshot", () => {
	it("does not invoke listeners that were registered during the dispatch", () => {
		const es = new EventSystem();
		const lateCb = vi.fn();
		es.addEventListener(EVENT_NAMES.RESIZED, () => {
			es.addEventListener(EVENT_NAMES.RESIZED, lateCb);
		});
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(lateCb).not.toHaveBeenCalled();
	});

	it("invokes listeners registered mid-dispatch on the next dispatch", () => {
		const es = new EventSystem();
		const lateCb = vi.fn();
		let added = false;
		es.addEventListener(EVENT_NAMES.RESIZED, () => {
			if (!added) {
				es.addEventListener(EVENT_NAMES.RESIZED, lateCb);
				added = true;
			}
		});
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(lateCb).toHaveBeenCalledTimes(1);
	});
});

// ==================== re-entrant dispatch ====================

describe("EventSystem re-entrant dispatch", () => {
	it("skips a once-listener that the outer loop already consumed via a nested dispatch", () => {
		const es = new EventSystem();
		const oneShot = vi.fn();
		let nested = false;
		es.addEventListener(EVENT_NAMES.RESIZED, oneShot, true);
		es.addEventListener(EVENT_NAMES.RESIZED, () => {
			if (nested) {
				return;
			}
			nested = true;
			// re-dispatch from within a listener — consumes oneShot before
			// the outer loop reaches it.
			es.dispatchEvent(EVENT_NAMES.RESIZED);
		});
		// outer dispatch: the trigger runs first (LIFO), nested dispatch consumes oneShot,
		// then outer loop reaches the same oneShot entry and must skip it (consumed=true).
		es.dispatchEvent(EVENT_NAMES.RESIZED);
		expect(oneShot).toHaveBeenCalledTimes(1);
	});
});
