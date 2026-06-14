import AudioBase from "./AudioBase";
import { clamp } from "@/utilities/Number";
import { type EasingName, EASINGS } from "@/utilities/Easing";
import { rafLoop } from "@/utilities/Functions";
import { randomItem, remove } from "@/utilities/Array";

export default class Music extends AudioBase {
	private last: HTMLAudioElement | null = null;
	private current: HTMLAudioElement | null = null;
	private next: HTMLAudioElement | null = null;
	private fadeCancel: (() => void) | null = null;

	public get isPlaying(): boolean {
		return (
			!!this.fadeCancel ||
			(this.current instanceof window.Audio && !this.current.paused)
		);
	}

	public get enabled(): boolean {
		return super.enabled;
	}

	public set enabled(value: boolean) {
		super.enabled = value;

		if (value && !this.isPlaying) {
			this.fade();
		}
	}

	public fade(
		name: string | null = null,
		fadeTime: number = 1000,
		easing: {
			cur: EasingName;
			next: EasingName;
		} = {
			cur: "ease-in",
			next: "ease-out",
		},
	): void {
		if (fadeTime <= 0) {
			throw new Error(`fadeTime must be > 0, got ${fadeTime}`);
		}

		if (this.songs.size === 0) {
			throw new Error("No music registered!");
		}

		if (name && !this.songs.has(name)) {
			throw new Error(`Music "${name}" not registered!`);
		}

		if (!this.enabled) {
			return;
		}

		if (this.fadeCancel) {
			console.warn("Stopping current music fading.");
			this.fadeCancel();
			this.fadeCancel = null;
			this.current?.stop();
			this.current = this.next;
			this.next = null;
		}

		if (this.songs.size === 1) {
			console.info("Only one music registered, playing that looped.");
			this.current = this.songs.values().next().value!;
			this.current.loop = true;
			this.current.play();
			return;
		}

		if (name) {
			this.next = this.songs.get(name)!;
		} else {
			this.next = this.getRandom();

			if (!this.next) {
				console.warn(
					"Not enough songs to pick a fresh one, replaying the previous one.",
				);
				this.next = this.last!;
			}
		}

		this.next.onended = (): void => {
			this.fade();
		};
		this.next.volume = 0;
		this.next.play();

		console.log(`Start fading to music: "${this.next.id}"`);

		if (this.current) {
			this.current.onended = (): void => void 0;
		}

		const curEase = EASINGS[easing.cur];
		const nextEase = EASINGS[easing.next];
		const fadeTimeSeconds = fadeTime / 1000;

		let time = 0;
		const curStartVolume = this.current?.volume ?? 0;
		this.fadeCancel = rafLoop(dt => {
			time += dt / fadeTimeSeconds;

			if (this.current) {
				this.current.volume =
					curStartVolume * (1 - clamp(curEase(time), 0, 1));
			}

			this.next!.volume =
				this.next!.defaultVolume! * clamp(nextEase(time), 0, 1);

			if (time >= 1) {
				this.fadeCancel?.();
				this.fadeCancel = null;

				if (this.current) {
					this.current.stop();
					this.current.volume = this.current.defaultVolume!;
				}

				this.next!.volume = this.next!.defaultVolume!;

				this.last = this.current;
				this.current = this.next;
				this.next = null;
			}
		});
	}

	public stop(): void {
		super.stop();

		this.fadeCancel?.();
		this.fadeCancel = null;

		this.current?.stop();
		this.next?.stop();

		this.last = this.current;
		this.current = this.next;
		this.next = null;
	}

	private getRandom(): HTMLAudioElement | null {
		const allSongs = Array.from(this.songs.values());

		if (this.last) {
			remove(allSongs, this.last);
		}

		if (this.current) {
			remove(allSongs, this.current);
		}

		if (allSongs.length === 0) {
			return null;
		}

		return randomItem(allSongs);
	}
}
