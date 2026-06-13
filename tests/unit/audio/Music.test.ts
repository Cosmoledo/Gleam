import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EventSystem from "@/core/EventSystem";
import Music from "@/audio/Music";

import "@/prototypes/Audio";

// ==================== Imports ====================

interface MusicInternals {
	songs: Map<string, HTMLAudioElement>;
	last: HTMLAudioElement | null;
	current: HTMLAudioElement | null;
	next: HTMLAudioElement | null;
	fadeCancel: (() => void) | null;
}

function internals(m: Music): MusicInternals {
	return m as unknown as MusicInternals;
}

// ==================== Harness ====================

let pendingRaf: Array<(now: number) => void> = [];

function flushRafOnce(now: number): void {
	const cb = pendingRaf.shift();
	cb?.(now);
}

function flushUntilDone(m: Music, maxFrames: number = 10): void {
	flushRafOnce(1);
	for (let i = 0; i < maxFrames && internals(m).fadeCancel !== null; i++) {
		flushRafOnce(1 + (i + 1) * 5000);
	}
}

beforeEach(() => {
	pendingRaf = [];
	vi.stubGlobal("requestAnimationFrame", (cb: (now: number) => void) => {
		pendingRaf.push(cb);
		return pendingRaf.length;
	});
	vi.stubGlobal("cancelAnimationFrame", () => void 0);
	vi.spyOn(HTMLAudioElement.prototype, "play").mockImplementation(() =>
		Promise.resolve(),
	);
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
	(EventSystem as unknown as { eventListener: object }).eventListener = {};
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

// ==================== Music.isPlaying ====================

describe("Music.isPlaying", () => {
	it("returns false on a fresh instance", () => {
		const m = new Music();
		expect(m.isPlaying).toBe(false);
	});

	it("returns true when a fade is in progress", () => {
		const m = new Music();
		internals(m).fadeCancel = () => {};
		expect(m.isPlaying).toBe(true);
	});

	it("returns false when current exists but is paused", () => {
		const m = new Music();
		const a = new window.Audio();
		internals(m).current = a;
		// HTMLAudioElement defaults to paused = true
		expect(m.isPlaying).toBe(false);
	});

	it("returns true when current is a non-paused window.Audio instance", () => {
		const m = new Music();
		const a = new window.Audio();
		Object.defineProperty(a, "paused", {
			configurable: true,
			get: () => false,
		});
		internals(m).current = a;
		expect(m.isPlaying).toBe(true);
	});
});

// ==================== Music.enabled setter ====================

describe("Music.enabled setter", () => {
	it("stops music when set to false", () => {
		const m = new Music();
		m.register(1, { name: "s", path: "/s.mp3" });
		const spy = vi.spyOn(m, "stop");
		m.enabled = false;
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("calls fade() when set to true and not already playing", () => {
		const m = new Music(false);
		m.register(1, { name: "s", path: "/s.mp3" });
		const spy = vi.spyOn(m, "fade");
		m.enabled = true;
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("does NOT call fade() when set to true while already playing", () => {
		const m = new Music(true);
		m.register(1, { name: "s", path: "/s.mp3" });
		internals(m).fadeCancel = () => {};
		const spy = vi.spyOn(m, "fade");
		m.enabled = true;
		expect(spy).not.toHaveBeenCalled();
	});

	it("getter mirrors the underlying enabled state", () => {
		const m = new Music(false);
		expect(m.enabled).toBe(false);
		m.register(1, { name: "s", path: "/s.mp3" });
		m.enabled = true;
		expect(m.enabled).toBe(true);
	});
});

// ==================== Music.fade ====================

describe("Music.fade", () => {
	it("returns early without scheduling anything when disabled", () => {
		const m = new Music(false);
		m.register(1, { name: "s", path: "/s.mp3" });
		m.fade();
		expect(internals(m).fadeCancel).toBe(null);
		expect(pendingRaf.length).toBe(0);
	});

	it("throws on bad params even when disabled", () => {
		const m = new Music(false);
		m.register(1, { name: "a", path: "/a.mp3" });
		expect(() => m.fade(null, 0)).toThrow(/fadeTime/);
		expect(() => m.fade("unknown")).toThrow(/unknown/);
	});

	it("throws when fadeTime is 0", () => {
		const m = new Music();
		m.register(1, { name: "s", path: "/s.mp3" });
		expect(() => m.fade(null, 0)).toThrow(/fadeTime/);
	});

	it("throws when fadeTime is negative", () => {
		const m = new Music();
		m.register(1, { name: "s", path: "/s.mp3" });
		expect(() => m.fade(null, -100)).toThrow(/fadeTime/);
	});

	it("throws when no songs are registered", () => {
		const m = new Music();
		expect(() => m.fade()).toThrow(/No music/);
	});

	it("uses the named song when registered", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("b");
		expect(internals(m).next?.id).toBe("b");
	});

	it("throws when name is not registered", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		expect(() => m.fade("unknown")).toThrow(/unknown/);
	});

	it("picks a random song when name is null", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade();
		expect(["a", "b"]).toContain(internals(m).next?.id);
	});

	it("sets next.volume to 0 and plays it", () => {
		const m = new Music();
		m.register(
			0.7,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("a");
		expect(internals(m).next?.volume).toBe(0);
		expect(HTMLAudioElement.prototype.play).toHaveBeenCalled();
	});

	it("when a fade is already in progress, cancels it and promotes next to current", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("a");
		const firstNext = internals(m).next;
		m.fade("b");
		expect(internals(m).current).toBe(firstNext);
		expect(internals(m).next?.id).toBe("b");
		expect(console.warn).toHaveBeenCalled();
	});

	it("when getRandom finds no new song, falls back to current", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		const a = internals(m).songs.get("a")!;
		const b = internals(m).songs.get("b")!;
		// Both songs are excluded by getRandom (last + current) → null → fallback.
		internals(m).last = a;
		internals(m).current = b;
		m.fade();
		expect(internals(m).next).toBe(a);
	});

	it("drives fade to completion via rafLoop (promotes next to current)", () => {
		const m = new Music();
		m.register(
			0.5,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("a");
		const target = internals(m).next!;
		flushUntilDone(m);
		expect(internals(m).fadeCancel).toBe(null);
		expect(internals(m).current).toBe(target);
		expect(internals(m).next).toBe(null);
		expect(target.volume).toBeCloseTo(0.5);
	});

	it("after fade completes, last is set to the previous current", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("a");
		flushUntilDone(m);
		const aSong = internals(m).current;
		m.fade("b");
		flushUntilDone(m);
		expect(internals(m).last).toBe(aSong);
		expect(internals(m).current?.id).toBe("b");
	});

	it("when last is set, getRandom() excludes it (and current) from the pool", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
			{ name: "c", path: "/c.mp3" },
		);
		m.fade("a");
		flushUntilDone(m);
		m.fade("b");
		flushUntilDone(m);
		// last=a, current=b → the only candidate left is c
		m.fade();
		expect(internals(m).next?.id).toBe("c");
	});

	it("with a single registered song, post-completion sets native loop and clears onended", () => {
		const m = new Music();
		m.register(1, { name: "only", path: "/only.mp3" });
		m.fade("only");
		flushUntilDone(m);
		const cur = internals(m).current!;
		expect(cur.loop).toBe(true);
		expect(cur.onended).toBe(null);
	});

	it("post-completion next.onended handler restarts the fade", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("a");
		flushUntilDone(m);
		// current = a, with onended installed to call fade() again on natural end.
		const restart = internals(m).current!.onended!;
		restart.call(internals(m).current!, new Event("ended"));
		expect(internals(m).fadeCancel).not.toBe(null);
		expect(internals(m).next?.id).toBe("b");
	});

	it("when a new fade begins, the previous current.onended is replaced with a noop", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("a");
		flushUntilDone(m);
		m.fade("b");
		// Second fade installed a noop onended on the previous current (a).
		// Invoke it to cover the arrow body and confirm it has no side effects.
		const noop = internals(m).current!.onended!;
		const beforeNext = internals(m).next;
		const beforeFadeCancel = internals(m).fadeCancel;
		noop.call(internals(m).current!, new Event("ended"));
		expect(internals(m).next).toBe(beforeNext);
		expect(internals(m).fadeCancel).toBe(beforeFadeCancel);
	});
});

// ==================== Music.stop ====================

describe("Music.stop", () => {
	it("clears the in-progress fade and resets next", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("a");
		expect(internals(m).fadeCancel).not.toBe(null);
		m.stop();
		expect(internals(m).fadeCancel).toBe(null);
		expect(internals(m).next).toBe(null);
	});

	it("stops current and next audio elements", () => {
		const m = new Music();
		m.register(
			1,
			{ name: "a", path: "/a.mp3" },
			{ name: "b", path: "/b.mp3" },
		);
		m.fade("a");
		flushUntilDone(m);
		m.fade("b"); // current=a, next=b, fadeCancel set
		const stopSpy = vi.spyOn(HTMLAudioElement.prototype, "stop");
		m.stop();
		// current (a) and next (b) both get .stop() called
		expect(stopSpy).toHaveBeenCalledTimes(2);
	});

	it("does not throw when nothing is playing", () => {
		const m = new Music();
		expect(() => m.stop()).not.toThrow();
	});

	it("after stop, current is set from next (which was null)", () => {
		const m = new Music();
		m.register(1, { name: "s", path: "/s.mp3" });
		m.fade("s");
		flushUntilDone(m);
		expect(internals(m).current?.id).toBe("s");
		m.stop();
		// stop sets last = current, current = next (null), next = null
		expect(internals(m).current).toBe(null);
		expect(internals(m).next).toBe(null);
	});
});
