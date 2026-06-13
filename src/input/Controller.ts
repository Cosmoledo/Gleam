import ControllerCursor from "./ControllerCursor";
import EventSystem from "@/core/EventSystem";
import Vec2 from "@/math/Vec2";
import type Game from "@/core/Game";
import { map, threshold } from "@/utilities/Number";

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

const AXIS_THRESHOLD = 0.3;

export default class Controller {
	public buttons: boolean[] = [];
	public cursors: ControllerCursor[] = [];
	private index = -1;
	private axes: Vec2[] = [];
	private lastTime = 0;

	constructor(game: Game) {
		if (!("getGamepads" in navigator)) {
			console.error("Controller not supported!");
			return;
		}

		for (let i = 0; i < 2; i++) {
			this.cursors.push(new ControllerCursor(this, game, i));
		}

		window.addEventListener("gamepadconnected", (event: GamepadEvent) => {
			this.index = event.gamepad.index;
			console.log("Gamepad connected:", event.gamepad.id);
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

	public draw(context: CanvasRenderingContext2D): void {
		if (this.index < 0) {
			return;
		}

		this.cursors.forEach(cursor => cursor.draw(context));
	}

	public update(dt: number): void {
		this.cursors.forEach(cursor => cursor.update(dt));

		const gp = this.getGamepad();

		if (!gp || this.lastTime === gp.timestamp) {
			return;
		}

		this.lastTime = gp.timestamp;

		this.buttons = gp.buttons.map(
			(button: GamepadButton) => button.pressed,
		);

		this.axes.length = 0;
		const axes = gp.axes;

		for (let i = 0; i + 1 < axes.length; i += 2) {
			this.axes.push(new Vec2(axes[i], axes[i + 1]));
		}

		EventSystem.dispatchEvent(
			"inputControllerConnected",
			this.buttons,
			this.cursors,
		);
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

	public stick(index: number): Vec2 {
		if (this.index < 0 || index >= this.axes.length) {
			return new Vec2();
		}

		return this.axes[index]
			.clone()
			.map((value: number) => threshold(value, AXIS_THRESHOLD))
			.map(
				(value: number) =>
					Math.sign(value) *
					map(Math.abs(value), AXIS_THRESHOLD, 1, 0, 1),
			);
	}

	private getGamepad(): Gamepad | null {
		return this.index < 0
			? null
			: (navigator.getGamepads()[this.index] ?? null);
	}
}
