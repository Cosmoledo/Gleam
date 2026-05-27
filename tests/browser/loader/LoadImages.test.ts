import { afterEach, describe, expect, it, vi } from "vitest";

import { loadImage } from "@/loader/UrlLoaders";
import { PNG_1x1_DATA_URL, PNG_2x2_RED_DATA_URL } from "../constants";

// ==================== loadImage ====================

describe("loadImage", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("rejects when the image fails to load", async () => {
		const url = `${window.location.origin}/__nonexistent__.png`;

		await expect(loadImage(url)).rejects.toThrow(
			`Image failed to load: ${url}`,
		);
	});

	it("rejects file: URLs", async () => {
		await expect(loadImage("file:///etc/passwd")).rejects.toThrow(
			"Invalid URL protocol",
		);
	});

	it("returns an HTMLImageElement", async () => {
		const image = await loadImage(PNG_1x1_DATA_URL);

		expect(image).toBeInstanceOf(HTMLImageElement);
	});

	it("sets src and id on the Image element", async () => {
		const image = await loadImage(PNG_1x1_DATA_URL);

		expect(image.src).toBe(PNG_1x1_DATA_URL);
		expect(image.dataset.src).toBe(PNG_1x1_DATA_URL);
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

	it("rejects when assigning image.src throws synchronously", async () => {
		// Stub `Image` so the `src` setter throws — exercises the
		// try/catch around src/id assignment inside loadImage.
		class ThrowingImage {
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;
			id = "";
			set src(_value: string) {
				throw new Error("src setter blew up");
			}
		}
		vi.stubGlobal("Image", ThrowingImage);

		await expect(loadImage(PNG_1x1_DATA_URL)).rejects.toThrow(
			"src setter blew up",
		);
	});
});
