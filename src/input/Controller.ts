import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";

export const CONTROLLER_KEYS = {
	A: 0,
	B: 1,
	X: 2,
	Y: 3,
	LB: 4,
	RB: 5,
	LT: 6,
	RT: 7,
	SELECT: 8,
	START: 9,
	LEFT_STICK: 10,
	RIGHT_STICK: 11,
	UP: 12,
	DOWN: 13,
	LEFT: 14,
	RIGHT: 15,
	GUIDE: 16,
} as const;

const DEADZONE = 0.25;

export default class Controller {
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

	public reset(): void {
		this.buttons.length = 0;
		this.axes.length = 0;
	}

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
