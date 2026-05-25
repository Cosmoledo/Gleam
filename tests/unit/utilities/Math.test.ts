import { describe, it, expect, vi } from "vitest";

// ==================== Imports ====================

import {
	isNumeric,
	random2Pi,
	randomBetweenFloat,
	randomBetweenInt,
	randomBoolean,
	randomSign,
	toHHMMSS,
	toDegrees,
	wrapRadians,
	toRadians,
	roundTo,
	getFactorial,
} from "@/utilities/Math";

// ==================== isNumeric ====================

describe("isNumeric", () => {
	it("returns true for finite numbers", () => {
		expect(isNumeric(0)).toBe(true);
		expect(isNumeric(1)).toBe(true);
		expect(isNumeric(-5)).toBe(true);
		expect(isNumeric(3.14)).toBe(true);
		expect(isNumeric(1e10)).toBe(true);
	});

	it("returns false for non-finite numbers", () => {
		expect(isNumeric(Infinity)).toBe(false);
		expect(isNumeric(-Infinity)).toBe(false);
		expect(isNumeric(NaN)).toBe(false);
	});

	it("returns true for numeric strings", () => {
		expect(isNumeric("0")).toBe(true);
		expect(isNumeric("123")).toBe(true);
		expect(isNumeric("-456")).toBe(true);
		expect(isNumeric("3.14")).toBe(true);
		expect(isNumeric("0.5")).toBe(true);
	});

	it("trims whitespace from strings", () => {
		expect(isNumeric(" 123 ")).toBe(true);
		expect(isNumeric(" 3.14 ")).toBe(true);
	});

	it("returns false for non-numeric strings", () => {
		expect(isNumeric("")).toBe(false);
		expect(isNumeric("abc")).toBe(false);
		expect(isNumeric("12abc")).toBe(false);
		expect(isNumeric("1.2.3")).toBe(false);
		expect(isNumeric("1e5")).toBe(false);
		expect(isNumeric("Infinity")).toBe(false);
	});

	it("returns false for non-number types", () => {
		expect(isNumeric(null)).toBe(false);
		expect(isNumeric(undefined)).toBe(false);
		expect(isNumeric(true)).toBe(false);
		expect(isNumeric(false)).toBe(false);
		expect(isNumeric([])).toBe(false);
		expect(isNumeric({})).toBe(false);
		expect(isNumeric(() => {})).toBe(false);
	});
});

// ==================== random2Pi ====================

describe("random2Pi", () => {
	it("returns a value in [0, 2*PI)", () => {
		for (let i = 0; i < 100; i++) {
			const result = random2Pi();
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThan(2 * Math.PI);
		}
	});

	it("returns different values across calls", () => {
		const results = new Set<number>();
		for (let i = 0; i < 100; i++) {
			results.add(random2Pi());
		}
		expect(results.size).toBeGreaterThan(50);
	});

	it("is deterministic with fixed RNG", () => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random").mockReturnValue(0);

		expect(random2Pi()).toBe(0);

		vi.useRealTimers();
		vi.restoreAllMocks();
	});
});

// ==================== randomBetweenFloat ====================

describe("randomBetweenFloat", () => {
	it("returns a value in [min, max)", () => {
		for (let i = 0; i < 100; i++) {
			const result = randomBetweenFloat(1, 10);
			expect(result).toBeGreaterThanOrEqual(1);
			expect(result).toBeLessThan(10);
		}
	});

	it("handles negative ranges", () => {
		for (let i = 0; i < 100; i++) {
			const result = randomBetweenFloat(-10, -1);
			expect(result).toBeGreaterThanOrEqual(-10);
			expect(result).toBeLessThan(-1);
		}
	});

	it("handles negative to positive range", () => {
		for (let i = 0; i < 100; i++) {
			const result = randomBetweenFloat(-5, 5);
			expect(result).toBeGreaterThanOrEqual(-5);
			expect(result).toBeLessThan(5);
		}
	});

	it("returns min when max equals min", () => {
		for (let i = 0; i < 10; i++) {
			vi.spyOn(Math, "random").mockReturnValue(0);
			expect(randomBetweenFloat(3, 3)).toBe(3);
		}
	});

	it("is deterministic with fixed RNG", () => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random").mockReturnValue(0.5);

		expect(randomBetweenFloat(0, 10)).toBe(5);

		vi.useRealTimers();
		vi.restoreAllMocks();
	});
});

// ==================== randomBetweenInt ====================

describe("randomBetweenInt", () => {
	it("returns an integer in [min, max]", () => {
		for (let i = 0; i < 100; i++) {
			const result = randomBetweenInt(1, 10);
			expect(result).toBeGreaterThanOrEqual(1);
			expect(result).toBeLessThanOrEqual(10);
			expect(Number.isInteger(result)).toBe(true);
		}
	});

	it("returns min when max equals min", () => {
		expect(randomBetweenInt(5, 5)).toBe(5);
	});

	it("returns either min or max for range of 1", () => {
		const results = new Set<number>();
		for (let i = 0; i < 100; i++) {
			results.add(randomBetweenInt(3, 4));
		}
		expect(results).toEqual(new Set([3, 4]));
	});

	it("handles negative ranges", () => {
		for (let i = 0; i < 100; i++) {
			const result = randomBetweenInt(-5, -1);
			expect(result).toBeGreaterThanOrEqual(-5);
			expect(result).toBeLessThanOrEqual(-1);
			expect(Number.isInteger(result)).toBe(true);
		}
	});

	it("handles negative to positive range", () => {
		for (let i = 0; i < 100; i++) {
			const result = randomBetweenInt(-2, 2);
			expect(result).toBeGreaterThanOrEqual(-2);
			expect(result).toBeLessThanOrEqual(2);
			expect(Number.isInteger(result)).toBe(true);
		}
	});

	it("is deterministic with fixed RNG", () => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random").mockReturnValue(0);

		expect(randomBetweenInt(0, 9)).toBe(0);

		vi.useRealTimers();
		vi.restoreAllMocks();
	});
});

// ==================== randomBoolean ====================

describe("randomBoolean", () => {
	it("returns true or false", () => {
		const results = new Set<boolean>();
		for (let i = 0; i < 100; i++) {
			results.add(randomBoolean());
		}
		expect(results.size).toBe(2);
	});

	it("is deterministic with fixed RNG", () => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random").mockReturnValue(0.3);

		expect(randomBoolean()).toBe(false);

		vi.spyOn(Math, "random").mockReturnValue(0.7);

		expect(randomBoolean()).toBe(true);

		vi.spyOn(Math, "random").mockReturnValue(0.5);

		expect(randomBoolean()).toBe(true);

		vi.useRealTimers();
		vi.restoreAllMocks();
	});
});

// ==================== randomSign ====================

describe("randomSign", () => {
	it("returns 1 or -1", () => {
		const results = new Set<number>();
		vi.spyOn(Math, "random").mockReturnValue(0.1);
		results.add(randomSign());
		vi.spyOn(Math, "random").mockReturnValue(0.9);
		results.add(randomSign());
		expect(results).toEqual(new Set([1, -1]));
	});

	it("is deterministic with fixed RNG", () => {
		vi.useFakeTimers();
		vi.spyOn(Math, "random")
			.mockReturnValueOnce(0.3)
			.mockReturnValueOnce(0.7);

		expect(randomSign()).toBe(-1);
		expect(randomSign()).toBe(1);

		vi.useRealTimers();
		vi.restoreAllMocks();
	});
});

// ==================== toHHMMSS ====================

describe("toHHMMSS", () => {
	it("formats zero time", () => {
		expect(toHHMMSS(0)).toBe("00:00");
	});

	it("formats seconds only (less than 1 hour)", () => {
		expect(toHHMMSS(1)).toBe("00:01");
		expect(toHHMMSS(59)).toBe("00:59");
		expect(toHHMMSS(9)).toBe("00:09");
	});

	it("formats minutes and seconds", () => {
		expect(toHHMMSS(60)).toBe("01:00");
		expect(toHHMMSS(65)).toBe("01:05");
		expect(toHHMMSS(120)).toBe("02:00");
		expect(toHHMMSS(3599)).toBe("59:59");
	});

	it("formats hours, minutes, and seconds", () => {
		expect(toHHMMSS(3600)).toBe("01:00:00");
		expect(toHHMMSS(3661)).toBe("01:01:01");
		expect(toHHMMSS(7265)).toBe("02:01:05");
		expect(toHHMMSS(86399)).toBe("23:59:59");
	});

	it("handles single digit minutes/seconds with leading zeros", () => {
		expect(toHHMMSS(3601)).toBe("01:00:01");
		expect(toHHMMSS(3600 + 5)).toBe("01:00:05");
		expect(toHHMMSS(3600 + 59)).toBe("01:00:59");
		expect(toHHMMSS(3600 + 60)).toBe("01:01:00");
	});

	it("handles large hour values", () => {
		expect(toHHMMSS(360000)).toBe("100:00:00");
		expect(toHHMMSS(999999)).toBe("277:46:39");
	});

	it("floors fractional input", () => {
		expect(toHHMMSS(0.9)).toBe("00:00");
		expect(toHHMMSS(59.9)).toBe("00:59");
	});

	it("handles negative input", () => {
		expect(toHHMMSS(-1)).toBe("0-1:59:59");
		expect(toHHMMSS(-60)).toBe("0-1:59:00");
	});
});

// ==================== toDegrees ====================

describe("toDegrees", () => {
	it("converts 0 radians to 0 degrees", () => {
		expect(toDegrees(0)).toBe(0);
	});

	it("converts PI/2 radians to 90 degrees", () => {
		expect(toDegrees(Math.PI / 2)).toBeCloseTo(90);
	});

	it("converts PI radians to 180 degrees", () => {
		expect(toDegrees(Math.PI)).toBeCloseTo(180);
	});

	it("converts 2*PI radians to 360 degrees", () => {
		expect(toDegrees(2 * Math.PI)).toBeCloseTo(360);
	});

	it("converts negative radians", () => {
		expect(toDegrees(-Math.PI / 2)).toBeCloseTo(-90);
	});

	it("converts 45 degrees correctly", () => {
		expect(toDegrees(Math.PI / 4)).toBeCloseTo(45);
	});

	it("converts 30 degrees correctly", () => {
		expect(toDegrees(Math.PI / 6)).toBeCloseTo(30);
	});

	it("converts 60 degrees correctly", () => {
		expect(toDegrees(Math.PI / 3)).toBeCloseTo(60);
	});
});

// ==================== wrapRadians ====================

describe("wrapRadians", () => {
	it("returns unchanged for values in [-PI, PI)", () => {
		expect(wrapRadians(0)).toBe(0);
		expect(wrapRadians(1)).toBe(1);
		expect(wrapRadians(-1)).toBe(-1);
		expect(wrapRadians(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
	});

	it("wraps 2*PI to 0", () => {
		expect(wrapRadians(2 * Math.PI)).toBeCloseTo(0);
	});

	it("wraps -2*PI to 0", () => {
		expect(wrapRadians(-2 * Math.PI)).toBeCloseTo(0);
	});

	it("wraps values beyond 2*PI", () => {
		expect(wrapRadians(3 * Math.PI)).toBeCloseTo(-Math.PI);
		expect(wrapRadians(4 * Math.PI)).toBeCloseTo(0);
		expect(wrapRadians(5 * Math.PI)).toBeCloseTo(-Math.PI);
	});

	it("wraps values below -2*PI", () => {
		expect(wrapRadians(-3 * Math.PI)).toBeCloseTo(-Math.PI);
		expect(wrapRadians(-4 * Math.PI)).toBeCloseTo(0);
	});

	it("wraps large positive values", () => {
		const result = wrapRadians(100 * Math.PI);
		expect(result).toBeGreaterThanOrEqual(-Math.PI);
		expect(result).toBeLessThan(Math.PI);
	});

	it("wraps large negative values", () => {
		const result = wrapRadians(-100 * Math.PI);
		expect(result).toBeGreaterThanOrEqual(-Math.PI);
		expect(result).toBeLessThan(Math.PI);
	});

	it("returns -PI for input equal to -PI (boundary)", () => {
		// -PI is within [-PI, PI) so returns unchanged
		const result = wrapRadians(-Math.PI);
		expect(result).toBeCloseTo(-Math.PI);
	});
});

// ==================== toRadians ====================

describe("toRadians", () => {
	it("converts 0 degrees to 0 radians", () => {
		expect(toRadians(0)).toBe(0);
	});

	it("converts 90 degrees to PI/2", () => {
		expect(toRadians(90)).toBeCloseTo(Math.PI / 2);
	});

	it("converts 180 degrees to PI", () => {
		expect(toRadians(180)).toBeCloseTo(Math.PI);
	});

	it("converts 360 degrees to 2*PI", () => {
		expect(toRadians(360)).toBeCloseTo(2 * Math.PI);
	});

	it("converts negative degrees", () => {
		expect(toRadians(-90)).toBeCloseTo(-Math.PI / 2);
	});

	it("converts 45 degrees correctly", () => {
		expect(toRadians(45)).toBeCloseTo(Math.PI / 4);
	});

	it("converts 1 degree", () => {
		expect(toRadians(1)).toBeCloseTo(Math.PI / 180);
	});
});

// ==================== roundTo ====================

describe("roundTo", () => {
	it("rounds to 0 decimal places", () => {
		expect(roundTo(3.5, 0)).toBe(4);
		expect(roundTo(3.4, 0)).toBe(3);
		expect(roundTo(3.49, 0)).toBe(3);
	});

	it("rounds to 1 decimal place", () => {
		expect(roundTo(3.141, 1)).toBeCloseTo(3.1);
		expect(roundTo(3.151, 1)).toBeCloseTo(3.2);
	});

	it("rounds to 2 decimal places", () => {
		expect(roundTo(3.14159, 2)).toBeCloseTo(3.14);
		expect(roundTo(3.145, 2)).toBeCloseTo(3.15);
	});

	it("rounds to 3 decimal places", () => {
		expect(roundTo(3.14159, 3)).toBeCloseTo(3.142);
	});

	it("handles negative numbers", () => {
		expect(roundTo(-3.14159, 2)).toBeCloseTo(-3.14);
		expect(roundTo(-3.145, 2)).toBeCloseTo(-3.14);
	});

	it("handles zero", () => {
		expect(roundTo(0, 2)).toBe(0);
	});

	it("handles large numbers", () => {
		expect(roundTo(1234.5678, 2)).toBeCloseTo(1234.57);
	});

	it("handles small numbers", () => {
		expect(roundTo(0.0001, 4)).toBeCloseTo(0.0001);
		expect(roundTo(0.00005, 4)).toBeCloseTo(0);
	});

	it("handles zero digits", () => {
		expect(roundTo(123.456, 0)).toBe(123);
	});
});

// ==================== getFactorial ====================

describe("getFactorial", () => {
	it("calculates factorial of 0", () => {
		expect(getFactorial(0)).toBe(1);
	});

	it("calculates factorial of 1", () => {
		expect(getFactorial(1)).toBe(1);
	});

	it("calculates factorial of 2", () => {
		expect(getFactorial(2)).toBe(2);
	});

	it("calculates factorial of 5", () => {
		expect(getFactorial(5)).toBe(120);
	});

	it("calculates factorial of 10", () => {
		expect(getFactorial(10)).toBe(3628800);
	});

	it("calculates factorial of 12", () => {
		expect(getFactorial(12)).toBe(479001600);
	});

	it("throws on negative input", () => {
		expect(() => getFactorial(-1)).toThrow(
			"getFactorial requires non-negative integer",
		);
	});

	it("floors non-integer input", () => {
		expect(getFactorial(3.7)).toBe(getFactorial(3));
		expect(getFactorial(5.9)).toBe(getFactorial(5));
	});

	it("throws on NaN input", () => {
		expect(() => getFactorial(NaN)).toThrow(
			"getFactorial requires non-negative integer",
		);
	});

	it("throws on Infinity input", () => {
		expect(() => getFactorial(Infinity)).toThrow(
			"getFactorial requires non-negative integer",
		);
		expect(() => getFactorial(-Infinity)).toThrow(
			"getFactorial requires non-negative integer",
		);
	});

	it("memoizes results — repeated calls are fast", () => {
		const result1 = getFactorial(5);
		const result2 = getFactorial(5);
		expect(result2).toBe(result1);
	});

	it("extends cache on sequential calls", () => {
		expect(getFactorial(3)).toBe(6);
		expect(getFactorial(4)).toBe(24);
		expect(getFactorial(5)).toBe(120);
	});

	it("returns previous cached value when called out of order", () => {
		getFactorial(5);
		expect(getFactorial(3)).toBe(6);
		expect(getFactorial(4)).toBe(24);
	});

	it("returns Infinity when n reaches overflow threshold", async () => {
		vi.resetModules();
		const { getFactorial: getFactorial2 } =
			await import("@/utilities/Math");
		const result = getFactorial2(200);
		expect(result).toBe(Infinity);
	});

	it("returns Infinity immediately for large n after overflow is detected", async () => {
		vi.resetModules();
		const { getFactorial: getFactorial3 } =
			await import("@/utilities/Math");
		getFactorial3(200);
		expect(getFactorial3(172)).toBe(Infinity);
		expect(getFactorial3(1000)).toBe(Infinity);
	});
});
