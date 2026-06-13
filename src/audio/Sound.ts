import AudioBase from "./AudioBase";
import { remove } from "@/utilities/Array";

export default class Sound extends AudioBase {
	private currentSounds: HTMLAudioElement[] = [];

	public play(name: string): Promise<void> {
		if (this.songs.size === 0) {
			throw new Error("No sounds registered!");
		}

		if (!this.songs.has(name)) {
			throw new Error(`Sound "${name}" not registered!`);
		}

		if (!this.enabled) {
			return Promise.resolve();
		}

		const newSound = this.songs.get(name)!.clone();
		this.currentSounds.push(newSound);

		const cleanup = (): void => remove(this.currentSounds, newSound);
		newSound.onended = cleanup;
		newSound.onerror = (): void => {
			cleanup();
			console.error(
				`Playback failed for Sound "${name}", reason: ${newSound.error?.message ?? "unknown"}`,
			);
		};

		return newSound.play().catch((err): void => {
			cleanup();
			throw err;
		});
	}

	public stop(): void {
		super.stop();

		this.currentSounds.forEach(audio => audio.stop());
		this.currentSounds.length = 0;
	}
}
