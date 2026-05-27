import { beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Settings from "@/core/Settings";
import { prepareLanguage } from "@/localization/Translator";

// ==================== Helpers ====================

function prepare(lang: string, translations: Record<string, string>) {
	prepareLanguage({ [lang]: translations });
}

// ==================== window._ fallback ====================

describe("window._ fallback", () => {
	it("throws before prepareLanguage is called", () => {
		expect(() => window._("test")).toThrow("Call 'prepareLanguage' first!");
	});
});

// ==================== prepareLanguage + window._ ====================

describe("prepareLanguage", () => {
	it("translates a key using the current language", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { hello: "Hello", goodbye: "Goodbye" });
		expect(window._("hello")).toBe("Hello");
		expect(window._("goodbye")).toBe("Goodbye");
	});

	it("translates a key using a non-English language", () => {
		(Settings as any)._localStorage.language = "de";
		prepare("de", { hello: "Hallo", goodbye: "Tschüss" });
		expect(window._("hello")).toBe("Hallo");
		expect(window._("goodbye")).toBe("Tschüss");
	});

	it("falls back to the first language when current language is not in the dictionary", () => {
		(Settings as any)._localStorage.language = "fr";
		prepare("en", { hello: "Hello" });
		expect(window._("hello")).toBe("Hello");
	});

	it("falls back to the first language when language is empty string", () => {
		(Settings as any)._localStorage.language = "";
		prepare("en", { hello: "Hello" });
		expect(window._("hello")).toBe("Hello");
	});

	it("falls back to the first language when language is null", () => {
		(Settings as any)._localStorage.language = "null";
		prepare("en", { hello: "Hello" });
		expect(window._("hello")).toBe("Hello");
	});

	it("falls back to the first language when language is undefined-like", () => {
		(Settings as any)._localStorage.language = "undefined";
		prepare("en", { hello: "Hello" });
		expect(window._("hello")).toBe("Hello");
	});

	it("returns the key itself when the key has no translation", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { hello: "Hello" });
		expect(window._("missing")).toBe("missing");
	});

	it("returns the key itself when the key has an empty string translation", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { empty: "" });
		expect(window._("empty")).toBe("");
	});

	it("handles multiple languages", () => {
		prepareLanguage({
			en: { hello: "Hello", goodbye: "Goodbye" },
			de: { hello: "Hallo", goodbye: "Tschüss" },
		});
		(Settings as any)._localStorage.language = "en";
		expect(window._("hello")).toBe("Hello");
		expect(window._("goodbye")).toBe("Goodbye");

		(Settings as any)._localStorage.language = "de";
		expect(window._("hello")).toBe("Hallo");
		expect(window._("goodbye")).toBe("Tschüss");
	});

	it("handles keys with special characters", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", {
			"key.with.dots": "Dots",
			"key-with-dashes": "Dashes",
			key_with_underscores: "Underscores",
		});
		expect(window._("key.with.dots")).toBe("Dots");
		expect(window._("key-with-dashes")).toBe("Dashes");
		expect(window._("key_with_underscores")).toBe("Underscores");
	});

	it("handles keys with spaces and numbers", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { "key with spaces": "Spaces", key123: "Numbers" });
		expect(window._("key with spaces")).toBe("Spaces");
		expect(window._("key123")).toBe("Numbers");
	});

	it("handles empty language dictionary", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", {});
		expect(window._("anything")).toBe("anything");
	});

	it("handles empty string key", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { "": "Empty key value" });
		expect(window._("")).toBe("Empty key value");
	});

	it("handles Unicode characters in translations", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", {
			emoji: "Hello 👋",
			cjk: "こんにちは",
			cyrillic: "Привет",
		});
		expect(window._("emoji")).toBe("Hello 👋");
		expect(window._("cjk")).toBe("こんにちは");
		expect(window._("cyrillic")).toBe("Привет");
	});

	it("handles keys with newlines and tabs", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", {
			"key\nwith\nnewlines": "Newlines",
			"key\twith\ttabs": "Tabs",
		});
		expect(window._("key\nwith\nnewlines")).toBe("Newlines");
		expect(window._("key\twith\ttabs")).toBe("Tabs");
	});
});

// ==================== console.error calls ====================

describe("console.error", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("logs error when a language misses a key", () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		prepareLanguage({
			en: { hello: "Hello" },
			de: {},
		});
		expect(errorSpy).toHaveBeenCalledWith("'de' misses 'hello'");
	});

	it("logs error when language not found in dictionary", () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		(Settings as any)._localStorage.language = "fr";
		prepareLanguage({ en: { hello: "Hello" } });
		window._("hello");
		expect(errorSpy).toHaveBeenCalledWith(
			"Language 'fr' not found, falling back to 'en'",
		);
	});

	it("logs error when key has no translation", () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		(Settings as any)._localStorage.language = "en";
		prepare("en", { hello: "Hello" });
		window._("missing");
		expect(errorSpy).toHaveBeenCalledWith("'missing' has no translation");
	});

	it("logs missing keys for multiple languages", () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		prepareLanguage({
			en: { hello: "Hello" },
			de: { hello: "Hallo" },
			fr: {},
		});
		expect(errorSpy).toHaveBeenCalledWith("'fr' misses 'hello'");
	});

	it("logs missing keys for multiple keys", () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		prepareLanguage({
			en: { hello: "Hello", goodbye: "Goodbye" },
			de: {},
		});
		expect(errorSpy).toHaveBeenCalledWith("'de' misses 'goodbye'");
		expect(errorSpy).toHaveBeenCalledWith("'de' misses 'hello'");
	});

	it("logs missing keys in sorted order", () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		prepareLanguage({
			en: { zebra: "Z", apple: "A", mango: "M" },
			de: {},
		});
		expect(errorSpy).toHaveBeenNthCalledWith(1, "'de' misses 'apple'");
		expect(errorSpy).toHaveBeenNthCalledWith(2, "'de' misses 'mango'");
		expect(errorSpy).toHaveBeenNthCalledWith(3, "'de' misses 'zebra'");
	});
});
