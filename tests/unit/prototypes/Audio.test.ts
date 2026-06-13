import { describe, expect, it } from "vitest";

import "@/prototypes/Audio";

// ==================== HTMLAudioElement.clone ====================

describe("HTMLAudioElement.clone", () => {
	it("returns an HTMLAudioElement distinct from the source", () => {
		const audio = document.createElement("audio");
		const copy = audio.clone();
		expect(copy).toBeInstanceOf(HTMLAudioElement);
		expect(copy).not.toBe(audio);
	});

	it("copies the source volume onto the clone", () => {
		const audio = document.createElement("audio");
		audio.volume = 0.42;
		const copy = audio.clone();
		expect(copy.volume).toBeCloseTo(0.42);
	});

	it("does a deep clone (carries src)", () => {
		const audio = document.createElement("audio");
		audio.src = "data:audio/wav;base64,UklGRg==";
		const copy = audio.clone();
		expect(copy.src).toBe(audio.src);
	});

	it("clones are independent — mutating the copy does not change the source", () => {
		const audio = document.createElement("audio");
		audio.volume = 0.5;
		const copy = audio.clone();
		copy.volume = 0.1;
		expect(audio.volume).toBeCloseTo(0.5);
	});
});

// ==================== HTMLAudioElement.stop ====================

describe("HTMLAudioElement.stop", () => {
	it("calls pause()", () => {
		const audio = document.createElement("audio");
		let pauseCalls = 0;
		audio.pause = () => {
			pauseCalls++;
		};
		audio.stop();
		expect(pauseCalls).toBe(1);
	});

	it("resets currentTime to 0", () => {
		const audio = document.createElement("audio");
		audio.pause = () => {};
		audio.currentTime = 12.5;
		audio.stop();
		expect(audio.currentTime).toBe(0);
	});

	it("preserves volume when defaultVolume is undefined", () => {
		const audio = document.createElement("audio");
		audio.pause = () => {};
		audio.volume = 0.3;
		audio.stop();
		expect(audio.volume).toBeCloseTo(0.3);
	});

	it("restores volume to defaultVolume when set", () => {
		const audio = document.createElement("audio");
		audio.pause = () => {};
		audio.defaultVolume = 0.6;
		audio.volume = 0.1;
		audio.stop();
		expect(audio.volume).toBeCloseTo(0.6);
	});

	it("uses defaultVolume of 0 (does not fall back to 1)", () => {
		const audio = document.createElement("audio");
		audio.pause = () => {};
		audio.defaultVolume = 0;
		audio.volume = 0.5;
		audio.stop();
		expect(audio.volume).toBe(0);
	});
});
