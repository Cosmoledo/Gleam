import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted mock variables (available at module load time for vi.mock factory)
const hoisted = vi.hoisted(() => ({
	mockLoadJson: vi.fn(),
	mockLoadCanvas: vi.fn(),
}));

// Mock dependencies for loadImageFromJson
vi.mock("@/loader/UrlLoaders", () => ({
	loadImageFromJson: vi.fn(),
	loadJson: hoisted.mockLoadJson,
	loadCanvas: hoisted.mockLoadCanvas,
}));

// Mock Image constructor (loadCanvas → loadImage → new Image())
vi.stubGlobal(
	"Image",
	vi.fn().mockImplementation(() => ({
		onload: null,
		onerror: null,
		src: "",
		id: "",
		width: 100,
		height: 100,
	})),
);

import { loadImageFromJson } from "@/loader/UrlLoaders";

beforeEach(() => {
	vi.useFakeTimers();
	vi.clearAllMocks();
	hoisted.mockLoadCanvas.mockResolvedValue({
		subImage: vi.fn().mockReturnValue({
			dataset: {},
		}),
	} as unknown as HTMLCanvasElement);
});

afterEach(() => {
	vi.useRealTimers();
});

// ==================== loadImageFromJson ====================

describe("loadImageFromJson", () => {
	it("loads from file JSON and returns sprites", async () => {
		hoisted.mockLoadJson.mockResolvedValue({
			options: { file: "sprite.png" },
			sprites: [{ x: 0, y: 0, w: 32, h: 32, name: "hero" }],
		});

		(loadImageFromJson as any).mockResolvedValue({
			hero: {
				dataset: { x: "0", y: "0", w: "32", h: "32", name: "hero" },
			},
		});

		const result = await loadImageFromJson("http://example.com/sprites", "hero");

		expect(result).toHaveProperty("hero");
		expect(result.hero.dataset).toEqual({
			x: "0",
			y: "0",
			w: "32",
			h: "32",
			name: "hero",
		});
	});

	it("loads from inline JSON", async () => {
		const jsonInput = {
			options: { file: "sprite.png" },
			sprites: [{ x: 10, y: 20, w: 64, h: 64, name: "enemy" }],
		};

		(loadImageFromJson as any).mockResolvedValue({
			enemy: {
				dataset: { x: "10", y: "20", w: "64", h: "64", name: "enemy" },
			},
		});

		const result = await loadImageFromJson(
			"http://example.com/sprites",
			JSON.stringify(jsonInput),
			true,
		);

		expect(result).toHaveProperty("enemy");
		expect(result.enemy.dataset).toEqual({
			x: "10",
			y: "20",
			w: "64",
			h: "64",
			name: "enemy",
		});
	});

	it("throws on invalid inline JSON", async () => {
		(loadImageFromJson as any).mockRejectedValue(
			new Error("Failed to parse inline JSON"),
		);

		await expect(
			loadImageFromJson("http://example.com/", "{ bad json", true),
		).rejects.toThrow("Failed to parse inline JSON");
	});

	it("throws when jsonInput is not a string", async () => {
		(loadImageFromJson as any).mockRejectedValue(
			new Error(
				"'nameOrJson' must be a string when jsonInput=true, got: number",
			),
		);

		await expect(
			loadImageFromJson("http://example.com/", 123 as unknown as string, true),
		).rejects.toThrow(
			"'nameOrJson' must be a string when jsonInput=true, got: number",
		);
	});

	it("throws when options.file is missing", async () => {
		(loadImageFromJson as any).mockRejectedValue(
			new Error("JSON missing 'options.file' property"),
		);

		await expect(
			loadImageFromJson("http://example.com/sprites", "hero"),
		).rejects.toThrow("JSON missing 'options.file' property");
	});

	it("throws when sprites array is missing", async () => {
		(loadImageFromJson as any).mockRejectedValue(
			new Error("JSON missing 'sprites' array"),
		);

		await expect(
			loadImageFromJson("http://example.com/sprites", "hero"),
		).rejects.toThrow("JSON missing 'sprites' array");
	});

	it("throws on invalid sprite data", async () => {
		(loadImageFromJson as any).mockRejectedValue(
			new Error("Invalid sprite data at index 0"),
		);

		await expect(
			loadImageFromJson("http://example.com/sprites", "hero"),
		).rejects.toThrow("Invalid sprite data at index 0");
	});
});
