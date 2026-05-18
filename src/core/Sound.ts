import { clamp } from "@/utilities/Number";
import { randomItem } from "@/utilities/Functions";
import { remove } from "@/utilities/Array";
import BezierEasing from "bezier-easing";

export interface RawRegisterData {
	data: string;
	name: string;
}

export default class Sound {
	public registerVolume = 1;
	private allSounds: HTMLAudioElement[] = [];
	private currentMusic = "";
	private lastMusic = "";
	private enabled: boolean;
	private music: Map<string, HTMLAudioElement> = new Map();
	private sounds: Map<string, HTMLAudioElement> = new Map();
	private useSupDir: boolean;

	constructor(useSupDir = true, enabled = true) {
		this.useSupDir = useSupDir;
		this.enabled = enabled;
	}

	public pause(): void {
		if (this.music.has(this.currentMusic)) {
			this.music.get(this.currentMusic)!.pause();
		}
		this.allSounds.forEach(audio => audio.pause());
		this.currentMusic = "";
		this.allSounds.length = 0;
	}

	public disable(): void {
		this.enabled = false;
		this.pause();
	}

	public enable(): void {
		this.enabled = true;
		if (!this.isPlayingMusic()) {
			this.fadeMusic();
		}
	}

	public switchEnable(): void {
		if (this.enabled) {
			this.disable();
		} else {
			this.enable();
		}
	}

	public playSound(name: string): void {
		if (!this.enabled) {
			return;
		}

		if (this.sounds.has(name)) {
			const newSound = this.sounds.get(name)!.clone();
			this.allSounds.push(newSound);
			newSound.play();
		} else {
			console.error("Can't play '" + name + "'");
		}
	}

	public fadeMusic(
		name: string = "",
		fadeTime: number = 1000,
		timingFunctions: {
			cur: [number, number, number, number];
			next: [number, number, number, number];
		} = {
			cur: [0.42, 0, 1, 1],
			next: [0, 0, 0.58, 1],
		},
	): void {
		if (!this.enabled) {
			return;
		}

		if (!name) {
			name = this.getRandomMusic()!;
			if (!name) {
				return;
			}
		}

		const cur = this.music.get(this.currentMusic);
		if (cur) {
			cur.onended = () => void 0;
		}
		const next = this.music.get(name)!;

		next.volume = 0;
		this.currentMusic = "";
		this.playMusic(name);

		// Using BezierEasing for smooth volume transitions
		const curBez = BezierEasing(...timingFunctions.cur);
		const nextBez = BezierEasing(...timingFunctions.next);

		let time = 0;
		let lastTime = 0;
		const start = performance.now();
		const myLopper = (fullTime = 0): void => {
			fullTime = Math.max(0, fullTime - start);
			time += (fullTime - lastTime) / fadeTime;
			lastTime = fullTime;

			if (cur) {
				cur.volume =
					this.registerVolume -
					this.registerVolume * clamp(curBez(time), 0, 1);
			}
			next.volume = this.registerVolume * clamp(nextBez(time), 0, 1);

			if (time < 1) {
				requestAnimationFrame(myLopper);
			} else if (cur) {
				cur.stop();
			}
		};

		requestAnimationFrame(myLopper);
	}

	public isPlayingMusic(): boolean {
		return this.currentMusic.length > 0;
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	public registerMusic(...names: RawRegisterData[] | string[]): void {
		this.register("music", ...names);
	}

	public registerSound(...names: RawRegisterData[] | string[]): void {
		this.register("sound", ...names);
	}

	private getRandomMusic(): string | null {
		const allMusic: string[] = Array.from(this.music.keys());
		if (this.lastMusic) {
			remove(allMusic, this.lastMusic);
		}
		if (this.currentMusic) {
			remove(allMusic, this.currentMusic);
		}
		const name = randomItem(allMusic);

		return name && name.length > 0 ? name : null;
	}

	private register(
		instance: string,
		...songs: RawRegisterData[] | string[]
	): void {
		songs.forEach(song => {
			if (typeof song === "string") {
				song = {
					name: song,
					data: `./assets/${
						this.useSupDir ? instance + "/" : ""
					}${song}.mp3`,
				};
			}

			const audio = new Audio();

			audio.preload = "auto";
			audio.src = song.data;

			if (instance === "music") {
				audio.volume = this.registerVolume;
				this.music.set(song.name, audio);
			} else {
				audio.volume = this.registerVolume * 0.8;
				this.sounds.set(song.name, audio);
			}

			audio.defaultVolume = audio.volume;
		});
	}

	private playMusic(name: string): void {
		this.currentMusic = name;
		this.music
			.get(name)!
			.play()
			.then(() => {
				console.log("Playing music: '" + name + "'");

				this.music.get(name)!.onended = (): void => {
					this.lastMusic = this.currentMusic;
					this.currentMusic = "";
					this.fadeMusic();
				};
			});
	}
}
