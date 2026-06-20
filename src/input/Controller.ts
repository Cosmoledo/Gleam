import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";

/** Button indices for the standard gamepad mapping (W3C Gamepad spec). Use as the index into {@link Controller.buttons}. */
export const CONTROLLER_KEYS = {
	/** Bottom face button — `A` on Xbox, `×` on PlayStation. */
	A: 0,
	/** Right face button — `B` on Xbox, `○` on PlayStation. */
	B: 1,
	/** Left face button — `X` on Xbox, `□` on PlayStation. */
	X: 2,
	/** Top face button — `Y` on Xbox, `△` on PlayStation. */
	Y: 3,
	/** Left bumper / shoulder. */
	LB: 4,
	/** Right bumper / shoulder. */
	RB: 5,
	/** Left trigger. The digital pressed-state lives here; the analog value is on the underlying `Gamepad.buttons[6].value`. */
	LT: 6,
	/** Right trigger. The digital pressed-state lives here; the analog value is on the underlying `Gamepad.buttons[7].value`. */
	RT: 7,
	/** Back / Select / Share. */
	SELECT: 8,
	/** Start / Options / Menu. */
	START: 9,
	/** Left stick click (L3). */
	LEFT_STICK: 10,
	/** Right stick click (R3). */
	RIGHT_STICK: 11,
	/** D-pad up. */
	UP: 12,
	/** D-pad down. */
	DOWN: 13,
	/** D-pad left. */
	LEFT: 14,
	/** D-pad right. */
	RIGHT: 15,
	/** Guide / Home / PS button. Not exposed by all browsers. */
	GUIDE: 16,
} as const;

const DEADZONE = 0.25;

/**
 * Gamepad input. The first connected gamepad becomes "our" gamepad; later ones are ignored until ours disconnects. Connection / disconnection fires {@link EventSystem} `"inputControllerConnected"` / `"inputControllerDisconnected"`.
 *
 * Poll {@link buttons} (indexed via {@link CONTROLLER_KEYS}) and {@link poll} from your `update`. State is cleared on `window` blur and on disconnect so held buttons / non-neutral sticks don't stay live across focus loss. Visualizing is not the controller's responsibility — see {@link ControllerCursor} for the built-in on-screen visualization, or read {@link poll} directly to drive your own.
 *
 * Logs to `console.error` if the browser doesn't expose the Gamepad API.
 */
export default class Controller {
	/** Pressed-state per button, indexed in the same order as the underlying `Gamepad.buttons`. Index with {@link CONTROLLER_KEYS}. Updated by {@link poll}; empty until the first non-cached poll. */
	public buttons: boolean[] = [];
	private axes: Vec2[] = [];
	private index = -1;
	private lastTime = 0;

	constructor() {
		if (!("getGamepads" in navigator)) {
			console.error("Controller not supported!");
			return;
		}

		window.addEventListener("gamepadconnected", (event: GamepadEvent) => {
			this.index = event.gamepad.index;
			for (let i = 0; i < event.gamepad.axes.length / 2; i++) {
				this.axes.push(new Vec2());
			}
			console.log("Gamepad connected:", event.gamepad.id);
			EventSystem.dispatchEvent(
				"inputControllerConnected",
				event.gamepad,
			);
			this.vibrate();
		});

		window.addEventListener(
			"gamepaddisconnected",
			(event: GamepadEvent) => {
				if (this.index === event.gamepad.index) {
					this.index = -1;
					console.log(
						"Our Gamepad was disconnected:",
						event.gamepad.index,
					);
					this.reset();
					EventSystem.dispatchEvent("inputControllerDisconnected");
				} else {
					console.log(
						"Different Gamepad was disconnected:",
						event.gamepad.index,
					);
				}
			},
		);

		window.addEventListener("blur", () => this.reset(), false);
	}

	/** Read the current gamepad state and return one {@link Vec2} per stick pair with a circular deadzone applied (`0.25` inner radius, output magnitude clamped to `[0, 1]`). The returned array (and each `Vec2` in it) is reused across calls — clone if you need to retain. Also refreshes {@link buttons}. Returns the cached array unchanged when the gamepad timestamp hasn't advanced. */
	public poll(): Vec2[] {
		const gp = this.getGamepad();

		if (!gp || this.lastTime === gp.timestamp) {
			return this.axes;
		}

		this.lastTime = gp.timestamp;

		this.buttons = gp.buttons.map(
			(button: GamepadButton) => button.pressed,
		);

		for (let i = 0; i < this.axes.length; i++) {
			this.axes[i].set(gp.axes[i * 2], gp.axes[i * 2 + 1]);

			const mag = this.axes[i].length();
			if (mag < DEADZONE) {
				this.axes[i].set(0, 0);
			} else {
				this.axes[i].mult(
					(Math.min(1, mag) - DEADZONE) / (1 - DEADZONE) / mag,
				);
			}
		}

		return this.axes;
	}

	/** Clear {@link buttons} and the cached stick axes. Called automatically on `window` blur and on gamepad disconnect. */
	public reset(): void {
		this.buttons.length = 0;
		this.axes.length = 0;
	}

	/** Trigger a 400 ms full-strength dual-rumble pulse. Returns `false` when no gamepad is connected or the pad has no `vibrationActuator`; `true` when the effect was dispatched. */
	public vibrate(): boolean {
		const gp = this.getGamepad();

		if (!gp) {
			return false;
		}

		const vibrator = gp.vibrationActuator;

		if (vibrator) {
			vibrator.playEffect("dual-rumble", {
				duration: 400,
				weakMagnitude: 1.0,
				startDelay: 0,
				strongMagnitude: 1.0,
			});
		}

		return !!vibrator;
	}

	private getGamepad(): Gamepad | null {
		return this.index < 0
			? null
			: (navigator.getGamepads()[this.index] ?? null);
	}
}
