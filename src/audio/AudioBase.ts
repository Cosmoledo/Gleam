import EventSystem from "@/core/EventSystem";
import { urlBasename } from "@/utilities/Functions";

/** Entry shape passed to {@link AudioBase.register}. */
export interface RegisterData {
	/** URL or relative path to the audio file. */
	path: string;
	/** Identifier used by `play(name)` / `fade(name)`. */
	name: string;
	/** Per-song volume override in `[0, 1]`. Falls back to `register`'s `defaultVolume`. */
	volume?: number;
}

const MEDIA_ERROR_CODES: Record<number, string> = {
	1: "ABORTED",
	2: "NETWORK",
	3: "DECODE",
	4: "SRC_NOT_SUPPORTED",
};

/**
 * Shared registration, enable/disable, and teardown machinery for {@link Sound} and {@link Music}. Auto-subscribes to the `"gameloopStopped"` event so playback halts on loop teardown.
 */
export default abstract class AudioBase {
	/** Registered audio elements keyed by name. Subclasses read this; mutate via {@link register}. */
	protected songs: Map<string, HTMLAudioElement> = new Map();
	private _enabled: boolean;
	private registered: boolean = false;

	/** Whether playback is permitted. Setting to `false` invokes {@link stop} immediately. */
	public get enabled(): boolean {
		return this._enabled;
	}

	/** Setting to `false` invokes {@link stop} immediately; subclasses (notably {@link Music}) may re-start playback when flipped back to `true`. */
	public set enabled(value: boolean) {
		this._enabled = value;

		if (!value) {
			this.stop();
		}
	}

	constructor(enabled: boolean = true) {
		this._enabled = enabled;

		EventSystem.addEventListener("gameloopStopped", () => this.stop());
	}

	/** Load and register one or more audio files. Each entry may be a bare URL string (the file's basename becomes the name) or a {@link RegisterData} object. Per-song volume falls back to `defaultVolume`. **Call once per instance** — throws on a second invocation, on non-finite volume, or on volume outside `[0, 1]`. Load failures are logged to `console.error` but don't throw. */
	public register(
		defaultVolume: number = 1,
		...songs: (RegisterData | string)[]
	): void {
		this.throwOnBadVolume(defaultVolume, "defaultVolume");

		if (this.registered) {
			throw new Error("register() can only be called once per instance");
		}
		this.registered = true;

		songs.forEach(song => {
			if (typeof song === "string") {
				song = { name: urlBasename(song) ?? song, path: song };
			} else if (song.volume !== undefined) {
				this.throwOnBadVolume(song.volume, `Volume of "${song.name}"`);
			}

			const audio = new window.Audio();

			audio.addEventListener("error", () => {
				const err = audio.error;
				const reason = err
					? `${MEDIA_ERROR_CODES[err.code] ?? err.code}${err.message ? `: ${err.message}` : ""}`
					: "unknown";
				console.error(
					`Failed to load audio "${song.name}" from "${audio.src}": ${reason}`,
				);
			});

			audio.preload = "auto";
			audio.src = song.path;
			audio.id = song.name;
			audio.volume = song.volume ?? defaultVolume;
			audio.defaultVolume = audio.volume;

			this.songs.set(song.name, audio);
		});
	}

	/** Base hook called when {@link enabled} flips to `false` and on `"gameloopStopped"`. The default is a no-op; {@link Sound} and {@link Music} override it to cut playback. Subclass overrides should call `super.stop()`. */
	public stop(): void {
		void 0;
	}

	private throwOnBadVolume(volume: number, name: string): void {
		if (!Number.isFinite(volume)) {
			throw new Error(
				name + " is invalid, it has to be in range of 0 to 1",
			);
		}

		if (volume < 0) {
			throw new Error(
				name + " has to be above 0. What's a negative volume anyway?",
			);
		}

		if (volume > 1) {
			throw new Error(
				name +
					" has to be lower or equal to 1! If you need a louder volume, you need to update the audio file itself.",
			);
		}
	}
}
