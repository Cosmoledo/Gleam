import { describe, it, expect } from "vitest";

import { loadImage } from "@/loader/UrlLoaders";

import { PNG_1x1_DATA_URL, PNG_2x2_RED_DATA_URL } from "../constants";

// ==================== loadImage ====================

describe("loadImage", () => {
	it("rejects when the image fails to load", async () => {
		const url = `${window.location.origin}/__nonexistent__.png`;

		await expect(loadImage(url)).rejects.toThrow(
			`Image failed to load: ${url}`,
		);
	});

	it("rejects invalid URLs before any network call", async () => {
		await expect(loadImage("not-a-url")).rejects.toThrow(
			"Invalid URL format",
		);
	});

	it("rejects file: URLs", async () => {
		await expect(loadImage("file:///etc/passwd")).rejects.toThrow(
			"Invalid URL format",
		);
	});

	it("returns an HTMLImageElement", async () => {
		const image = await loadImage(PNG_1x1_DATA_URL);

		expect(image).toBeInstanceOf(HTMLImageElement);
	});

	it("sets src and id on the Image element", async () => {
		const image = await loadImage(PNG_1x1_DATA_URL);

		expect(image.src).toBe(PNG_1x1_DATA_URL);
		expect(image.id).toBe(PNG_1x1_DATA_URL);
	});

	it("resolves only after the image has finished decoding", async () => {
		const image = await loadImage(PNG_2x2_RED_DATA_URL);

		expect(image.complete).toBe(true);
		expect(image.naturalWidth).toBeGreaterThan(0);
	});

	it("exposes the intrinsic image dimensions", async () => {
		const image = await loadImage(PNG_2x2_RED_DATA_URL);

		expect(image.naturalWidth).toBe(2);
		expect(image.naturalHeight).toBe(2);
		expect(image.width).toBe(2);
		expect(image.height).toBe(2);
	});
});
