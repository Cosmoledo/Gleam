import EventSystem from "@/core/EventSystem";
import { urlBasename } from "@/utilities/Functions";

export interface RegisterData {
	path: string;
	name: string;
	volume?: number;
}

const MEDIA_ERROR_CODES: Record<number, string> = {
	1: "ABORTED",
	2: "NETWORK",
	3: "DECODE",
	4: "SRC_NOT_SUPPORTED",
};

export default abstract class AudioBase {
	protected songs: Map<string, HTMLAudioElement> = new Map();
	private _enabled: boolean;
	private registered: boolean = false;

	public get enabled(): boolean {
		return this._enabled;
	}

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

	public register(
		defaultVolume: number = 1,
		...songs: (RegisterData | string)[]
	): void {
		if (this.registered) {
			throw new Error("register() can only be called once per instance");
		}
		this.registered = true;

		songs.forEach(song => {
			if (typeof song === "string") {
				song = { name: urlBasename(song) ?? song, path: song };
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

	public stop(): void {
		void 0;
	}
}
