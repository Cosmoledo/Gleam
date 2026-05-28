import Audio from "./Audio";
import { remove } from "@/utilities/Array";

export default class Sound extends Audio {
	private currentSounds: HTMLAudioElement[] = [];

	public play(name: string): void {
		if (!this.enabled) {
			return;
		}

		if (!this.songs.has(name)) {
			console.error(`Song "${name}" not registered!`);
			return;
		}

		const newSound = this.songs.get(name)!.clone();
		this.currentSounds.push(newSound);
		newSound.onended = (): void => {
			remove(this.currentSounds, newSound);
		};
		newSound.play();
	}

	public stop(): void {
		super.stop();

		this.currentSounds.forEach(audio => audio.stop());
		this.currentSounds.length = 0;
	}
}
