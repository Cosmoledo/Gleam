import { describe, expect, it } from "vitest";

// ==================== Imports ====================

import { defineMethod } from "@/utilities/Prototype";

// ==================== defineMethod ====================

describe("defineMethod", () => {
	class Box {
		value: number;
		constructor(value: number) {
			this.value = value;
		}
	}
	interface Box {
		double(): number;
		scale(factor: number): number;
	}

	it("assigns the method as callable with `this` bound to the instance", () => {
		defineMethod(Box.prototype, "double", function () {
			return this.value * 2;
		});

		expect(new Box(3).double()).toBe(6);
		expect(new Box(-4).double()).toBe(-8);
	});

	it("forwards arguments and return value through the declared signature", () => {
		defineMethod(Box.prototype, "scale", function (factor) {
			return this.value * factor;
		});

		expect(new Box(5).scale(3)).toBe(15);
	});

	it("defines the method as non-enumerable", () => {
		defineMethod(Box.prototype, "double", function () {
			return this.value;
		});

		const descriptor = Object.getOwnPropertyDescriptor(
			Box.prototype,
			"double",
		);
		expect(descriptor?.enumerable).toBe(false);
	});

	it("keeps the method out of `for-in` over an instance", () => {
		defineMethod(Box.prototype, "double", function () {
			return this.value;
		});

		const keys: string[] = [];
		for (const key in new Box(1)) {
			keys.push(key);
		}
		expect(keys).toContain("value");
		expect(keys).not.toContain("double");
	});

	it("defines the method as writable and configurable", () => {
		defineMethod(Box.prototype, "double", function () {
			return this.value;
		});

		const descriptor = Object.getOwnPropertyDescriptor(
			Box.prototype,
			"double",
		);
		expect(descriptor?.writable).toBe(true);
		expect(descriptor?.configurable).toBe(true);
	});

	it("overwrites a prior definition when called again", () => {
		defineMethod(Box.prototype, "double", function () {
			return this.value * 2;
		});
		defineMethod(Box.prototype, "double", function () {
			return this.value * 10;
		});

		expect(new Box(3).double()).toBe(30);
	});
});
