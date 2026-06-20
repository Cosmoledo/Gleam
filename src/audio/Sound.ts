import AudioBase from "./AudioBase";
import { remove } from "@/utilities/Array";

/** One-shot SFX. Each {@link play} call clones the registered `HTMLAudioElement` so the same sound can overlap itself; {@link stop} cuts every in-flight clone. Inherits registration, enable/disable, and volume from {@link AudioBase}. */
export default class Sound extends AudioBase {
	private currentSounds: HTMLAudioElement[] = [];

	/** Play the registered sound `name` once. Returns a promise that resolves when playback starts (or immediately if `enabled` is `false`) and rejects on autoplay/permission errors. Throws synchronously if no sounds are registered or `name` is unknown. Each call allocates a clone, so concurrent plays of the same name overlap. */
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

	/** Stop and forget every currently-playing clone. Also calls the base-class teardown. */
	public stop(): void {
		super.stop();

		this.currentSounds.forEach(audio => audio.stop());
		this.currentSounds.length = 0;
	}
}
