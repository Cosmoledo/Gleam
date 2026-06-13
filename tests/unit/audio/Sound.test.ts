import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EventSystem from "@/core/EventSystem";
import Sound from "@/audio/Sound";

import "@/prototypes/Audio";

// ==================== Imports ====================

function currentSounds(s: Sound): HTMLAudioElement[] {
	return (s as unknown as { currentSounds: HTMLAudioElement[] })
		.currentSounds;
}

beforeEach(() => {
	(EventSystem as unknown as { eventListener: object }).eventListener = {};
});

// ==================== Sound.play ====================

describe("Sound.play", () => {
	let s: Sound;
	let playSpy: ReturnType<typeof vi.spyOn>;
	let errSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		s = new Sound();
		s.register(1, { name: "blip", path: "/blip.wav" });
		playSpy = vi
			.spyOn(HTMLAudioElement.prototype, "play")
			.mockImplementation(() => Promise.resolve());
		errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("does nothing when not enabled", () => {
		s.enabled = false;
		s.play("blip");
		expect(playSpy).not.toHaveBeenCalled();
		expect(currentSounds(s).length).toBe(0);
	});

	it("throws when no sounds are registered", () => {
		const empty = new Sound();
		expect(() => empty.play("anything")).toThrow(/No sounds/);
	});

	it("throws when name is not registered", () => {
		expect(() => s.play("missing")).toThrow(/missing/);
	});

	it("throws on bad params even when disabled", () => {
		s.enabled = false;
		expect(() => s.play("missing")).toThrow(/missing/);
	});

	it("clones the registered audio and plays the clone", () => {
		s.play("blip");
		expect(playSpy).toHaveBeenCalledTimes(1);
		expect(currentSounds(s).length).toBe(1);
	});

	it("the played sound is a clone, not the registered original", () => {
		s.play("blip");
		const registered = (
			s as unknown as { songs: Map<string, HTMLAudioElement> }
		).songs.get("blip")!;
		expect(currentSounds(s)[0]).not.toBe(registered);
	});

	it("each call produces an independent clone", () => {
		s.play("blip");
		s.play("blip");
		s.play("blip");
		expect(playSpy).toHaveBeenCalledTimes(3);
		expect(currentSounds(s).length).toBe(3);
		expect(currentSounds(s)[0]).not.toBe(currentSounds(s)[1]);
	});

	it("removes a clone from currentSounds when it ends naturally", () => {
		s.play("blip");
		s.play("blip");
		const [first, second] = currentSounds(s);
		first.onended!.call(first, new Event("ended"));
		expect(currentSounds(s)).toEqual([second]);
		second.onended!.call(second, new Event("ended"));
		expect(currentSounds(s)).toEqual([]);
	});

	it("removes a clone and logs when onerror fires", () => {
		s.play("blip");
		const sound = currentSounds(s)[0];
		sound.onerror!.call(sound, new Event("error"));
		expect(currentSounds(s)).toEqual([]);
		expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("blip"));
	});

	it("removes a clone and rejects when play() rejects", async () => {
		const err = new Error("autoplay blocked");
		playSpy.mockImplementationOnce(() => Promise.reject(err));
		await expect(s.play("blip")).rejects.toBe(err);
		expect(currentSounds(s)).toEqual([]);
	});
});

// ==================== Sound.stop ====================

describe("Sound.stop", () => {
	beforeEach(() => {
		vi.spyOn(HTMLAudioElement.prototype, "play").mockImplementation(() =>
			Promise.resolve(),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("stops every currently-playing sound", () => {
		const s = new Sound();
		s.register(1, { name: "blip", path: "/blip.wav" });
		const stopSpy = vi.spyOn(HTMLAudioElement.prototype, "stop");
		s.play("blip");
		s.play("blip");
		s.stop();
		expect(stopSpy).toHaveBeenCalledTimes(2);
	});

	it("clears the currentSounds list", () => {
		const s = new Sound();
		s.register(1, { name: "blip", path: "/blip.wav" });
		s.play("blip");
		s.play("blip");
		expect(currentSounds(s).length).toBe(2);
		s.stop();
		expect(currentSounds(s).length).toBe(0);
	});

	it("does not throw when nothing is playing", () => {
		const s = new Sound();
		expect(() => s.stop()).not.toThrow();
	});

	it("is invoked when enabled is set to false", () => {
		const s = new Sound();
		s.register(1, { name: "blip", path: "/blip.wav" });
		const stopSpy = vi.spyOn(s, "stop");
		s.enabled = false;
		expect(stopSpy).toHaveBeenCalledTimes(1);
	});
});
