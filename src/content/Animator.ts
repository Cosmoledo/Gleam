import Vec2 from "@/math/Vec2";
import { createNewCanvas } from "@/utilities/Canvas";
import { randomBetweenFloat } from "@/utilities/Math";

export interface SpriteAnimation {
	default?: boolean;
	name: string;
	sprites: HTMLCanvasElement[] | HTMLImageElement[];
	timing: number;
}

type onEndType = () => void;
type onFrameType = Record<number, () => void>;

interface BaseEntity {
	pos: Vec2;
	flipX?: number;
}

export default class Animator {
	private static spriteCache = new Map<
		string,
		{ unflipped: HTMLCanvasElement[]; flipped: HTMLCanvasElement[] }
	>();

	/**
	 * Drop cached rendered sprites. Pass a namespace to evict only that prefix; omit to clear all.
	 */
	public static clearSpriteCache(namespace?: string): void {
		if (namespace === undefined) {
			Animator.spriteCache.clear();
			return;
		}

		const prefix = `${namespace}.`;
		for (const key of Animator.spriteCache.keys()) {
			if (key.startsWith(prefix)) {
				Animator.spriteCache.delete(key);
			}
		}
	}

	public active = true;
	public image!: HTMLCanvasElement;
	public imageId = 0;
	public lookLeft = false;
	public onEnd: onEndType | undefined;
	public size: Vec2 = new Vec2();
	private animations: SpriteAnimation[] = [];
	private currentAnimation = 0;
	private entity: BaseEntity;
	private lastPlayed: string | undefined;
	private namespace: string;
	private onFrame?: onFrameType;
	private playVersion = 0;
	private timer = 0;

	public get current(): SpriteAnimation {
		return this.animations[this.currentAnimation];
	}

	/**
	 * We store rendered images in a cache.
	 * So if you have the same entity multiple times, the images get computed once and then shared.
	 * This reduces overhead and frees time up for other important computations.
	 *
	 * `namespace` is the cache key prefix for these rendered images.
	 * So pass a different key for different Animators; otherwise, you will see wrong images.
	 */
	constructor(entity: BaseEntity, namespace: string) {
		this.entity = entity;
		this.namespace = namespace;
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

	public update(dt: number): void {
		if (!this.active) {
			return;
		}

		this.timer += dt;

		if (this.timer <= this.current.timing) {
			return;
		}

		this.timer -= this.current.timing;
		this.imageId++;

		// on animation end / no more sprites
		if (this.imageId >= this.current.sprites.length) {
			const onEnd = this.onEnd;
			this.onEnd = undefined;
			this.onFrame = undefined;
			this.imageId = 0;

			const versionBefore = this.playVersion;
			onEnd?.();
			if (this.playVersion !== versionBefore) {
				return;
			}

			if (this.lastPlayed) {
				this.play(this.lastPlayed);
				this.lastPlayed = undefined;
				return;
			}

			if (this.current.sprites.length === 1) {
				this.active = false;
				return;
			}
		}

		if (this.onFrame?.[this.imageId]) {
			const cb = this.onFrame[this.imageId];
			delete this.onFrame[this.imageId];

			const versionBefore = this.playVersion;
			cb();
			if (this.playVersion !== versionBefore) {
				return;
			}
		}

		if (this.active) {
			this.setImage();
		}
	}

	public add(
		name: string,
		sprites: HTMLCanvasElement[] | HTMLImageElement[],
		timing: number,
		defaultAnim = false,
	): void {
		if (
			defaultAnim &&
			this.animations.some((anim: SpriteAnimation) => anim.default)
		) {
			console.error("Only one default animation allowed!");
		}

		if (
			this.animations.some((anim: SpriteAnimation) => anim.name === name)
		) {
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

	public addAnimation(anim: SpriteAnimation, defaultAnim = false): void {
		this.add(
			anim.name,
			anim.sprites,
			anim.timing,
			anim.default || defaultAnim,
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

	public play(name: string, onEnd?: onEndType, onFrame?: onFrameType): void {
		const index = this.animations.findIndex(
			(anim: SpriteAnimation) => anim.name === name,
		);

		if (index < 0) {
			throw new Error(`Animator.play: animation "${name}" not found`);
		}

		this.playVersion++;
		const myVersion = this.playVersion;

		this.imageId = 0;
		this.timer = 0;
		this.currentAnimation = index;
		this.setImage();

		const prevOnEnd = this.onEnd;
		this.onEnd = onEnd;
		this.onFrame = onFrame;
		prevOnEnd?.();

		if (this.playVersion !== myVersion) {
			return;
		}

		this.active = true;
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

	/**
	 * Play `name` once, then return to the previously-playing animation. Calling with the currently-playing name re-loops it indefinitely (lastPlayed restores to itself).
	 */
	public playOnce(
		name: string,
		onEnd?: onEndType,
		onFrame?: onFrameType,
	): void {
		this.lastPlayed = this.current?.name;
		this.play(name, onEnd, onFrame);
	}

	public randomTimer(): void {
		this.timer = randomBetweenFloat(0, this.current.timing);
	}

	public removeAllAnimations(): void {
		this.animations.length = 0;
		this.active = true;
		this.onEnd = undefined;
		this.onFrame = undefined;
		Animator.clearSpriteCache(this.namespace);
	}

	public reset(): void {
		const defaultAnim = this.animations.find(
			(anim: SpriteAnimation) => anim.default,
		);

		if (defaultAnim) {
			this.play(defaultAnim.name);
			this.active = true;
		} else {
			this.active = false;
		}
	}

	public isPlaying(name: string): boolean {
		return this.current && this.current.name === name;
	}

	/**
	 * Update `image` and `size` from the current sprite. Assumes uniform sprite size within an animation. Caches rendered canvases per (animation, frame, lookLeft) — if you mutate `entity.flipX` after first render, call `removeAllAnimations()` or recreate the Animator to invalidate.
	 */
	protected setImage(): void {
		const animation = this.current;
		const sprite = animation.sprites[this.imageId];
		this.size.set(sprite.width, sprite.height);

		if (this.entity.flipX === undefined) {
			this.entity.flipX = this.size.x;
		}

		const key = `${this.namespace}.${animation.name}`;
		let cache = Animator.spriteCache.get(key);
		if (!cache) {
			cache = { unflipped: [], flipped: [] };
			Animator.spriteCache.set(key, cache);
		}

		const bucket = this.lookLeft ? cache.flipped : cache.unflipped;

		if (!bucket[this.imageId]) {
			const cc = createNewCanvas(this.size.x * 2, this.size.y);
			cc.context.translate(
				this.size.x + (this.lookLeft ? this.entity.flipX : 0),
				0,
			);
			if (this.lookLeft) {
				cc.context.scale(-1, 1);
			}
			cc.context.drawImage(sprite, 0, 0);
			bucket[this.imageId] = cc.canvas;
		}

		this.image = bucket[this.imageId];
	}
}
