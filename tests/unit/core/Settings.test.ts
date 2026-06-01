import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Settings from "@/core/Settings";
import { createMockGame } from "../createMockGame";

// ==================== Helpers ====================

const PUBLIC_FIELDS = [
	"antialias",
	"autoloop",
	"backgroundColor",
	"debug",
	"doNotClear",
	"enableResize",
	"font",
	"fps",
	"triedToClose",
	"useClearRect",
	"warnBeforeClose",
] as const;

type FieldKey = (typeof PUBLIC_FIELDS)[number];

function snapshotSettings(): Record<FieldKey, unknown> {
	const out = {} as Record<FieldKey, unknown>;
	PUBLIC_FIELDS.forEach(k => {
		out[k] = (Settings as unknown as Record<string, unknown>)[k];
	});
	return out;
}

function restoreSettings(snap: Record<FieldKey, unknown>): void {
	PUBLIC_FIELDS.forEach(k => {
		(Settings as unknown as Record<string, unknown>)[k] = snap[k];
	});
}

function privateLocalStorage(): { language: string } {
	return (Settings as unknown as { _localStorage: { language: string } })
		._localStorage;
}

function createFakeStorage(): Storage {
	const map = new Map<string, string>();
	return {
		get length(): number {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
		key: (i: number) => Array.from(map.keys())[i] ?? null,
		removeItem: (k: string) => {
			map.delete(k);
		},
		setItem: (k: string, v: string) => {
			map.set(k, v);
		},
	};
}

const LOCAL_STORAGE_KEY = "gleam";

let snapshot: Record<FieldKey, unknown>;
let savedLanguage: string;
let fakeStorage: Storage;

beforeEach(() => {
	snapshot = snapshotSettings();
	savedLanguage = privateLocalStorage().language;
	fakeStorage = createFakeStorage();
	vi.stubGlobal("localStorage", fakeStorage);
});

afterEach(() => {
	restoreSettings(snapshot);
	const ls = privateLocalStorage() as Record<string, unknown>;
	Object.keys(ls).forEach(k => {
		if (k !== "language") {
			delete ls[k];
		}
	});
	ls.language = savedLanguage;
	delete (window as unknown as { game?: unknown }).game;
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

// ==================== defaults ====================

describe("Settings defaults", () => {
	it("has the documented default field values", () => {
		expect(Settings.antialias).toBe(false);
		expect(Settings.autoloop).toBe(true);
		expect(Settings.backgroundColor).toBe("#444");
		expect(Settings.debug).toBe(false);
		expect(Settings.doNotClear).toBe(false);
		expect(Settings.enableResize).toBe(true);
		expect(Settings.font).toBe("Arial");
		expect(Settings.fps).toBeCloseTo(1 / 60);
		expect(Settings.useClearRect).toBe(true);
		expect(Settings.warnBeforeClose).toBe(false);
	});
});

// ==================== localStorage getter ====================

describe("Settings.localStorage", () => {
	it("exposes the language field", () => {
		expect("language" in Settings.localStorage).toBe(true);
	});

	it("returns the same backing object across calls", () => {
		expect(Settings.localStorage).toBe(Settings.localStorage);
	});

	it("reflects mutations made via setLocalStorage", () => {
		Settings.setLocalStorage("language", "es");
		expect(Settings.localStorage.language).toBe("es");
	});
});

// ==================== init: overrides ====================

describe("Settings.init overrides", () => {
	it("applies the override values onto the static class", () => {
		Settings.init(
			{
				antialias: true,
				backgroundColor: "#000",
				font: "Helvetica",
				fps: 1 / 30,
			},
			createMockGame(),
		);
		expect(Settings.antialias).toBe(true);
		expect(Settings.backgroundColor).toBe("#000");
		expect(Settings.font).toBe("Helvetica");
		expect(Settings.fps).toBeCloseTo(1 / 30);
	});

	it("leaves untouched fields at their existing values", () => {
		Settings.font = "Verdana";
		Settings.init({ antialias: true }, createMockGame());
		expect(Settings.font).toBe("Verdana");
	});
});

// ==================== init: fps validation ====================

describe("Settings.init fps validation", () => {
	it("throws when fps is 0", () => {
		expect(() => Settings.init({ fps: 0 }, createMockGame())).toThrow(
			/Settings\.fps must be > 0, got 0/,
		);
	});

	it("throws when fps is negative", () => {
		expect(() => Settings.init({ fps: -1 }, createMockGame())).toThrow(
			/Settings\.fps must be > 0, got -1/,
		);
	});

	it("does not throw for positive fps", () => {
		expect(() =>
			Settings.init({ fps: 1 / 30 }, createMockGame()),
		).not.toThrow();
	});
});

// ==================== init: debug hook ====================

describe("Settings.init debug", () => {
	it("attaches the game instance to window.game when debug=true", () => {
		const game = createMockGame();
		Settings.init({ debug: true }, game);
		expect((window as unknown as { game: unknown }).game).toBe(game);
	});

	it("does not attach window.game when debug=false", () => {
		Settings.init({ debug: false }, createMockGame());
		expect((window as unknown as { game?: unknown }).game).toBeUndefined();
	});
});

// ==================== init: warnBeforeClose ====================

describe("Settings.init warnBeforeClose", () => {
	it("registers a beforeunload listener when warnBeforeClose=true", () => {
		const spy = vi.spyOn(window, "addEventListener");
		Settings.init({ warnBeforeClose: true }, createMockGame());
		const types = spy.mock.calls.map(c => c[0]);
		expect(types).toContain("beforeunload");
	});

	it("does not register a beforeunload listener when warnBeforeClose=false", () => {
		const spy = vi.spyOn(window, "addEventListener");
		Settings.init({ warnBeforeClose: false }, createMockGame());
		const types = spy.mock.calls.map(c => c[0]);
		expect(types).not.toContain("beforeunload");
	});

	it("invokes triedToClose and sets the event for confirmation", () => {
		const spy = vi.spyOn(window, "addEventListener");
		const triedToClose = vi.fn();
		Settings.init(
			{ warnBeforeClose: true, triedToClose },
			createMockGame(),
		);
		const handler = spy.mock.calls.find(
			c => c[0] === "beforeunload",
		)?.[1] as ((e: Event) => void) | undefined;
		expect(handler).toBeDefined();
		const event = {
			preventDefault: vi.fn(),
			returnValue: false,
		} as unknown as BeforeUnloadEvent;
		handler!(event);
		expect(triedToClose).toHaveBeenCalledTimes(1);
		expect(event.preventDefault).toHaveBeenCalledTimes(1);
		expect(event.returnValue).toBe(true);
	});

	it("does not throw when triedToClose is undefined", () => {
		const spy = vi.spyOn(window, "addEventListener");
		Settings.init(
			{ warnBeforeClose: true, triedToClose: undefined },
			createMockGame(),
		);
		const handler = spy.mock.calls.find(
			c => c[0] === "beforeunload",
		)?.[1] as ((e: Event) => void) | undefined;
		const event = {
			preventDefault: vi.fn(),
			returnValue: false,
		} as unknown as BeforeUnloadEvent;
		expect(() => handler!(event)).not.toThrow();
	});
});

// ==================== init: language ====================

describe("Settings.init language", () => {
	it("derives language from navigator.language, stripping the region", () => {
		vi.spyOn(navigator, "language", "get").mockReturnValue("de-DE");
		Settings.init({}, createMockGame());
		expect(Settings.localStorage.language).toBe("de");
	});

	it("uses the bare language tag when there is no region", () => {
		vi.spyOn(navigator, "language", "get").mockReturnValue("fr");
		Settings.init({}, createMockGame());
		expect(Settings.localStorage.language).toBe("fr");
	});

	it("falls back to 'en' when navigator.language is empty", () => {
		vi.spyOn(navigator, "language", "get").mockReturnValue("");
		Settings.init({}, createMockGame());
		expect(Settings.localStorage.language).toBe("en");
	});
});

// ==================== init: localStorage restore ====================

describe("Settings.init localStorage restore", () => {
	it("merges a stored value over the navigator-derived language", () => {
		vi.spyOn(navigator, "language", "get").mockReturnValue("de-DE");
		localStorage.setItem(
			LOCAL_STORAGE_KEY,
			JSON.stringify({ language: "ja" }),
		);
		Settings.init({}, createMockGame());
		expect(Settings.localStorage.language).toBe("ja");
	});

	it("accepts a stored object with extra keys without throwing", () => {
		localStorage.setItem(
			LOCAL_STORAGE_KEY,
			JSON.stringify({ language: "es", strayKey: 42 }),
		);
		expect(() => Settings.init({}, createMockGame())).not.toThrow();
		expect(Settings.localStorage.language).toBe("es");
	});

	it("logs an error and removes the key when the stored JSON is invalid", () => {
		const err = vi.spyOn(console, "error").mockImplementation(() => {});
		localStorage.setItem(LOCAL_STORAGE_KEY, "not json{");
		Settings.init({}, createMockGame());
		expect(err).toHaveBeenCalledTimes(1);
		expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
	});

	it("keeps the navigator-derived language when localStorage has no entry", () => {
		vi.spyOn(navigator, "language", "get").mockReturnValue("it");
		Settings.init({}, createMockGame());
		expect(Settings.localStorage.language).toBe("it");
	});
});

// ==================== setLocalStorage ====================

describe("Settings.setLocalStorage", () => {
	it("updates the in-memory _localStorage entry", () => {
		Settings.setLocalStorage("language", "pt");
		expect(Settings.localStorage.language).toBe("pt");
	});

	it("persists the entire _localStorage object as JSON under 'gleam'", () => {
		Settings.setLocalStorage("language", "pt");
		const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
		expect(raw).not.toBeNull();
		expect(JSON.parse(raw!)).toEqual({ language: "pt" });
	});

	it("overwrites a previously persisted value", () => {
		Settings.setLocalStorage("language", "pt");
		Settings.setLocalStorage("language", "nl");
		expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!)).toEqual({
			language: "nl",
		});
	});
});
