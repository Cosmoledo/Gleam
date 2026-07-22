// Minimal Gleam demo:
//   Game           - abstract base; subclass and override init/update/draw
//   CANVAS_TYPES   - canvas role symbols (MAIN, BACKGROUND, ...)
//   SHAKE_TYPES    - built-in shake recipes (NORMAL, FAST)
//   Screenshake    - CSS-based screen shake effect
import { Game, CANVAS_TYPES, SHAKE_TYPES, Screenshake } from "@cosmoledo/gleam";

// Subclass Game and the engine gives us this.canman (CanvasManager),
// this.keyboard, this.pointer, and this.gameloop for free.
class ScreenshakeDemo extends Game {
	/** @type {Screenshake} */
	#screenshaker;

	constructor() {
		// super() takes SettingsOverrides. enableResize:false keeps
		// the canvas at its declared 640x360; otherwise the lib
		// would stretch it to the window.
		super({
			fps: 1 / 60, // fixed step in SECONDS — 60 Hz
			backgroundColor: "#0e0e10",
			enableResize: false,
		});

		// Register the <canvas id="game"> as the main render target.
		this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");

		// Finish engine wiring, await init(), then start the loop.
		// Always call from the constructor.
		this.preInit();
	}

	// First called after the canvas is ready and the loop is wired up.
	async init() {
		// Create a Screenshake instance targeting the canvas element.
		// Call .shake() to trigger — returns a dispose function
		// for early stop, or null if a shake is already active.
		this.#screenshaker = new Screenshake(this.canman.canvas);

		// Wire up the buttons to trigger shakes.
		document.getElementById("normal")?.addEventListener("click", () => {
			this.#screenshaker.shake(SHAKE_TYPES.NORMAL);
		});

		document.getElementById("fast")?.addEventListener("click", () => {
			this.#screenshaker.shake(SHAKE_TYPES.FAST);
		});
	}

	// Called every frame after the gameloop clears the canvas.
	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		// Draw a simple grid to make the shake more visible.
		ctx.strokeStyle = "#1e1e22";
		ctx.lineWidth = 1;
		const step = 40;
		for (let x = 0; x < this.canman.width; x += step) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, this.canman.height);
			ctx.stroke();
		}
		for (let y = 0; y < this.canman.height; y += step) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(this.canman.width, y);
			ctx.stroke();
		}

		// Center text label.
		ctx.fillStyle = "#8a8a93";
		ctx.textAlign = "center";
		ctx.font = "14px system-ui, sans-serif";
		ctx.fillText(
			"Shake the screen",
			this.canman.width / 2,
			this.canman.height / 2,
		);
	}

	/** @param {number} dt */
	update(dt) {
		void dt;
	}
}

/**
 * @param {(desc: string) => void} setDesc
 * @param {HTMLCanvasElement} canvas
 */
export function init(setDesc, canvas) {
	setDesc("click the buttons to trigger shake");

	const div = document.createElement("div");
	div.classList.add("controls");
	div.innerHTML = `
		<button id="normal">NORMAL shake</button>
		<button id="fast">FAST shake</button>
	`;
	canvas.after(div);

	// Constructing the Game starts everything (constructor -> preInit
	// -> init -> loop).
	new ScreenshakeDemo();
}
