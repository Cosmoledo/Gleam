import { beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Settings from "@/core/Settings";
import { prepareLanguage } from "@/localization/Translator";

// ==================== Helpers ====================

function prepare(lang: string, translations: Record<string, string>) {
	prepareLanguage({ [lang]: translations }, lang);
}

// ==================== window.t fallback ====================

describe("window.t fallback", () => {
	it("throws before prepareLanguage is called", () => {
		expect(() => window.t("test")).toThrow("Call 'prepareLanguage' first!");
	});
});

// ==================== prepareLanguage + window.t ====================

describe("prepareLanguage", () => {
	it("translates a key using the current language", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { hello: "Hello", goodbye: "Goodbye" });
		expect(window.t("hello")).toBe("Hello");
		expect(window.t("goodbye")).toBe("Goodbye");
	});

	it("translates a key using a non-English language", () => {
		(Settings as any)._localStorage.language = "de";
		prepare("de", { hello: "Hallo", goodbye: "Tschüss" });
		expect(window.t("hello")).toBe("Hallo");
		expect(window.t("goodbye")).toBe("Tschüss");
	});

	it("falls back to the first language when current language is not in the dictionary", () => {
		(Settings as any)._localStorage.language = "fr";
		prepare("en", { hello: "Hello" });
		expect(window.t("hello")).toBe("Hello");
	});

	it("falls back to the first language when language is empty string", () => {
		(Settings as any)._localStorage.language = "";
		prepare("en", { hello: "Hello" });
		expect(window.t("hello")).toBe("Hello");
	});

	it("falls back to the first language when language is null", () => {
		(Settings as any)._localStorage.language = "null";
		prepare("en", { hello: "Hello" });
		expect(window.t("hello")).toBe("Hello");
	});

	it("falls back to the first language when language is undefined-like", () => {
		(Settings as any)._localStorage.language = "undefined";
		prepare("en", { hello: "Hello" });
		expect(window.t("hello")).toBe("Hello");
	});

	it("returns the key itself when the key has no translation", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { hello: "Hello" });
		expect(window.t("missing")).toBe("missing");
	});

	it("returns the key itself when the key has an empty string translation", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { empty: "" });
		expect(window.t("empty")).toBe("");
	});

	it("handles multiple languages", () => {
		prepareLanguage({
			en: { hello: "Hello", goodbye: "Goodbye" },
			de: { hello: "Hallo", goodbye: "Tschüss" },
		});
		(Settings as any)._localStorage.language = "en";
		expect(window.t("hello")).toBe("Hello");
		expect(window.t("goodbye")).toBe("Goodbye");

		(Settings as any)._localStorage.language = "de";
		expect(window.t("hello")).toBe("Hallo");
		expect(window.t("goodbye")).toBe("Tschüss");
	});

	it("handles keys with special characters", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", {
			"key.with.dots": "Dots",
			"key-with-dashes": "Dashes",
			key_with_underscores: "Underscores",
		});
		expect(window.t("key.with.dots")).toBe("Dots");
		expect(window.t("key-with-dashes")).toBe("Dashes");
		expect(window.t("key_with_underscores")).toBe("Underscores");
	});

	it("handles keys with spaces and numbers", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { "key with spaces": "Spaces", key123: "Numbers" });
		expect(window.t("key with spaces")).toBe("Spaces");
		expect(window.t("key123")).toBe("Numbers");
	});

	it("handles empty language dictionary", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", {});
		expect(window.t("anything")).toBe("anything");
	});

	it("handles empty string key", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", { "": "Empty key value" });
		expect(window.t("")).toBe("Empty key value");
	});

	it("handles Unicode characters in translations", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", {
			emoji: "Hello 👋",
			cjk: "こんにちは",
			cyrillic: "Привет",
		});
		expect(window.t("emoji")).toBe("Hello 👋");
		expect(window.t("cjk")).toBe("こんにちは");
		expect(window.t("cyrillic")).toBe("Привет");
	});

	it("handles keys with newlines and tabs", () => {
		(Settings as any)._localStorage.language = "en";
		prepare("en", {
			"key\nwith\nnewlines": "Newlines",
			"key\twith\ttabs": "Tabs",
		});
		expect(window.t("key\nwith\nnewlines")).toBe("Newlines");
		expect(window.t("key\twith\ttabs")).toBe("Tabs");
	});

	it("throws when defaultLanguage is missing from languages", () => {
		expect(() => prepareLanguage({ de: { hello: "Hallo" } }, "fr")).toThrow(
			"Default language is defined as \"fr\" but isn't supplied!",
		);
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
		expect(errorSpy).toHaveBeenCalledWith("\"de\" misses \"hello\"");
	});

	it("logs warning when language not found in dictionary", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		(Settings as any)._localStorage.language = "xx";
		prepareLanguage({ en: { hello: "Hello" } });
		window.t("hello");
		expect(warnSpy).toHaveBeenCalledWith(
			"Language \"xx\" not found, falling back to \"en\"",
		);
	});

	it("logs warning when key has no translation", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		(Settings as any)._localStorage.language = "en";
		prepare("en", { hello: "Hello" });
		window.t("untranslated");
		expect(warnSpy).toHaveBeenCalledWith(
			"\"untranslated\" has no translation",
		);
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
		expect(errorSpy).toHaveBeenCalledWith("\"fr\" misses \"hello\"");
	});

	it("logs missing keys for multiple keys", () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		prepareLanguage({
			en: { hello: "Hello", goodbye: "Goodbye" },
			de: {},
		});
		expect(errorSpy).toHaveBeenCalledWith("\"de\" misses \"goodbye\"");
		expect(errorSpy).toHaveBeenCalledWith("\"de\" misses \"hello\"");
	});

	it("logs missing keys in sorted order", () => {
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		prepareLanguage({
			en: { zebra: "Z", apple: "A", mango: "M" },
			de: {},
		});
		expect(errorSpy).toHaveBeenNthCalledWith(1, "\"de\" misses \"apple\"");
		expect(errorSpy).toHaveBeenNthCalledWith(2, "\"de\" misses \"mango\"");
		expect(errorSpy).toHaveBeenNthCalledWith(3, "\"de\" misses \"zebra\"");
	});

	it("includes a suppressed-count suffix when a missing key re-logs after the throttle window", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const nowSpy = vi.spyOn(performance, "now").mockReturnValue(2_000_000);

		try {
			(Settings as any)._localStorage.language = "en";
			prepare("en", { hello: "Hello" });
			window.t("throttle-key-test");
			window.t("throttle-key-test");
			window.t("throttle-key-test");
			nowSpy.mockReturnValue(2_002_000);
			window.t("throttle-key-test");
			expect(warnSpy).toHaveBeenCalledTimes(2);
			expect(warnSpy.mock.calls[1][0]).toMatch(/x3 since last log/);
		} finally {
			nowSpy.mockRestore();
		}
	});

	it("includes a suppressed-count suffix when a missing language re-logs after the throttle window", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const nowSpy = vi.spyOn(performance, "now").mockReturnValue(3_000_000);

		try {
			(Settings as any)._localStorage.language = "yy";
			prepareLanguage({ en: { hello: "Hello" } });
			window.t("hello");
			window.t("hello");
			window.t("hello");
			nowSpy.mockReturnValue(3_002_000);
			window.t("hello");
			expect(warnSpy).toHaveBeenCalledTimes(2);
			expect(warnSpy.mock.calls[1][0]).toMatch(/x3 since last log/);
		} finally {
			nowSpy.mockRestore();
		}
	});
});
