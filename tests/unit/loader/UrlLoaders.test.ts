import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ==================== Imports ====================

import {
	validateUrl,
	safeLoad,
	loadText,
	loadJson,
	loadJsonCommented,
	loadImage,
	loadCanvas,
	loadBunch,
} from "@/loader/UrlLoaders";

// ==================== validateUrl ====================

describe("validateUrl", () => {
	it("accepts http:// URLs", () => {
		expect(() => validateUrl("http://example.com")).not.toThrow();
	});

	it("accepts https:// URLs", () => {
		expect(() => validateUrl("https://example.com")).not.toThrow();
	});

	it("accepts data: URLs", () => {
		expect(() => validateUrl("data:text/plain,hello")).not.toThrow();
	});

	it("accepts blob: URLs", () => {
		expect(() =>
			validateUrl("blob:https://example.com/uuid"),
		).not.toThrow();
	});

	it("rejects file: URLs", () => {
		expect(() => validateUrl("file:///etc/passwd")).toThrow(
			"Invalid URL protocol",
		);
	});

	it("rejects ftp: URLs", () => {
		expect(() => validateUrl("ftp://example.com/file")).toThrow(
			"Invalid URL protocol",
		);
	});

	it("rejects javascript: URLs", () => {
		expect(() => validateUrl("javascript:alert(1)")).toThrow(
			"Invalid URL protocol",
		);
	});

	it("accepts bare strings as relative paths", () => {
		expect(() => validateUrl("not-a-url")).not.toThrow();
	});

	it("accepts relative paths", () => {
		expect(() => validateUrl("./relative")).not.toThrow();
		expect(() => validateUrl("../parent")).not.toThrow();
		expect(() => validateUrl("/absolute")).not.toThrow();
	});

	it("trims whitespace before validating", () => {
		expect(() => validateUrl("  http://example.com  ")).not.toThrow();
	});
});

// ==================== safeLoad ====================

describe("safeLoad", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("resolves when promise resolves", async () => {
		const result = await safeLoad(
			Promise.resolve(42),
			"http://test.com",
			"test",
		);
		expect(result).toBe(42);
	});

	it("rejects when promise rejects", async () => {
		await expect(
			safeLoad(
				Promise.reject(new Error("fail")),
				"http://test.com",
				"test",
			),
		).rejects.toThrow("fail");
	});

	it("throws timeout error after DEFAULT_TIMEOUT_MS", async () => {
		const slowPromise = new Promise(() => {});
		const promise = safeLoad(slowPromise, "http://test.com", "slow");

		vi.advanceTimersByTime(10_000);

		// The timeout fires, but safeLoad wraps the error
		await expect(promise).rejects.toThrow(
			"Timeout (10000ms) when loading slow: http://test.com",
		);
	});

	it("clears timeout on success", async () => {
		const timerSpy = vi.spyOn(globalThis, "clearTimeout");
		await safeLoad(Promise.resolve(1), "http://test.com", "test");
		expect(timerSpy).toHaveBeenCalled();
		timerSpy.mockRestore();
	});

	it("clears timeout on error", async () => {
		const timerSpy = vi.spyOn(globalThis, "clearTimeout");
		await expect(
			safeLoad(
				Promise.reject(new Error("err")),
				"http://test.com",
				"test",
			),
		).rejects.toThrow();
		expect(timerSpy).toHaveBeenCalled();
		timerSpy.mockRestore();
	});

	it("formats non-Error rejections through String()", async () => {
		// Hits the `error?.message || String(error)` fallback branch: a
		// raw string has no .message, so the catch handler logs via String().
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(
			safeLoad(
				Promise.reject("plain string error"),
				"http://test.com",
				"test",
			),
		).rejects.toBe("plain string error");

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("plain string error"),
		);
		errorSpy.mockRestore();
	});
});

// ==================== loadText ====================

describe("loadText", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns text from fetch response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve("hello world"),
			}),
		);

		const text = await loadText("http://example.com/file.txt");
		expect(text).toBe("hello world");
	});

	it("throws on non-OK response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: "Not Found",
				text: () => Promise.resolve(""),
			}),
		);

		await expect(
			loadText("http://example.com/missing.txt"),
		).rejects.toThrow(
			"HTTP 404: Failed to load text from http://example.com/missing.txt",
		);
	});

});

// ==================== loadJson ====================

describe("loadJson", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("parses valid JSON", async () => {
		const data = { name: "test", value: 42 };
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(JSON.stringify(data)),
			}),
		);

		const result = await loadJson("http://example.com/data.json");
		expect(result).toEqual(data);
	});

	it("throws on invalid JSON", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve("{ invalid json }"),
			}),
		);

		await expect(loadJson("http://example.com/bad.json")).rejects.toThrow(
			"Expected property name or '}' in JSON at position 2 (line 1 column 3)",
		);
	});

	it("rejects non-OK responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				text: () => Promise.resolve(""),
			}),
		);

		await expect(loadJson("http://example.com/error.json")).rejects.toThrow(
			"HTTP 500: Failed to load text from http://example.com/error.json\n  Status: 500 Internal Server Error",
		);
	});

	it("rejects file: URLs", async () => {
		await expect(loadJson("file:///etc/passwd")).rejects.toThrow(
			"Invalid URL protocol",
		);
	});
});

// ==================== loadJsonCommented ====================

describe("loadJsonCommented", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("parses JSON with // comments", async () => {
		const raw = `{
			// This is a comment
			"name": "test",
			// Another comment
			"value": 42
		}`;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(raw),
			}),
		);

		const result = await loadJsonCommented("http://example.com/data.json");
		expect(result).toEqual({ name: "test", value: 42 });
	});

	it("strips empty lines", async () => {
		const raw = `{
			// comment

			"name": "test"
		}`;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(raw),
			}),
		);

		const result = await loadJsonCommented("http://example.com/data.json");
		expect(result).toEqual({ name: "test" });
	});

	it("preserves // inside strings", async () => {
		const raw = `{
			"url": "http://example.com/path"
		}`;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(raw),
			}),
		);

		const result = await loadJsonCommented("http://example.com/data.json");
		expect(result.url).toBe("http://example.com/path");
	});
});

// ==================== loadImage ====================

describe("loadImage", () => {
	it("rejects file: URLs", async () => {
		await expect(loadImage("file:///etc/passwd")).rejects.toThrow(
			"Invalid URL protocol",
		);
	});
});

// ==================== loadCanvas ====================

describe("loadCanvas", () => {
	it("rejects file: URLs", async () => {
		await expect(loadCanvas("file:///etc/passwd")).rejects.toThrow(
			"Invalid URL protocol",
		);
	});
});

// ==================== loadBunch ====================

describe("loadBunch", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("resolves all promises and maps keys", async () => {
		const result = await loadBunch({
			a: Promise.resolve(1),
			b: Promise.resolve(2),
			c: Promise.resolve(3),
		});
		expect(result).toEqual({ a: 1, b: 2, c: 3 });
	});

	it("rejects when one promise fails", async () => {
		await expect(
			loadBunch({
				a: Promise.resolve(1),
				b: Promise.reject(new Error("fail")),
				c: Promise.resolve(3),
			}),
		).rejects.toThrow("fail");
	});
});
