import { beforeEach, describe, expect, it, vi } from "vitest";

import AudioBase from "@/audio/AudioBase";
import EventSystem from "@/core/EventSystem";

import "@/prototypes/Audio";

// ==================== Imports ====================

class TestAudio extends AudioBase {}

function songs(audio: AudioBase): Map<string, HTMLAudioElement> {
	return (audio as unknown as { songs: Map<string, HTMLAudioElement> }).songs;
}

beforeEach(() => {
	(EventSystem as unknown as { eventListener: object }).eventListener = {};
});

// ==================== constructor ====================

describe("AudioBase constructor", () => {
	it("defaults enabled to true", () => {
		const a = new TestAudio();
		expect(a.enabled).toBe(true);
	});

	it("accepts enabled = false", () => {
		const a = new TestAudio(false);
		expect(a.enabled).toBe(false);
	});

	it("starts with an empty songs map", () => {
		const a = new TestAudio();
		expect(songs(a).size).toBe(0);
	});

	it("subscribes stop() to the gameloopStopped event", () => {
		const a = new TestAudio();
		const spy = vi.spyOn(a, "stop");
		EventSystem.dispatchEvent("gameloopStopped");
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

// ==================== enabled setter ====================

describe("AudioBase.enabled setter", () => {
	it("setting enabled to false calls stop()", () => {
		const a = new TestAudio(true);
		const spy = vi.spyOn(a, "stop");
		a.enabled = false;
		expect(spy).toHaveBeenCalledTimes(1);
		expect(a.enabled).toBe(false);
	});

	it("setting enabled to true does NOT call stop()", () => {
		const a = new TestAudio(false);
		const spy = vi.spyOn(a, "stop");
		a.enabled = true;
		expect(spy).not.toHaveBeenCalled();
		expect(a.enabled).toBe(true);
	});

	it("setting enabled to its current value of false still calls stop()", () => {
		const a = new TestAudio(false);
		const spy = vi.spyOn(a, "stop");
		a.enabled = false;
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

// ==================== register ====================

describe("AudioBase.register", () => {
	let a: TestAudio;

	beforeEach(() => {
		a = new TestAudio();
	});

	it("derives name from filename when passed a string (strips dir and extension)", () => {
		a.register(1, "/sounds/jump.mp3");
		expect(songs(a).has("jump")).toBe(true);
	});

	it("derives name when no directory prefix is present", () => {
		a.register(1, "blip.wav");
		expect(songs(a).has("blip")).toBe(true);
	});

	it("derives name from an extensionless path (returns basename)", () => {
		a.register(1, "https://cdn.example.com/track/12345");
		expect(songs(a).has("12345")).toBe(true);
	});

	it("strips a query string before deriving the name", () => {
		a.register(1, "track.php?fmt=mp3&id=42");
		expect(songs(a).has("track")).toBe(true);
	});

	it("decodes percent-escapes in the derived name", () => {
		a.register(1, "/sounds/my%20sound.mp3");
		expect(songs(a).has("my sound")).toBe(true);
	});

	it("treats a dotfile basename as the whole name (no extension stripping)", () => {
		a.register(1, "/path/.hidden");
		expect(songs(a).has(".hidden")).toBe(true);
	});

	it("falls back to the raw path as the name when none can be derived", () => {
		a.register(1, "/path/");
		expect(songs(a).has("/path/")).toBe(true);
	});

	it("uses the explicit name when RegisterData is passed", () => {
		a.register(1, { name: "explosion", path: "/x/y.mp3" });
		expect(songs(a).has("explosion")).toBe(true);
	});

	it("sets src on the created audio element", () => {
		a.register(1, { name: "s", path: "/sound.mp3" });
		const audio = songs(a).get("s")!;
		expect(audio.src).toContain("sound.mp3");
	});

	it("sets the element id to the registered name", () => {
		a.register(1, { name: "ping", path: "/ping.wav" });
		expect(songs(a).get("ping")!.id).toBe("ping");
	});

	it("sets preload to 'auto'", () => {
		a.register(1, { name: "s", path: "/s.mp3" });
		expect(songs(a).get("s")!.preload).toBe("auto");
	});

	it("applies defaultVolume parameter when RegisterData has no volume", () => {
		a.register(0.5, { name: "s", path: "/s.mp3" });
		const audio = songs(a).get("s")!;
		expect(audio.volume).toBeCloseTo(0.5);
		expect(audio.defaultVolume).toBeCloseTo(0.5);
	});

	it("per-song volume overrides the defaultVolume parameter", () => {
		a.register(0.5, { name: "s", path: "/s.mp3", volume: 0.2 });
		const audio = songs(a).get("s")!;
		expect(audio.volume).toBeCloseTo(0.2);
		expect(audio.defaultVolume).toBeCloseTo(0.2);
	});

	it("string-form songs use the defaultVolume parameter", () => {
		a.register(0.3, "/sounds/jump.mp3");
		const audio = songs(a).get("jump")!;
		expect(audio.volume).toBeCloseTo(0.3);
		expect(audio.defaultVolume).toBeCloseTo(0.3);
	});

	it("defaultVolume parameter defaults to 1 when omitted", () => {
		a.register();
		// No songs registered; just verify the default does not throw.
		expect(songs(a).size).toBe(0);
	});

	it("registers multiple songs in one call (mixed string + RegisterData)", () => {
		a.register(1, "/a.mp3", { name: "b", path: "/x.wav" }, "/folder/c.ogg");
		const map = songs(a);
		expect(map.size).toBe(3);
		expect(map.get("a")?.getAttribute("src")).toBe("/a.mp3");
		expect(map.get("b")?.getAttribute("src")).toBe("/x.wav");
		expect(map.get("c")?.getAttribute("src")).toBe("/folder/c.ogg");
	});

	it("throws when called a second time on the same instance", () => {
		a.register(1, { name: "a", path: "/a.mp3" });
		expect(() => a.register(1, { name: "b", path: "/b.mp3" })).toThrow(
			/once/,
		);
	});

	it("throws when defaultVolume is not finite", () => {
		expect(() => a.register(NaN, { name: "s", path: "/s.mp3" })).toThrow(
			/defaultVolume.*range/,
		);
		expect(() =>
			a.register(Infinity, { name: "s", path: "/s.mp3" }),
		).toThrow(/defaultVolume.*range/);
	});

	it("throws when defaultVolume is negative", () => {
		expect(() => a.register(-0.1, { name: "s", path: "/s.mp3" })).toThrow(
			/defaultVolume.*above 0/,
		);
	});

	it("throws when defaultVolume exceeds 1", () => {
		expect(() => a.register(2, { name: "s", path: "/s.mp3" })).toThrow(
			/defaultVolume.*lower or equal/,
		);
	});

	it("throws when a per-song volume override is out of [0, 1]", () => {
		expect(() =>
			a.register(1, { name: "s", path: "/s.mp3", volume: 2 }),
		).toThrow(/Volume of "s"/);
	});

	it("logs an error when the audio element fails to load the source", () => {
		const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		a.register(1, { name: "broken", path: "/not-audio.html" });
		const audio = songs(a).get("broken")!;
		Object.defineProperty(audio, "error", {
			configurable: true,
			get: () => ({ code: 4, message: "" }),
		});
		audio.dispatchEvent(new Event("error"));
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][0]).toMatch(/broken/);
		expect(errSpy.mock.calls[0][0]).toMatch(/SRC_NOT_SUPPORTED/);
		errSpy.mockRestore();
	});

	it("logs 'unknown' when the audio element exposes no error object", () => {
		const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		a.register(1, { name: "nullerr", path: "/x.mp3" });
		const audio = songs(a).get("nullerr")!;
		Object.defineProperty(audio, "error", {
			configurable: true,
			get: () => null,
		});
		audio.dispatchEvent(new Event("error"));
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][0]).toMatch(/unknown/);
		errSpy.mockRestore();
	});

	it("falls back to the numeric code when the MediaError code is unrecognized", () => {
		const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		a.register(1, { name: "weird", path: "/x.mp3" });
		const audio = songs(a).get("weird")!;
		Object.defineProperty(audio, "error", {
			configurable: true,
			get: () => ({ code: 99, message: "" }),
		});
		audio.dispatchEvent(new Event("error"));
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][0]).toMatch(/: 99/);
		errSpy.mockRestore();
	});

	it("appends the MediaError message when one is provided", () => {
		const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		a.register(1, { name: "msg", path: "/x.mp3" });
		const audio = songs(a).get("msg")!;
		Object.defineProperty(audio, "error", {
			configurable: true,
			get: () => ({ code: 3, message: "bad header" }),
		});
		audio.dispatchEvent(new Event("error"));
		expect(errSpy).toHaveBeenCalledTimes(1);
		expect(errSpy.mock.calls[0][0]).toMatch(/DECODE: bad header/);
		errSpy.mockRestore();
	});
});

// ==================== stop (base) ====================

describe("AudioBase.stop (base)", () => {
	it("is a no-op and does not throw", () => {
		const a = new TestAudio();
		expect(() => a.stop()).not.toThrow();
	});
});
