// Audio demo. Browsers block audio until the user interacts with the
// page (the "autoplay policy"), so nothing plays on load — every sound
// is triggered from a button click below the canvas.
//
//   Sound - one-shot SFX; each play() overlaps a fresh clone
//   Music - background tracks with eased cross-fades (fade auto-cycles
//           to the next track when the current one ends)
import { Game, CANVAS_TYPES, Sound, Music } from "@cosmoledo/gleam";

// A real spectrum visualizer. Music exposes the playing track via its
// `song` getter, so we tap that HTMLAudioElement into a Web Audio graph
// (MediaElementSource -> AnalyserNode -> destination) and render its live
// FFT. The Game loop samples the analyser and redraws each frame.
class AudioDemo extends Game {
	/** @type {Sound} */
	#sound;
	/** @type {Music} */
	#music;
	/** @type {AudioContext} */
	#audioCtx;
	/** @type {AnalyserNode} */
	#analyser;
	/** @type {Uint8Array<ArrayBuffer>} */
	#freq;
	/** An element can become a MediaElementSource only once — cache the nodes. @type {Map<HTMLAudioElement, MediaElementAudioSourceNode>} */
	#sources = new Map();

	constructor() {
		super({
			fps: 1 / 60,
			useClearRect: false,
			backgroundColor: "#0e0e10",
			enableResize: false,
		});
		this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");
		this.preInit();
	}

	async init() {
		// register() takes a default volume, then any number of clips as
		// { name, path } (or a bare URL). Call it once per instance.
		this.#sound = new Sound();
		this.#sound.register(1, "assets/sfx.mp3");

		// Four tracks: enough for Music's auto-cycle to always pick a
		// fresh one (it avoids repeating the last two).
		this.#music = new Music();
		this.#music.register(
			0.6,
			{ name: "wisdom", path: "assets/A_Brand_New_Wisdom.mp3" },
			{ name: "saying", path: "assets/Just_Saying_Tho.mp3" },
			{ name: "winter", path: "assets/Winter_Dust.mp3" },
			{ name: "swinging", path: "assets/Swinging_Sweet.mp3" },
		);

		// Web Audio graph: track elements feed a shared analyser, which feeds
		// the speakers. It starts suspended (autoplay policy) — a click
		// resumes it; sources are wired lazily in #tap.
		this.#audioCtx = new AudioContext();
		this.#analyser = this.#audioCtx.createAnalyser();
		this.#analyser.fftSize = 64;
		this.#analyser.connect(this.#audioCtx.destination);
		this.#freq = new Uint8Array(this.#analyser.frequencyBinCount);
	}

	update() {
		// No per-frame logic — the loop just needs to keep calling draw().
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		const { width, height } = this.canman;
		// music.song is the live track (correct through auto-cycle). Route it
		// through the analyser so the spectrum reflects whatever's playing.
		const song = this.#music.song;
		if (song) {
			this.#tap(song);
		}

		// real FFT bars — all-zero (flat) while nothing is playing
		this.#analyser.getByteFrequencyData(this.#freq);
		const gap = 4;
		const barW = width / this.#freq.length;
		ctx.fillStyle = "#58c8ff";
		for (let i = 0; i < this.#freq.length; i++) {
			const h = (this.#freq[i] / 255) * height * 0.5;
			ctx.fillRect(i * barW + gap / 2, height * 0.7 - h, barW - gap, h);
		}

		// status line
		ctx.fillStyle = "#e8e8ea";
		ctx.textAlign = "center";
		ctx.font = "18px system-ui, sans-serif";
		ctx.fillText(
			song ? `♪ Playing: ${song.id}` : "click a button to play audio",
			width / 2,
			height * 0.28,
		);

		ctx.fillStyle = "#8a8a93";
		ctx.font = "13px system-ui, sans-serif";
		ctx.fillText(
			song
				? "live spectrum — Web Audio AnalyserNode tapping Music's track"
				: "audio is gated behind a user gesture (autoplay policy)",
			width / 2,
			height * 0.28 + 24,
		);
	}

	playSfx() {
		// play() rejects on autoplay/permission errors; a click satisfies
		// the gesture requirement, so this normally resolves.
		this.#sound.play("sfx").catch(() => {});
	}

	/** @param {string} name cross-fade to this registered track */
	playMusic(name) {
		// the click is our gesture — resume the (autoplay-suspended) context
		this.#audioCtx.resume();
		this.#music.fade(name);
	}

	stopMusic() {
		this.#music.stop();
	}

	/**
	 * Route a track's element through the analyser, once. Creating a
	 * MediaElementSource captures the element into the graph and can only be
	 * done once per element, so cache the node.
	 * @param {HTMLAudioElement} el
	 */
	#tap(el) {
		if (this.#sources.has(el)) {
			return;
		}

		const source = this.#audioCtx.createMediaElementSource(el);
		source.connect(this.#analyser);
		this.#sources.set(el, source);
	}
}

/**
 * @param {(desc: string) => void} setDesc
 * @param {HTMLCanvasElement} canvas
 */
export function init(setDesc, canvas) {
	setDesc("audio is gated behind a click &middot; SFX + cross-faded music");

	const demo = new AudioDemo();

	const tracks = ["wisdom", "saying", "winter", "swinging"];

	const controls = document.createElement("div");
	controls.className = "controls";
	controls.innerHTML =
		`<button id="audio-sfx">Play SFX</button>` +
		tracks
			.map(name => `<button id="audio-${name}">♪ ${name}</button>`)
			.join("") +
		`<button id="audio-stop">Stop music</button>`;
	canvas.after(controls);

	document
		.getElementById("audio-sfx")
		?.addEventListener("click", () => demo.playSfx());
	document
		.getElementById("audio-stop")
		?.addEventListener("click", () => demo.stopMusic());
	tracks.forEach(name =>
		document
			.getElementById(`audio-${name}`)
			?.addEventListener("click", () => demo.playMusic(name)),
	);
}
