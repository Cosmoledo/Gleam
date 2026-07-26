// Pointer demo — the two ways to read input, side by side:
//
//   POLL  - from update(), read the latest state on a frame boundary:
//           this.pointer.posScaled (canvas-space, clamped) and
//           this.pointer.isActive(button). Used here to hit-test a target
//           box, recolor it on hover, and label it with the held buttons.
//   EVENT - subscribe to the EventSystem. "inputPointer" fires on every
//           move and button transition (payload is the Pointer);
//           "inputKeyboard" fires on every key up/down (payload is the
//           live keys map + the native KeyboardEvent). Used here to
//           spawn shapes at the pointer: hold left/right to paint a
//           trail of circles/squares, or tap Space to drop exactly one.
import {
	Game,
	CANVAS_TYPES,
	EventSystem,
	POINTER_KEYS,
	Rect,
	KEYBOARD_KEYS,
	Color,
	randomBetweenInt,
} from "@cosmoledo/gleam";

// A spawned circle that fades out over its lifetime.
class Blip {
	static LIFETIME = 2500; // ms

	/**
	 * @param {number} x canvas-space
	 * @param {number} y canvas-space
	 * @param {number} bornTime gameloop.levelTime (ms) at spawn
	 * @param {string} color
	 * @param {"circle" | "rect"} form
	 */
	constructor(x, y, bornTime, color, form) {
		this.x = x;
		this.y = y;
		this.bornAt = bornTime;
		this.color = color;
		this.form = form;
	}

	/** 1 at birth → 0 at death. @param {number} now levelTime (ms) */
	life(now) {
		return 1 - (now - this.bornAt) / Blip.LIFETIME;
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} levelTime
	 */
	draw(ctx, levelTime) {
		const alpha = this.life(levelTime);
		if (alpha <= 0) {
			return;
		}

		ctx.globalAlpha = alpha;
		ctx.fillStyle = this.color;

		if (this.form === "circle") {
			ctx.drawCircle(this, 14, "fill");
		} else {
			ctx.drawRect(this.x - 14, this.y - 14, 14 * 2, 14 * 2, "fill");
		}
	}
}

// Subclass Game and the engine gives us this.canman (CanvasManager),
// this.keyboard, this.pointer, and this.gameloop for free.
class PointerDemo extends Game {
	/** The poll-mode hit-test target. @type {Rect} */
	#rect;
	/** Recomputed each frame from the polled pointer state. */
	#insideRect = false;
	/** Event-spawned circles. @type {Blip[]} */
	#blips = [];

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

	async init() {
		// Poll target: a box in the upper half of the canvas.
		this.#rect = new Rect(this.canman.width / 2 - 90, 60, 180, 90);

		// --- EVENT mode -------------------------------------------------
		// "inputPointer" fires on move and on every button transition. The
		// payload IS the Pointer, so read pressed/posScaled straight off it.
		// This spawns on every event while a button is held — left paints
		// circles, right paints squares — so a click drops one shape and
		// holding + dragging paints a trail. (In contrast to the keyboard
		// handler below, which spawns exactly one per press.)
		EventSystem.addEventListener("inputPointer", pointer => {
			const left = pointer.isActive(POINTER_KEYS.LEFT);

			if (left || pointer.isActive(POINTER_KEYS.RIGHT)) {
				this.#spawn(
					pointer.posScaled.x,
					pointer.posScaled.y,
					left ? "circle" : "rect",
				);
			}
		});

		// "inputKeyboard" fires on every key up/down: (keys, event). While
		// Space is held, preventDefault() stops the page scrolling; the
		// !repeat guard then spawns exactly one circle per physical press
		// (not once per OS auto-repeat tick).
		EventSystem.addEventListener("inputKeyboard", (keys, event) => {
			if (keys[KEYBOARD_KEYS.KEY_SPACE]) {
				event.preventDefault();

				if (!event.repeat) {
					this.#spawn(
						this.pointer.posScaled.x,
						this.pointer.posScaled.y,
						"circle",
					);
				}
			}
		});
	}

	update() {
		// --- POLL mode --------------------------------------------------
		// Read the latest pointer state on the frame boundary and hit-test
		// the target box. collidePoint takes any {x, y} — posScaled is a Vec2.
		this.#insideRect = this.#rect.collidePoint(this.pointer.posScaled);

		// Drop fully-faded circles.
		this.#blips = this.#blips.filter(
			blip => blip.life(this.gameloop.levelTime) > 0,
		);
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		// Set the font up front: both #drawBox's button label and the hints
		// below draw text, so it must be set before the first writeText.
		ctx.font = "13px system-ui, sans-serif";

		// Event-spawned circles, fading over their lifetime.
		this.#blips.forEach(blip => {
			blip.draw(ctx, this.gameloop.levelTime);
		});
		ctx.globalAlpha = 1;

		this.#drawBox(ctx);

		// Crosshair at pointer position.
		ctx.strokeStyle = "#e8e8ea";
		ctx.drawCircle(this.pointer.posScaled, 16, "stroke");

		// Hints.
		ctx.fillStyle = "#8a8a93";
		ctx.writeText(
			"interact with the box, press pointer buttons",
			this.canman.width / 2,
			30,
		);
		ctx.writeText(
			"event: drag left/right to paint circles/squares, or Space to drop one",
			this.canman.width / 2,
			this.canman.height - 24,
		);
	}

	/**
	 * @param {number} x canvas-space
	 * @param {number} y canvas-space
	 * @param {"circle" | "rect"} form
	 */
	#spawn(x, y, form) {
		// Random hue, fixed high saturation, lightness kept in [40, 100] —
		// always vivid and readable on the dark background (randomHex can
		// land near-black).
		this.#blips.push(
			new Blip(
				x,
				y,
				this.gameloop.levelTime,
				Color.fromHSL(
					randomBetweenInt(0, 360),
					80,
					randomBetweenInt(40, 100),
				).toHex(),
				form,
			),
		);
	}

	/** @param {CanvasRenderingContext2D} ctx */
	#drawBox(ctx) {
		// Tint the target: green while the pointer is inside, red while
		// outside (translucent fill, opaque stroke).
		const { x, y, w, h } = this.#rect;
		ctx.fillStyle = this.#insideRect ? "#00ff0052" : "#ff000052";
		ctx.strokeStyle = this.#insideRect ? "#00ff00" : "#ff0000";
		ctx.lineWidth = 2;
		ctx.fillRect(x, y, w, h);
		ctx.strokeRect(x, y, w, h);
		ctx.lineWidth = 1;

		// Label the box with the names of the currently held buttons,
		// flipping the text color against the fill for contrast (red on the
		// green inside-fill, green on the red outside-fill).
		ctx.fillStyle = !this.#insideRect ? "#00ff00" : "#ff0000";
		ctx.writeText(
			Object.entries(POINTER_KEYS)
				.map(([name, button]) =>
					this.pointer.isActive(button) ? name : null,
				)
				.filter(Boolean)
				.join(" "),
			x + w / 2,
			y + h / 2 + 5,
		);
	}
}

/**
 * @param {(desc: string) => void} setDesc
 */
export function init(setDesc) {
	setDesc("poll to hover &middot; drag or Space to spawn (event)");

	// Constructing the Game starts everything (constructor -> preInit
	// -> init -> loop).
	new PointerDemo();
}
