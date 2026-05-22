import { EVENT_NAMES } from "@/core/Constants";
import { map, threshold } from "@/utilities/Number";
import ControllerCursor from "./ControllerCursor";
import Game from "@/core/Game";
import Vec2 from "@/core/Vec2";

const AXIS_THRESHOLD = 0.3;

export default class Controller {
	public buttons: boolean[] = [];
	public cursors: ControllerCursor[] = [];
	private gamepad: Gamepad | null = null;
	private axes: Vec2[] = [];
	private game: Game;
	private lastTime = 0;

	constructor(game: Game) {
		this.game = game;

		if (!("getGamepads" in navigator)) {
			console.error("Controller not supported!");
			return;
		}

		for (let i = 0; i < 2; i++) {
			this.cursors.push(new ControllerCursor(this, game, i));
		}

		window.addEventListener("gamepadconnected", (event: GamepadEvent) => {
			this.gamepad = event.gamepad;
			console.log("Gamepad connected:", this.gamepad.id);
			this.vibrate();
		});

		window.addEventListener(
			"gamepaddisconnected",
			(event: GamepadEvent) => {
				if (
					this.gamepad &&
					this.gamepad.index === event.gamepad.index
				) {
					this.gamepad = null;
					console.log(
						"Our Gamepad was disconnected:",
						event.gamepad.index,
					);
					this.game.dispatchEvent(
						EVENT_NAMES.CONTROLLER_DISCONNECTED,
					);
				} else {
					console.log(
						"Different Gamepad was disconnected:",
						event.gamepad.index,
					);
				}
			},
		);
	}

	public draw(context: CanvasRenderingContext2D): void {
		if (!this.gamepad) {
			return;
		}

		this.cursors.forEach(cursor => cursor.draw(context));
	}

	public update(dt: number): void {
		this.cursors.forEach(cursor => cursor.update(dt));

		if (!this.gamepad || this.lastTime === this.gamepad.timestamp) {
			return;
		}

		this.lastTime = this.gamepad.timestamp;

		this.buttons = this.gamepad.buttons.map(
			(button: GamepadButton) => button.pressed,
		);

		this.axes.length = 0;
		const axes = this.gamepad.axes;

		for (let i = 0; i + 1 < axes.length; i += 2) {
			this.axes.push(new Vec2(axes[i], axes[i + 1]));
		}

		this.game.dispatchEvent(
			EVENT_NAMES.CONTROLLER,
			this.buttons,
			this.cursors,
		);
	}

	public vibrate(): boolean {
		if (!this.gamepad) {
			return false;
		}

		const vibrator = this.gamepad.vibrationActuator;

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
		if (!this.gamepad || index >= this.axes.length) {
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
}
