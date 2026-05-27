import { describe, expect, it } from "vitest";

// ==================== Imports ====================

import { compact, replaceCharAt } from "@/utilities/String";

// ==================== compact ====================

describe("compact", () => {
	it("trims leading and trailing whitespace", () => {
		expect(compact("  hello  ")).toBe("hello");
	});

	it("collapses internal whitespace runs to a single space", () => {
		expect(compact("hello   world")).toBe("hello world");
	});

	it("handles mixed whitespace (tabs, newlines, spaces)", () => {
		expect(compact("hello\t\t\n  world")).toBe("hello world");
	});

	it("returns trimmed string when no extra whitespace", () => {
		expect(compact("hello world")).toBe("hello world");
	});

	it("handles empty string", () => {
		expect(compact("")).toBe("");
	});

	it("handles string with only whitespace", () => {
		expect(compact("   ")).toBe("");
	});

	it("handles string with single character", () => {
		expect(compact("a")).toBe("a");
	});

	it("handles string with single character and whitespace", () => {
		expect(compact("  a  ")).toBe("a");
	});

	it("handles multiple consecutive whitespace blocks", () => {
		expect(compact("  a  b  c  ")).toBe("a b c");
	});

	it("handles tabs as internal whitespace", () => {
		expect(compact("hello\tworld")).toBe("hello world");
	});

	it("handles newlines as internal whitespace", () => {
		expect(compact("hello\nworld")).toBe("hello world");
	});

	it("handles carriage returns as internal whitespace", () => {
		expect(compact("hello\r\nworld")).toBe("hello world");
	});
});

// ==================== replaceCharAt ====================

describe("replaceCharAt", () => {
	it("replaces character at a given index", () => {
		expect(replaceCharAt("hello", 1, "a")).toBe("hallo");
	});

	it("replaces first character (index 0)", () => {
		expect(replaceCharAt("hello", 0, "j")).toBe("jello");
	});

	it("replaces last character", () => {
		expect(replaceCharAt("hello", 4, "d")).toBe("helld");
	});

	it("returns new string without mutating input", () => {
		const input = "hello";
		const result = replaceCharAt(input, 1, "a");
		expect(input).toBe("hello");
		expect(result).toBe("hallo");
	});

	it("throws on negative index", () => {
		expect(() => replaceCharAt("hello", -1, "a")).toThrow(
			"replaceCharAt index out of range: -1 (length 5)",
		);
	});

	it("throws on index equal to length", () => {
		expect(() => replaceCharAt("hello", 5, "a")).toThrow(
			"replaceCharAt index out of range: 5 (length 5)",
		);
	});

	it("throws on index greater than length", () => {
		expect(() => replaceCharAt("hello", 10, "a")).toThrow(
			"replaceCharAt index out of range: 10 (length 5)",
		);
	});

	it("throws when char has length !== 1", () => {
		expect(() => replaceCharAt("hello", 1, "ab")).toThrow(
			"replaceCharAt requires a single character, got length 2",
		);
	});

	it("throws when char is empty string", () => {
		expect(() => replaceCharAt("hello", 1, "")).toThrow(
			"replaceCharAt requires a single character, got length 0",
		);
	});

	it("handles single character string", () => {
		expect(replaceCharAt("a", 0, "b")).toBe("b");
	});

	it("handles replacing with special characters", () => {
		expect(replaceCharAt("hello", 1, "*")).toBe("h*llo");
	});

	it("handles replacing with number-like string character", () => {
		expect(replaceCharAt("abc", 1, "2")).toBe("a2c");
	});
});
