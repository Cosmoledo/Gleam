import type Game from "./Game";

/** Subset of writable Settings fields that {@link Settings.init} accepts (everything except the methods and persisted-storage view). Pass to `super()` when subclassing {@link Game}. */
export type SettingsOverrides = Partial<
	Omit<
		typeof Settings,
		"prototype" | "init" | "setLocalStorage" | "localStorage"
	>
>;

const LOCAL_STORAGE_KEY = "gleam";

/** Engine-wide configuration. A static-class singleton — read/write top-level fields directly (`Settings.fps = 1 / 30`). Initialised once via {@link init} from `Game`'s constructor; calling `init` twice throws. */
export default class Settings {
	/** Enable smoothing on the main canvas context. Default `false` for crisp pixel art. */
	public static antialias = false;
	/** Start the gameloop automatically after `init()` resolves. Disable to drive `gameloop.startLoop()` manually. Default `true`. */
	public static autoloop = true;
	/** CSS color used when {@link useClearRect} is `false`. Default `"#444"`. */
	public static backgroundColor = "#444";
	/** Debug mode: assigns the `Game` instance to `window.game` and lets {@link Keyboard} Escape stop the loop. Default `false`. */
	public static debug = false;
	/** Skip the per-frame canvas clear. Use for trail/decay effects where you manage clearing yourself. Default `false`. */
	public static doNotClear = false;
	/** Stretch the main canvas to fill the window on resize while preserving its aspect ratio. Default `true`. */
	public static enableResize = true;
	/** Default font family for `canman.setFontSize`. Default `"Arial"`. */
	public static font = "Arial";
	/** **Seconds per fixed step**, not frames per second — `1 / 60` = 60 Hz, `1 / 30` = 30 Hz. Must be finite and `> 0` or {@link init} throws. */
	public static fps = 1 / 60;
	/** Callback invoked from the `beforeunload` handler when {@link warnBeforeClose} is `true`. Useful for "are you sure?" autosave logic. */
	public static triedToClose?: () => void;
	/** Clear the canvas with `clearRect` (transparent) when `true`, or `fillRect` with {@link backgroundColor} when `false`. Default `true`. */
	public static useClearRect = true;
	/** Show a browser "are you sure?" dialog on tab close. Required for {@link triedToClose} to fire. Default `false`. */
	public static warnBeforeClose = false;
	private static initialized = false;
	// Only mutated via `setLocalStorage` (typed) and via the localStorage
	// round-trip in `init()` — since `setLocalStorage` is the sole writer of
	// the persisted blob, the parsed payload is trusted to match the schema.
	private static readonly _localStorage = {
		language: "",
	};

	/** Read-only view of the persisted localStorage blob. Writes go through {@link setLocalStorage}. */
	public static get localStorage(): Readonly<typeof Settings._localStorage> {
		return this._localStorage;
	}

	/** One-time setup — called by `Game`'s constructor with the overrides passed to `super()`. Validates {@link fps}, loads the persisted localStorage blob, derives `language` from `navigator.language`, and wires the close-warning handler if {@link warnBeforeClose}. Throws if called twice or if `fps` isn't a finite positive number. */
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
			// debug-only devtools hook; local cast keeps `game` off the
			// global `Window` interface so it doesn't leak into any .d.ts file.
			(window as Window & { game?: Game }).game = game;
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

	/** Typed setter for the persisted localStorage blob. Writes both in-memory and to actual `localStorage` (under a single JSON key — `"gleam"`). The only supported way to mutate persisted state. */
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
