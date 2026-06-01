import BezierEasing from "bezier-easing";

import AudioBase from "./AudioBase";
import { clamp } from "@/utilities/Number";
import { rafLoop } from "@/utilities/Functions";
import { randomItem, remove } from "@/utilities/Array";

type BezierPoints = readonly [number, number, number, number];

const EASE_IN: BezierPoints = [0.42, 0, 1, 1];
const EASE_OUT: BezierPoints = [0, 0, 0.58, 1];

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
		timingFunctions: {
			cur: BezierPoints;
			next: BezierPoints;
		} = {
			cur: EASE_IN,
			next: EASE_OUT,
		},
	): void {
		if (!this.enabled) {
			return;
		}

		if (fadeTime <= 0) {
			throw new Error(`fadeTime must be > 0, got ${fadeTime}`);
		}

		if (this.songs.size === 0) {
			throw new Error("No songs registered!");
		}

		if (this.fadeCancel) {
			console.warn("Stopping current music fading.");
			this.fadeCancel();
			this.fadeCancel = null;
			this.current?.stop();
			this.current = this.next;
			this.next = null;
		}

		if (name && this.songs.has(name)) {
			this.next = this.songs.get(name)!;
		} else {
			if (name) {
				console.error(
					`Music "${name}" not registered! Playing random one.`,
				);
			}

			this.next = this.getRandom();

			if (!this.next) {
				console.warn(
					"Not enough songs to get random one, playing best possible one.",
				);
				this.next = this.last ?? this.current!;
			}
		}

		this.next.volume = 0;
		this.next.play();

		console.log(`Start fading to music: "${this.next.id}"`);

		if (this.current) {
			this.current.onended = (): void => void 0;
		}

		// Using BezierEasing for smooth volume transitions
		const curBez = BezierEasing(...timingFunctions.cur);
		const nextBez = BezierEasing(...timingFunctions.next);
		const fadeTimeSeconds = fadeTime / 1000;

		let time = 0;
		const curStartVolume = this.current?.volume ?? 0;
		this.fadeCancel = rafLoop(dt => {
			time += dt / fadeTimeSeconds;

			if (this.current) {
				this.current.volume =
					curStartVolume * (1 - clamp(curBez(time), 0, 1));
			}

			this.next!.volume =
				this.next!.defaultVolume! * clamp(nextBez(time), 0, 1);

			if (time >= 1) {
				this.fadeCancel?.();
				this.fadeCancel = null;

				if (this.current) {
					this.current.stop();
					this.current.volume = this.current.defaultVolume!;
				}

				this.next!.volume = this.next!.defaultVolume!;
				this.next!.onended = (): void => {
					this.fade();
				};

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
