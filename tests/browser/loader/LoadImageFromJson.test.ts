import { describe, it, expect, beforeAll } from "vitest";

import "@/prototypes/index";

import { loadImageFromJson } from "@/loader/UrlLoaders";

import { FIXTURE_BASE } from "../constants";
import spritesFixture from "../fixtures/sprites.json";

let origin: string;
let baseUrl: string;

beforeAll(() => {
	origin = window.location.origin;
	baseUrl = origin + FIXTURE_BASE;
});

// Serialise a (possibly modified) clone of the on-disk fixture so the tests
// stay in sync with the real JSON file instead of duplicating its shape.
const inlineJson = (mutate: (json: any) => void = () => {}): string => {
	const clone = structuredClone(spritesFixture) as any;
	mutate(clone);
	return JSON.stringify(clone);
};

// ==================== loadImageFromJson ====================

describe("loadImageFromJson — inline JSON", () => {
	it("returns a sprite map keyed by name", async () => {
		const sprites = await loadImageFromJson(baseUrl, inlineJson(), true);

		expect(Object.keys(sprites).sort()).toEqual(["full", "topleft"]);
	});

	it("each sprite is an HTMLCanvasElement sized by w/h", async () => {
		const sprites = await loadImageFromJson(baseUrl, inlineJson(), true);

		expect(sprites.topleft).toBeInstanceOf(HTMLCanvasElement);
		expect(sprites.topleft.width).toBe(1);
		expect(sprites.topleft.height).toBe(1);

		expect(sprites.full.width).toBe(2);
		expect(sprites.full.height).toBe(2);
	});

	it("copies every sprite field onto canvas.dataset", async () => {
		const sprites = await loadImageFromJson(baseUrl, inlineJson(), true);

		expect(sprites.topleft.dataset).toMatchObject({
			x: "1",
			y: "1",
			w: "1",
			h: "1",
			name: "topleft",
		});
	});

	it("draws the source pixels into each sprite", async () => {
		const sprites = await loadImageFromJson(baseUrl, inlineJson(), true);
		const ctx = sprites.topleft.getContext("2d")!;
		const { data } = ctx.getImageData(0, 0, 1, 1);

		// red-2x2.png is solid red — any subImage pixel should be opaque red
		expect(data[0]).toBe(255);
		expect(data[1]).toBe(0);
		expect(data[2]).toBe(0);
		expect(data[3]).toBe(255);
	});

	it("appends a trailing slash to baseUrl when missing", async () => {
		// pass baseUrl WITHOUT the trailing slash — function must add it
		const noTrailing = origin + FIXTURE_BASE.replace(/\/$/, "");
		const sprites = await loadImageFromJson(noTrailing, inlineJson(), true);

		expect(sprites.topleft).toBeInstanceOf(HTMLCanvasElement);
	});

	it("throws on malformed JSON", async () => {
		await expect(
			loadImageFromJson(baseUrl, "{ not valid json", true),
		).rejects.toThrow("Failed to parse inline JSON");
	});

	it("throws when options.file is missing", async () => {
		const bad = inlineJson(j => delete j.options);

		await expect(loadImageFromJson(baseUrl, bad, true)).rejects.toThrow(
			"JSON missing 'options.file' property",
		);
	});

	it("throws when sprites array is missing", async () => {
		const bad = inlineJson(j => delete j.sprites);

		await expect(loadImageFromJson(baseUrl, bad, true)).rejects.toThrow(
			"JSON missing 'sprites' array",
		);
	});

	it("throws when sprites is not an array", async () => {
		const bad = inlineJson(j => {
			j.sprites = "nope";
		});

		await expect(loadImageFromJson(baseUrl, bad, true)).rejects.toThrow(
			"JSON missing 'sprites' array",
		);
	});

	it("throws on a sprite missing required fields", async () => {
		const bad = inlineJson(j => {
			delete j.sprites[0].h;
		});

		await expect(loadImageFromJson(baseUrl, bad, true)).rejects.toThrow(
			"Invalid sprite data at index 0",
		);
	});

	it("rejects when the image file is unreachable", async () => {
		const bad = inlineJson(j => {
			j.options.file = "__nonexistent__.png";
		});

		await expect(loadImageFromJson(baseUrl, bad, true)).rejects.toThrow(
			"Image failed to load",
		);
	});
});

describe("loadImageFromJson — file JSON", () => {
	it("loads JSON from baseUrl + name + '.json'", async () => {
		const sprites = await loadImageFromJson(baseUrl, "sprites");

		expect(Object.keys(sprites).sort()).toEqual(["full", "topleft"]);
		expect(sprites.topleft).toBeInstanceOf(HTMLCanvasElement);
		expect(sprites.topleft.width).toBe(1);
	});

	it("rejects when the JSON file is missing", async () => {
		await expect(
			loadImageFromJson(baseUrl, "__nonexistent__"),
		).rejects.toThrow("HTTP 404");
	});

	it("error message names the JSON file when options.file is missing", async () => {
		// Hits the `${baseUrl}${nameOrJson}.json` source-name branch — the
		// inline-JSON path uses the literal "inline JSON" source instead.
		await expect(
			loadImageFromJson(baseUrl, "sprites-no-options"),
		).rejects.toThrow(`Source: ${baseUrl}sprites-no-options.json`);
	});
});
