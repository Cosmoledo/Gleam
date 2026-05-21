import { createNewCanvas } from "@/utilities/Canvas";
import { randomBeetweenFloat } from "@/utilities/Math";
import Vec2 from "@/core/Vec2";

export interface Animation {
	default?: boolean;
	name: string;
	sprites: HTMLCanvasElement[] | HTMLImageElement[];
	timing: number;
}

type onEndType = () => void;
type onFrameType = any;

interface BaseEntity {
	pos: Vec2;
	flipX?: number;
}

export default class Animator {
	public active = true;
	public image!: HTMLCanvasElement;
	public size: Vec2 = new Vec2();
	public imageId = 0;
	public lookLeft = false;
	public onEnd: onEndType | undefined;
	private animations: Animation[] = [];
	private currentAnimation = 0;
	private entity: BaseEntity;
	private lastPlayed: string | undefined;
	private onFrame: onFrameType;
	private timer = 0;

	constructor(entity: BaseEntity) {
		this.entity = entity;
	}

	public get current(): Animation {
		return this.animations[this.currentAnimation];
	}

	public draw(
		context: CanvasRenderingContext2D,
		offset: Vec2 = new Vec2(),
	): void {
		context.drawImage(
			this.image,
			this.entity.pos.x + offset.x - this.size.x,
			this.entity.pos.y + offset.y,
		);
	}

	public drawRotated(
		context: CanvasRenderingContext2D,
		angle: number,
		offset: Vec2 = new Vec2(),
	): void {
		const x = this.entity.pos.x + offset.x;
		const y = this.entity.pos.y + offset.y;
		const w = this.image.width * 0.75;
		const h = this.image.height * 0.5;
		context.setTransform(1, 0, 0, 1, x + w - this.size.x, y + h);
		context.rotate(angle);
		context.drawImage(this.image, -w, -h);
		context.setTransform(1, 0, 0, 1, 0, 0);
	}

	public update(dt: number): void {
		if (!this.active) {
			return;
		}

		this.timer += dt;

		if (this.timer > this.current.timing) {
			this.timer = 0;
			this.imageId++;

			if (this.imageId >= this.current.sprites.length) {
				if (this.onEnd) {
					this.onEnd();
					this.onEnd = undefined;
				}

				this.onFrame = undefined;
				this.imageId = 0;

				if (this.lastPlayed) {
					this.play(this.lastPlayed);
					this.lastPlayed = undefined;
					return;
				}
			}

			if (this.onFrame && this.onFrame[this.imageId]) {
				this.onFrame[this.imageId]();
				delete this.onFrame[this.imageId];
			}

			if (this.active) {
				this.setImage();
			}
		}
	}

	public randomTimer(): void {
		this.timer = randomBeetweenFloat(0, this.current.timing);
	}

	public reset(): void {
		const defaultAnim = this.animations.find(
			(anim: Animation) => anim.default,
		);

		if (defaultAnim) {
			this.play(defaultAnim.name);
			this.active = true;
		} else {
			this.active = false;
		}
	}

	public removeAllAnimations(): void {
		this.animations.length = 0;
		this.active = true;
		this.onEnd = undefined;
		this.onFrame = undefined;
	}

	public addAnimation(anim: Animation, defaultAnim = false): void {
		this.add(
			anim.name,
			anim.sprites,
			anim.timing,
			anim.default || defaultAnim,
		);
	}

	public add(
		name: string,
		sprites: HTMLCanvasElement[] | HTMLImageElement[],
		timing: number,
		defaultAnim = false,
	): void {
		if (
			defaultAnim &&
			this.animations.some((anim: Animation) => anim.default)
		) {
			console.error("Only one default animation allowed!");
		}

		if (this.animations.some((anim: Animation) => anim.name === name)) {
			console.error("Duplicate animation name!");
		}

		this.animations.push({
			default: defaultAnim,
			name,
			sprites,
			timing,
		});

		if (defaultAnim) {
			this.play(name);
		}
	}

	public play(name: string, onEnd?: onEndType, onFrame?: onFrameType): void {
		this.imageId = 0;
		this.timer = 0;
		this.currentAnimation = this.animations.findIndex(
			(anim: Animation) => anim.name === name,
		);
		this.setImage();

		if (this.onEnd) {
			this.onEnd();
		}
		this.onFrame = onFrame;

		if (typeof onEnd === "function") {
			this.onEnd = onEnd;
		} else {
			this.onEnd = undefined;
		}

		this.active = this.current.sprites.length > 1;
	}

	public playOnce(
		name: string,
		onEnd?: onEndType,
		onFrame?: onFrameType,
	): void {
		this.lastPlayed = this.current.name;
		this.play(name, onEnd, onFrame);
	}

	public playIfNot(
		name: string,
		onEnd?: onEndType,
		onFrame?: onFrameType,
	): boolean {
		if (!this.isPlaying(name)) {
			this.play(name, onEnd, onFrame);
			return true;
		}
		return false;
	}

	public playNextOnce(name: string | undefined): void {
		this.lastPlayed = name;
	}

	public isPlaying(name: string): boolean {
		return this.current && this.current.name === name;
	}

	protected setImage(): void {
		const image = this.current.sprites[this.imageId];
		this.size.set(image.width, image.height);

		if (!this.entity.flipX) {
			this.entity.flipX = this.size.x;
		}

		const cc = createNewCanvas(this.size.x * 2, this.size.y);
		cc.context.translate(
			this.size.x + (this.lookLeft ? this.entity.flipX : 0),
			0,
		);
		this.lookLeft && cc.context.scale(-1, 1);

		cc.context.drawImage(image, 0, 0);
		this.image = cc.canvas;
	}
}
