import Vec2 from "@/math/Vec2";
import { createNewCanvas } from "@/utilities/Canvas";
import { randomBetweenFloat } from "@/utilities/Math";

/** A named animation: a list of frame sprites and the per-frame `timing` (seconds). */
export interface SpriteAnimation {
	/** Mark this animation as the default — played by {@link Animator.reset} and right after {@link Animator.add} when registered. At most one per Animator. */
	default?: boolean;
	/** Unique identifier. Pass to {@link Animator.play}. */
	name: string;
	/** Frame images in playback order. Uniform size is assumed within a single animation. */
	sprites: HTMLCanvasElement[] | HTMLImageElement[];
	/** Seconds each frame stays visible before advancing. */
	timing: number;
}

/** Fires once after the last frame of an animation plays. Cleared after firing. */
export type onEndType = () => void;
/** Map of `frameIndex → callback`. The callback for a given frame fires once when that frame becomes active, then is removed from the map. */
export type onFrameType = Record<number, () => void>;

/** Minimum shape an entity must satisfy to be animated by {@link Animator}. */
export interface BaseEntity {
	/** Top-left position used as the draw anchor. */
	pos: Vec2;
	/** Optional horizontal anchor offset for flipped frames. Defaults to the current sprite width on first render. */
	flipX?: number;
}

/**
 * Sprite-sheet animator. Hosts a list of named animations (registered via {@link add} / {@link addAnimation}) and drives them per-frame from `update(dt)`. Pre-renders each frame to a 2×-wide cached canvas keyed by `${namespace}.${animationName}` — so multiple entities sharing a `namespace` reuse the same rendered images.
 *
 * Use {@link play} to switch animations, {@link playOnce} for one-shot animations that fall back to the previous one, and {@link Animator.onEnd}/`onFrame` callbacks for frame- or animation-end hooks.
 */
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
		Animator.spriteCache.forEach((_, key) => {
			if (key.startsWith(prefix)) {
				Animator.spriteCache.delete(key);
			}
		});
	}

	/** When `false`, {@link update} is a no-op. Set automatically to `false` after a single-frame animation finishes and via {@link reset} when no default animation exists. */
	public active = true;
	/** Current rendered frame (after flip processing). Pulled from the cache by {@link setImage} every time the frame advances. */
	public image!: HTMLCanvasElement;
	/** Index of the current frame within the current animation's `sprites` array. */
	public imageId = 0;
	/** Flip the rendered sprite horizontally. Caches a separate "flipped" bucket so toggling is cheap. */
	public lookLeft = false;
	/** One-shot callback that fires when the current animation's last frame finishes. Cleared after firing. */
	public onEnd: onEndType | undefined;
	/** Current sprite's `(width, height)`. Updated by {@link setImage}. */
	public size: Vec2 = new Vec2();
	private animations: SpriteAnimation[] = [];
	private currentAnimation = 0;
	private entity: BaseEntity;
	private lastPlayed: string | undefined;
	private namespace: string;
	private onFrame?: onFrameType;
	private playVersion = 0;
	private timer = 0;

	/** The currently-playing animation. `undefined` if no animations have been added yet. */
	public get current(): SpriteAnimation {
		return this.animations[this.currentAnimation];
	}

	/**
	 * Bind to `entity` and stamp `namespace` as the prefix for cache keys (`${namespace}.${animationName}`). **Use distinct namespaces for animators whose sprite sets differ** — sharing a namespace across mismatched sprite sets serves the wrong cached frames.
	 */
	constructor(entity: BaseEntity, namespace: string) {
		this.entity = entity;
		this.namespace = namespace;
	}

	/** Blit the current cached frame at `entity.pos + offset`, shifted left by `size.x` to compensate for the 2×-wide cache canvas. */
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

	/** Advance the timer; when it crosses `current.timing`, step to the next frame, fire any `onFrame[index]` callback, and on rollover fire `onEnd` and queue `lastPlayed` (set by {@link playOnce}). No-op when {@link active} is `false`. */
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

	/** Register a new animation. Logs an error (but still registers) if `defaultAnim` is true while another default already exists, or if `name` collides with an existing animation. Auto-plays the new animation when `defaultAnim` is `true`. */
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

	/** Convenience wrapper around {@link add} that takes a packed {@link SpriteAnimation}. `defaultAnim` is OR'd with `anim.default`. */
	public addAnimation(anim: SpriteAnimation, defaultAnim = false): void {
		this.add(
			anim.name,
			anim.sprites,
			anim.timing,
			anim.default || defaultAnim,
		);
	}

	/** Draw the current frame rotated by `angle` radians around a sprite-relative pivot (75% width, 50% height). Uses `setTransform` and resets the transform on exit. */
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

	/** Switch to the named animation, rewinding timer and frame index. Optionally register `onEnd` (fires after the last frame) and `onFrame` (frame-indexed callbacks). Any previous {@link Animator.onEnd} fires before the new one is set. Throws if `name` isn't registered. */
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

	/** {@link play} only if `name` isn't already the current animation. Returns `true` if it started a new playback, `false` if it was already playing. */
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

	/** Queue an animation to play once the current one finishes. Pass `undefined` to cancel the queue. Used internally by {@link playOnce}. */
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

	/** Randomize the frame timer to a value in `[0, current.timing)`. Useful when spawning many instances of the same animation to break phase lockstep. */
	public randomTimer(): void {
		this.timer = randomBetweenFloat(0, this.current.timing);
	}

	/** Drop every registered animation and clear this instance's cached frames. {@link active} resets to `true`; pending callbacks are cleared. */
	public removeAllAnimations(): void {
		this.animations.length = 0;
		this.active = true;
		this.onEnd = undefined;
		this.onFrame = undefined;
		Animator.clearSpriteCache(this.namespace);
	}

	/** Switch back to the default animation if one was registered (marked via `defaultAnim`); otherwise just stop animating ({@link active} = `false`). */
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

	/** `true` when `name` matches the currently-playing animation. */
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
