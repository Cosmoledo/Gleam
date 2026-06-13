import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import {
	doWhilePressed,
	getElement,
	initCSSVariables,
	setDisplay,
	setVisibility,
	styleElement,
	waitForEvent,
} from "@/utilities/DOM";

// ==================== getElement ====================

describe("getElement", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("returns the matched element", () => {
		const div = document.createElement("div");
		div.id = "target";
		document.body.appendChild(div);
		expect(getElement("#target")).toBe(div);
	});

	it("throws when no element matches", () => {
		expect(() => getElement(".missing")).toThrow(
			"Element not found: .missing",
		);
	});

	it("queries within a provided parent", () => {
		const wrapper = document.createElement("section");
		const child = document.createElement("span");
		child.className = "inner";
		wrapper.appendChild(child);
		document.body.appendChild(wrapper);

		const stray = document.createElement("span");
		stray.className = "inner";
		document.body.appendChild(stray);

		expect(getElement(".inner", wrapper)).toBe(child);
	});

	it("returns the first matching element when multiple match", () => {
		const a = document.createElement("p");
		a.className = "x";
		const b = document.createElement("p");
		b.className = "x";
		document.body.appendChild(a);
		document.body.appendChild(b);
		expect(getElement(".x")).toBe(a);
	});

	it("accepts a type parameter for narrowing", () => {
		const canvas = document.createElement("canvas");
		document.body.appendChild(canvas);
		const result = getElement<HTMLCanvasElement>("canvas");
		expect(result).toBe(canvas);
	});
});

// ==================== styleElement ====================

describe("styleElement", () => {
	it("assigns provided styles to the element", () => {
		const el = document.createElement("div");
		styleElement(el, { color: "red", backgroundColor: "blue" });
		expect(el.style.color).toBe("red");
		expect(el.style.backgroundColor).toBe("blue");
	});

	it("preserves unrelated existing styles", () => {
		const el = document.createElement("div");
		el.style.color = "green";
		styleElement(el, { backgroundColor: "yellow" });
		expect(el.style.color).toBe("green");
		expect(el.style.backgroundColor).toBe("yellow");
	});

	it("overwrites existing values for the same property", () => {
		const el = document.createElement("div");
		el.style.color = "green";
		styleElement(el, { color: "red" });
		expect(el.style.color).toBe("red");
	});

	it("accepts an empty styles object", () => {
		const el = document.createElement("div");
		el.style.color = "blue";
		styleElement(el, {});
		expect(el.style.color).toBe("blue");
	});
});

// ==================== setDisplay ====================

describe("setDisplay", () => {
	it("sets display to \"\" when active is true", () => {
		const el = document.createElement("div");
		el.style.display = "none";
		setDisplay(el, true);
		expect(el.style.display).toBe("");
	});

	it("sets display to \"none\" when active is false", () => {
		const el = document.createElement("div");
		setDisplay(el, false);
		expect(el.style.display).toBe("none");
	});

	it("toggles between states", () => {
		const el = document.createElement("div");
		setDisplay(el, false);
		expect(el.style.display).toBe("none");
		setDisplay(el, true);
		expect(el.style.display).toBe("");
	});
});

// ==================== setVisibility ====================

describe("setVisibility", () => {
	it("sets visibility to \"\" when active is true", () => {
		const el = document.createElement("div");
		el.style.visibility = "hidden";
		setVisibility(el, true);
		expect(el.style.visibility).toBe("");
	});

	it("sets visibility to \"hidden\" when active is false", () => {
		const el = document.createElement("div");
		setVisibility(el, false);
		expect(el.style.visibility).toBe("hidden");
	});

	it("toggles between states", () => {
		const el = document.createElement("div");
		setVisibility(el, false);
		expect(el.style.visibility).toBe("hidden");
		setVisibility(el, true);
		expect(el.style.visibility).toBe("");
	});
});

// ==================== initCSSVariables ====================

describe("initCSSVariables", () => {
	it("returns root, get, and set", () => {
		const vars = initCSSVariables();
		expect(vars.root).toBe(document.documentElement);
		expect(typeof vars.get).toBe("function");
		expect(typeof vars.set).toBe("function");
	});

	it("set writes a CSS custom property to :root", () => {
		const vars = initCSSVariables();
		vars.set("foo", "42px");
		expect(vars.root.style.getPropertyValue("--foo")).toBe("42px");
	});

	it("get reads a previously-set CSS custom property", () => {
		const vars = initCSSVariables();
		vars.set("bar", "hotpink");
		expect(vars.get("bar").trim()).toBe("hotpink");
	});

	it("prepends -- to the supplied name", () => {
		const vars = initCSSVariables();
		vars.set("baz", "12");
		expect(vars.root.style.getPropertyValue("--baz")).toBe("12");
		expect(vars.root.style.getPropertyValue("baz")).toBe("");
	});
});

// ==================== doWhilePressed ====================

describe("doWhilePressed", () => {
	let button: HTMLButtonElement;

	function down(id = 1): void {
		button.dispatchEvent(new PointerEvent("pointerdown", { pointerId: id }));
	}

	function up(id = 1): void {
		button.dispatchEvent(new PointerEvent("pointerup", { pointerId: id }));
	}

	function cancel(id = 1): void {
		button.dispatchEvent(new PointerEvent("pointercancel", { pointerId: id }));
	}

	beforeEach(() => {
		document.body.innerHTML = "";
		button = document.createElement("button");
		button.id = "btn";
		document.body.appendChild(button);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("throws when no element matches the selector", () => {
		expect(() => doWhilePressed("#missing", () => {})).toThrow(
			"Element not found: #missing",
		);
	});

	it("invokes the callback immediately on pointerdown", () => {
		const cb = vi.fn();
		doWhilePressed("#btn", cb);
		down();
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("keeps invoking the callback every delay ms while held", () => {
		const cb = vi.fn();
		doWhilePressed("#btn", cb, 100);
		down();
		expect(cb).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(100);
		expect(cb).toHaveBeenCalledTimes(2);
		vi.advanceTimersByTime(300);
		expect(cb).toHaveBeenCalledTimes(5);
	});

	it("stops invoking the callback after pointerup", () => {
		const cb = vi.fn();
		doWhilePressed("#btn", cb, 100);
		down();
		vi.advanceTimersByTime(100);
		expect(cb).toHaveBeenCalledTimes(2);
		up();
		vi.advanceTimersByTime(500);
		expect(cb).toHaveBeenCalledTimes(2);
	});

	it("stops invoking the callback after pointercancel", () => {
		const cb = vi.fn();
		doWhilePressed("#btn", cb, 100);
		down();
		vi.advanceTimersByTime(100);
		expect(cb).toHaveBeenCalledTimes(2);
		cancel();
		vi.advanceTimersByTime(500);
		expect(cb).toHaveBeenCalledTimes(2);
	});

	it("ignores a second pointerdown while one is active (capture in effect)", () => {
		const cb = vi.fn();
		doWhilePressed("#btn", cb, 100);
		down(1);
		vi.advanceTimersByTime(50);
		down(2);
		// Second pointer is ignored; first still drives the interval.
		expect(cb).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(50);
		expect(cb).toHaveBeenCalledTimes(2);
	});

	it("ignores pointerup from a different pointerId", () => {
		const cb = vi.fn();
		doWhilePressed("#btn", cb, 100);
		down(1);
		up(2);
		vi.advanceTimersByTime(100);
		// First pointer still active; interval still firing.
		expect(cb).toHaveBeenCalledTimes(2);
	});

	it("defaults to a 200ms interval", () => {
		const cb = vi.fn();
		doWhilePressed("#btn", cb);
		down();
		expect(cb).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(199);
		expect(cb).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(1);
		expect(cb).toHaveBeenCalledTimes(2);
	});

	it("dispose removes listeners and stops any in-flight interval", () => {
		const cb = vi.fn();
		const dispose = doWhilePressed("#btn", cb, 100);
		down();
		vi.advanceTimersByTime(100);
		expect(cb).toHaveBeenCalledTimes(2);
		dispose();
		vi.advanceTimersByTime(500);
		expect(cb).toHaveBeenCalledTimes(2);
		// Listener removed: a fresh pointerdown is a no-op.
		down();
		expect(cb).toHaveBeenCalledTimes(2);
	});

	it("dispose is a no-op when called without an active press", () => {
		const cb = vi.fn();
		const dispose = doWhilePressed("#btn", cb, 100);
		expect(() => dispose()).not.toThrow();
		expect(cb).toHaveBeenCalledTimes(0);
	});

	it("dispose is idempotent (safe to call twice)", () => {
		const cb = vi.fn();
		const dispose = doWhilePressed("#btn", cb, 100);
		down();
		dispose();
		expect(() => dispose()).not.toThrow();
	});

	it("restarts cleanly on a fresh press after release", () => {
		const cb = vi.fn();
		doWhilePressed("#btn", cb, 100);
		down();
		vi.advanceTimersByTime(150);
		expect(cb).toHaveBeenCalledTimes(2);
		up();
		// New press with a new pointerId fires immediately and resumes the interval.
		down(2);
		expect(cb).toHaveBeenCalledTimes(3);
		vi.advanceTimersByTime(100);
		expect(cb).toHaveBeenCalledTimes(4);
	});

	it("acquires and releases pointer capture with the active pointerId", () => {
		const cb = vi.fn();
		const captureSpy = vi.spyOn(button, "setPointerCapture");
		const releaseSpy = vi.spyOn(button, "releasePointerCapture");
		doWhilePressed("#btn", cb, 100);
		down(7);
		expect(captureSpy).toHaveBeenCalledWith(7);
		up(7);
		expect(releaseSpy).toHaveBeenCalledWith(7);
		captureSpy.mockRestore();
		releaseSpy.mockRestore();
	});

	it("releases captured pointer when disposed mid-press", () => {
		const cb = vi.fn();
		const releaseSpy = vi.spyOn(button, "releasePointerCapture");
		const dispose = doWhilePressed("#btn", cb, 100);
		down(4);
		dispose();
		expect(releaseSpy).toHaveBeenCalledWith(4);
		releaseSpy.mockRestore();
	});
});

// ==================== waitForEvent ====================

describe("waitForEvent", () => {
	it("resolves the next time the event fires", async () => {
		const el = document.createElement("div");
		const promise = waitForEvent(el, "click");
		el.dispatchEvent(new MouseEvent("click"));
		await expect(promise).resolves.toBeUndefined();
	});

	it("does not resolve before the event fires", async () => {
		const el = document.createElement("div");
		let settled = false;
		waitForEvent(el, "click").then(() => {
			settled = true;
		});
		await Promise.resolve();
		expect(settled).toBe(false);
	});

	it("uses a one-shot listener", async () => {
		const el = document.createElement("div");
		let resolveCount = 0;
		const promise = waitForEvent(el, "click").then(() => {
			resolveCount++;
		});
		el.dispatchEvent(new MouseEvent("click"));
		await promise;
		el.dispatchEvent(new MouseEvent("click"));
		await new Promise(res => setTimeout(res, 0));
		expect(resolveCount).toBe(1);
	});

	it("resolves on the specified event type only", async () => {
		const el = document.createElement("div");
		let settled = false;
		const promise = waitForEvent(el, "click").then(() => {
			settled = true;
		});
		el.dispatchEvent(new MouseEvent("mousedown"));
		await new Promise(res => setTimeout(res, 0));
		expect(settled).toBe(false);
		el.dispatchEvent(new MouseEvent("click"));
		await promise;
		expect(settled).toBe(true);
	});
});
