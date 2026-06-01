import EventSystem from "@/core/EventSystem";
import { urlBasename } from "@/utilities/Functions";

export interface RegisterData {
	path: string;
	name: string;
	volume?: number;
}

export default abstract class AudioBase {
	protected songs: Map<string, HTMLAudioElement> = new Map();
	private _enabled: boolean;

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
		songs.forEach(song => {
			if (typeof song === "string") {
				song = { name: urlBasename(song) ?? song, path: song };
			}

			const audio = new window.Audio();

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
