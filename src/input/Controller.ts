import { EVENT_NAMES } from "@/core/Constants";
import { map, threshold } from "@/utilities/Number";
import ControllerCursor from "./ControllerCursor";
import Game from "@/core/Game";
import Vec2 from "@/core/Vec2";

const AXIS_THRESHOLD = 0.3;

export default class Controller {
	public id = -1;
	public buttons: boolean[] = [];
	public cursors: ControllerCursor[] = [];
	private axes: Vec2[] = [];
	private hasSupport: boolean = "getGamepads" in navigator;
	private lastTime = 0;
	private game: Game;

	constructor(game: Game) {
		this.game = game;

		if (!this.hasSupport) {
			console.error("Controller not supported!");
			return;
		}

		for (let i = 0; i < 2; i++) {
			this.cursors.push(new ControllerCursor(this, game, i));
		}

		const connected = "gamepadconnected";
		window.addEventListener(connected, (event: GamepadEvent) => {
			this.id = event.gamepad.index;
			console.log("Gamepad connected:", this.id);
			this.vibrate();
		});

		const disconnected = "gamepaddisconnected";
		window.addEventListener(disconnected, (event: GamepadEvent) => {
			console.log("Gamepad disconnected:", event.gamepad.index);

			if (this.id === event.gamepad.index) {
				this.id = -1;
			}
		});
	}

	public update(dt: number): void {
		if (this.id < 0) {
			return;
		}

		this.cursors.forEach(cursor => cursor.update(dt));

		const gp = this.getGamepad();

		if (!gp || !gp.connected || this.lastTime === gp.timestamp) {
			return;
		}

		this.lastTime = gp.timestamp;

		this.buttons = gp.buttons.map(
			(button: GamepadButton) => button.pressed,
		);

		this.axes.length = 0;
		const axes = gp.axes.slice(0);

		for (let i = axes.length - 1; i >= 0; i--) {
			if (axes[i] === 0) {
				axes.splice(i, 1);
			}
		}

		for (let i = 0; i < axes.length; i += 2) {
			this.axes.push(new Vec2(axes[i], axes[i + 1]));
		}

		this.game.dispatchEvent(EVENT_NAMES.CONTROLLER, this);
	}

	public draw(context: CanvasRenderingContext2D): void {
		if (this.id < 0) {
			return;
		}

		this.cursors.forEach(cursor => cursor.draw(context));
	}

	public vibrate(): boolean {
		const vibrator = (this.getGamepad() as any).vibrationActuator;

		if (vibrator) {
			vibrator.playEffect(vibrator.type, {
				duration: 400,
				startDelay: 0,
				strongMagnitude: 1.0,
				weakMagnitude: 1.0,
			});
		}

		return vibrator;
	}

	public stick(index: number): Vec2 {
		if (this.id < 0 || index >= this.axes.length) {
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

	private getGamepad(): Gamepad {
		return (navigator.getGamepads() as Gamepad[])[this.id];
	}
}
