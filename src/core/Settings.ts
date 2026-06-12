import type Game from "./Game";

export type SettingsOverrides = Partial<
	Omit<
		typeof Settings,
		"prototype" | "init" | "setLocalStorage" | "localStorage"
	>
>;

const LOCAL_STORAGE_KEY = "gleam";

export default class Settings {
	public static antialias = false;
	public static autoloop = true;
	public static backgroundColor = "#444";
	public static debug = false;
	public static doNotClear = false;
	public static enableResize = true;
	public static font = "Arial";
	public static fps = 1 / 60;
	public static triedToClose?: () => void;
	public static useClearRect = true;
	public static warnBeforeClose = false;
	private static initialized = false;
	// Only mutated via `setLocalStorage` (typed) and via the localStorage
	// round-trip in `init()` — since `setLocalStorage` is the sole writer of
	// the persisted blob, the parsed payload is trusted to match the schema.
	private static readonly _localStorage = {
		language: "",
	};

	public static get localStorage(): Readonly<typeof Settings._localStorage> {
		return this._localStorage;
	}

	public static init(overrides: SettingsOverrides, game: Game): void {
		if (this.initialized) {
			throw new Error("Settings.init called twice");
		}

		Object.assign(this, overrides);

		// fps from `overrides` can be NaN or Infinity; both pass `<= 0`.
		if (!(Number.isFinite(this.fps) && this.fps > 0)) {
			throw new Error(`Settings.fps must be > 0, got ${this.fps}`);
		}

		if (this.debug) {
			// debug-only devtools hook; kept as `any` so the temporary
			// debug surface doesn't leak into any .d.ts file.
			(window as any).game = game;
		}

		if (this.warnBeforeClose) {
			window.addEventListener(
				"beforeunload",
				(event: BeforeUnloadEvent) => {
					this.triedToClose?.();

					event.preventDefault();
					event.returnValue = true;
					return "Are you sure?";
				},
				false,
			);
		}

		this._localStorage.language = navigator.language.split("-")[0] || "en";

		const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (storage) {
			try {
				const parsed = JSON.parse(storage);
				Object.assign(this._localStorage, parsed);
			} catch (_e) {
				console.error(
					"Couldn't parse local storage! Will be cleaned now.",
					storage,
				);
				localStorage.removeItem(LOCAL_STORAGE_KEY);
			}
		}

		this.initialized = true;
	}

	public static setLocalStorage<K extends keyof typeof this._localStorage>(
		key: K,
		value: (typeof this._localStorage)[K],
	): void {
		this._localStorage[key] = value;

		localStorage.setItem(
			LOCAL_STORAGE_KEY,
			JSON.stringify(this._localStorage),
		);
	}
}
