import { describe, it, expect } from "vitest";

import { loadCanvas } from "@/loader/UrlLoaders";

import { PNG_1x1_DATA_URL, PNG_2x2_RED_DATA_URL } from "../constants";

// ==================== loadCanvas ====================

describe("loadCanvas", () => {
	it("rejects when the image fails to load", async () => {
		const url = `${window.location.origin}/__nonexistent__.png`;

		await expect(loadCanvas(url)).rejects.toThrow(
			`Image failed to load: ${url}`,
		);
	});

	it("rejects random invalid protocol", async () => {
		await expect(loadCanvas("test:not-a-url")).rejects.toThrow(
			"Invalid URL protocol",
		);
	});

	it("rejects file protocol", async () => {
		await expect(loadCanvas("file:///etc/passwd")).rejects.toThrow(
			"Invalid URL protocol",
		);
	});

	it("returns an HTMLCanvasElement", async () => {
		const canvas = await loadCanvas(PNG_1x1_DATA_URL);

		expect(canvas).toBeInstanceOf(HTMLCanvasElement);
	});

	it("sets the canvas id to the source URL", async () => {
		const canvas = await loadCanvas(PNG_1x1_DATA_URL);

		expect(canvas.id).toBe(PNG_1x1_DATA_URL);
	});

	it("matches the canvas dimensions to the loaded image", async () => {
		const canvas = await loadCanvas(PNG_2x2_RED_DATA_URL);

		expect(canvas.width).toBe(2);
		expect(canvas.height).toBe(2);
	});

	it("draws the image into the canvas", async () => {
		const canvas = await loadCanvas(PNG_2x2_RED_DATA_URL);
		const context = canvas.getContext("2d")!;
		const { data } = context.getImageData(0, 0, 1, 1);

		// 2x2 red PNG: top-left pixel should be opaque red
		expect(data[0]).toBe(255); // R
		expect(data[1]).toBe(0); // G
		expect(data[2]).toBe(0); // B
		expect(data[3]).toBe(255); // A
	});
});
