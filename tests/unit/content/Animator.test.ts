import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Animator, { type Animation } from "@/content/Animator";
import Vec2 from "@/math/Vec2";

// ==================== Helpers ====================

interface TestEntity {
	pos: Vec2;
	flipX?: number;
}

function makeSprite(w: number = 8, h: number = 8): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	return c;
}

function makeSprites(
	count: number,
	w: number = 8,
	h: number = 8,
): HTMLCanvasElement[] {
	return Array.from({ length: count }, () => makeSprite(w, h));
}

function makeEntity(x: number = 0, y: number = 0): TestEntity {
	return { pos: new Vec2(x, y) };
}

let nsCounter = 0;
function uniqueNamespace(): string {
	nsCounter++;
	return `test-ns-${nsCounter}`;
}

beforeEach(() => {
	Animator.clearSpriteCache();
});

afterEach(() => {
	vi.restoreAllMocks();
});

// ==================== constructor ====================

describe("Animator constructor", () => {
	it("stores the entity and namespace without mutating them", () => {
		const entity = makeEntity(10, 20);
		const a = new Animator(entity, "ns");
		expect(entity.pos.x).toBe(10);
		expect(entity.pos.y).toBe(20);
		expect(entity.flipX).toBeUndefined();
		expect(a.active).toBe(true);
		expect(a.imageId).toBe(0);
		expect(a.lookLeft).toBe(false);
	});

	it("has no current animation until one is added", () => {
		const a = new Animator(makeEntity(), "ns");
		expect(a.current).toBeUndefined();
	});
});

// ==================== add / addAnimation ====================

describe("Animator.add", () => {
	it("registers an animation without playing it when not default", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1);
		// no setImage call → image stays unset
		expect(a.image).toBeUndefined();
	});

	it("plays the new animation when added as default", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		expect(a.current.name).toBe("idle");
		expect(a.current.default).toBe(true);
	});

	it("logs an error when a second default is added", () => {
		const err = vi.spyOn(console, "error").mockImplementation(() => {});
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("walk", makeSprites(2), 0.1, true);
		expect(err).toHaveBeenCalledTimes(1);
	});

	it("logs an error when a duplicate name is added", () => {
		const err = vi.spyOn(console, "error").mockImplementation(() => {});
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1);
		a.add("idle", makeSprites(2), 0.1);
		expect(err).toHaveBeenCalledTimes(1);
	});

	it("becomes inactive when the default animation has only one sprite", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("still", makeSprites(1), 0.1, true);
		expect(a.active).toBe(false);
	});

	it("becomes active when the default animation has more than one sprite", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("walk", makeSprites(3), 0.1, true);
		expect(a.active).toBe(true);
	});
});

describe("Animator.addAnimation", () => {
	it("delegates to add and respects the default flag on the animation object", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		const anim: Animation = {
			default: true,
			name: "spin",
			sprites: makeSprites(2),
			timing: 0.2,
		};
		a.addAnimation(anim);
		expect(a.current.name).toBe("spin");
	});

	it("forwards the defaultAnim argument", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		const anim: Animation = {
			name: "spin",
			sprites: makeSprites(2),
			timing: 0.2,
		};
		a.addAnimation(anim, true);
		expect(a.current.name).toBe("spin");
	});
});

// ==================== play / playIfNot / playOnce / playNextOnce ====================

describe("Animator.play", () => {
	it("throws when the name is not registered", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1);
		expect(() => a.play("missing")).toThrow(
			/animation "missing" not found/,
		);
	});

	it("switches the current animation by name", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1);
		a.add("walk", makeSprites(2), 0.1);
		a.play("walk");
		expect(a.current.name).toBe("walk");
	});

	it("resets imageId and timer when starting an animation", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(3), 0.1, true);
		a.update(0.05);
		a.play("idle");
		expect(a.imageId).toBe(0);
	});

	it("invokes the previous onEnd when interrupted by another play", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("walk", makeSprites(2), 0.1);
		const onEnd = vi.fn();
		a.play("idle", onEnd);
		a.play("walk");
		expect(onEnd).toHaveBeenCalledTimes(1);
	});

	it("sets active=false when the new animation has only one sprite", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("walk", makeSprites(3), 0.1, true);
		a.add("still", makeSprites(1), 0.1);
		a.play("still");
		expect(a.active).toBe(false);
	});

	it("bails out of post-play work if the previous onEnd starts another play", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("a", makeSprites(2), 0.1, true);
		a.add("b", makeSprites(1), 0.1);
		a.add("c", makeSprites(2), 0.1);
		a.play("a", () => a.play("c"));
		// previous onEnd reruns play with "c"; the outer play("b") should not flip active=false
		a.play("b");
		expect(a.current.name).toBe("c");
		expect(a.active).toBe(true);
	});
});

describe("Animator.playIfNot", () => {
	it("plays and returns true when not already playing that name", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("walk", makeSprites(2), 0.1);
		expect(a.playIfNot("walk")).toBe(true);
		expect(a.current.name).toBe("walk");
	});

	it("does nothing and returns false when already playing that name", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		expect(a.playIfNot("idle")).toBe(false);
	});
});

describe("Animator.playOnce", () => {
	it("stores the current animation as lastPlayed and switches to the new one", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("hit", makeSprites(2), 0.1);
		a.playOnce("hit");
		expect(a.current.name).toBe("hit");
		// finish "hit" — should return to idle via lastPlayed
		a.update(0.2);
		a.update(0.2);
		expect(a.current.name).toBe("idle");
	});
});

describe("Animator.playNextOnce", () => {
	it("queues the next animation without changing the current one", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("walk", makeSprites(2), 0.1);
		a.playNextOnce("walk");
		expect(a.current.name).toBe("idle");
		// drive past the end of idle to consume the queued lastPlayed
		a.update(0.2);
		a.update(0.2);
		expect(a.current.name).toBe("walk");
	});
});

// ==================== isPlaying ====================

describe("Animator.isPlaying", () => {
	it("returns true for the current animation name", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		expect(a.isPlaying("idle")).toBe(true);
	});

	it("returns false for a different name", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("walk", makeSprites(2), 0.1);
		expect(a.isPlaying("walk")).toBe(false);
	});

	it("returns falsy when no animation has been registered", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		// short-circuits on `this.current` (undefined) — return is `undefined`, not `false`
		expect(a.isPlaying("idle")).toBeFalsy();
	});
});

// ==================== update ====================

describe("Animator.update", () => {
	it("does nothing when inactive", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(3), 0.1, true);
		a.active = false;
		a.update(0.5);
		expect(a.imageId).toBe(0);
	});

	it("advances imageId once the timer exceeds the timing", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(3), 0.1, true);
		a.update(0.05);
		expect(a.imageId).toBe(0);
		a.update(0.06);
		expect(a.imageId).toBe(1);
	});

	it("wraps imageId back to 0 at the end of the animation", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.update(0.2);
		expect(a.imageId).toBe(1);
		a.update(0.2);
		expect(a.imageId).toBe(0);
	});

	it("invokes onEnd at the end of the animation and clears it", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		const onEnd = vi.fn();
		a.play("idle", onEnd);
		a.update(0.2);
		a.update(0.2);
		expect(onEnd).toHaveBeenCalledTimes(1);
		a.update(0.2);
		a.update(0.2);
		expect(onEnd).toHaveBeenCalledTimes(1);
	});

	it("falls back to lastPlayed after the current animation ends", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("hit", makeSprites(2), 0.1);
		a.playOnce("hit");
		a.update(0.2);
		a.update(0.2);
		expect(a.current.name).toBe("idle");
	});

	it("invokes onFrame callbacks at the matching imageId and only once", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(3), 0.1, true);
		const cb = vi.fn();
		a.play("idle", undefined, { 1: cb });
		a.update(0.2);
		expect(cb).toHaveBeenCalledTimes(1);
		a.update(0.2);
		a.update(0.2);
		// returning to imageId=1 on the next loop should not re-fire — onFrame was deleted
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it("bails out of subsequent work if onEnd at the loop boundary starts another play", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("walk", makeSprites(3), 0.1);
		a.play("idle", () => a.play("walk"));
		a.update(0.2);
		a.update(0.2);
		expect(a.current.name).toBe("walk");
		expect(a.imageId).toBe(0);
	});

	it("skips setImage when an onFrame callback flips active to false", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(3), 0.1, true);
		const imageBeforeFrame1 = a.image;
		a.play("idle", undefined, {
			1: () => {
				a.active = false;
			},
		});
		a.update(0.2);
		// active=false bypasses setImage, so image stays at frame 0's canvas
		expect(a.image).toBe(imageBeforeFrame1);
	});

	it("bails out of subsequent work if an onFrame callback starts another play", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(3), 0.1, true);
		a.add("walk", makeSprites(3), 0.1);
		a.play("idle", undefined, {
			1: () => a.play("walk"),
		});
		a.update(0.2);
		expect(a.current.name).toBe("walk");
		expect(a.imageId).toBe(0);
	});
});

// ==================== randomTimer ====================

describe("Animator.randomTimer", () => {
	it("sets timer to a value in [0, current.timing)", () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5);
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(3), 0.4, true);
		a.randomTimer();
		// timer is private; observe its effect on the next update:
		// timer = 0.2, then dt=0.21 → 0.41 > 0.4 advances imageId.
		a.update(0.21);
		expect(a.imageId).toBe(1);
	});
});

// ==================== reset / removeAllAnimations ====================

describe("Animator.reset", () => {
	it("plays the default animation when one is registered", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.add("walk", makeSprites(2), 0.1);
		a.play("walk");
		a.reset();
		expect(a.current.name).toBe("idle");
		expect(a.active).toBe(true);
	});

	it("sets active=false when no default animation exists", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("walk", makeSprites(2), 0.1);
		a.reset();
		expect(a.active).toBe(false);
	});
});

describe("Animator.removeAllAnimations", () => {
	it("empties the animation list and clears callbacks", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2), 0.1, true);
		a.onEnd = vi.fn();
		a.removeAllAnimations();
		expect(a.current).toBeUndefined();
		expect(a.active).toBe(true);
		expect(a.onEnd).toBeUndefined();
	});

	it("evicts cached sprites for this Animator's namespace", () => {
		const ns = uniqueNamespace();
		const a = new Animator(makeEntity(), ns);
		a.add("idle", makeSprites(2), 0.1, true);
		// trigger setImage → fills cache
		const cache = (
			Animator as unknown as { spriteCache: Map<string, unknown> }
		).spriteCache;
		expect(cache.has(`${ns}.idle`)).toBe(true);
		a.removeAllAnimations();
		expect(cache.has(`${ns}.idle`)).toBe(false);
	});
});

// ==================== draw / drawRotated ====================

describe("Animator.draw", () => {
	it("calls drawImage on the context with entity pos + offset - sprite size.x", () => {
		const a = new Animator(makeEntity(100, 50), uniqueNamespace());
		a.add("idle", makeSprites(2, 8, 8), 0.1, true);
		const ctx = document
			.createElement("canvas")
			.getContext("2d") as CanvasRenderingContext2D;
		const spy = vi.spyOn(ctx, "drawImage");
		a.draw(ctx, new Vec2(5, 7));
		expect(spy).toHaveBeenCalledTimes(1);
		// drawImage(image, x, y): x = pos.x + offset.x - size.x = 100 + 5 - 8 = 97
		expect(spy.mock.calls[0][1]).toBe(97);
		expect(spy.mock.calls[0][2]).toBe(57);
	});
});

describe("Animator.drawRotated", () => {
	it("sets a rotated transform, draws, then restores the identity transform", () => {
		const a = new Animator(makeEntity(0, 0), uniqueNamespace());
		a.add("idle", makeSprites(2, 8, 8), 0.1, true);
		const ctx = document
			.createElement("canvas")
			.getContext("2d") as CanvasRenderingContext2D;
		const setTransform = vi.spyOn(ctx, "setTransform");
		const rotate = vi.spyOn(ctx, "rotate");
		const drawImage = vi.spyOn(ctx, "drawImage");
		a.drawRotated(ctx, Math.PI / 4);
		expect(rotate).toHaveBeenCalledWith(Math.PI / 4);
		expect(drawImage).toHaveBeenCalledTimes(1);
		// last setTransform call resets to identity
		const last = setTransform.mock.calls.at(-1)!;
		expect(last).toEqual([1, 0, 0, 1, 0, 0]);
	});
});

// ==================== setImage / sprite cache ====================

describe("Animator.setImage", () => {
	it("sets size from the current sprite", () => {
		const a = new Animator(makeEntity(), uniqueNamespace());
		a.add("idle", makeSprites(2, 16, 10), 0.1, true);
		expect(a.size.x).toBe(16);
		expect(a.size.y).toBe(10);
	});

	it("assigns entity.flipX to size.x when it is unset", () => {
		const entity = makeEntity();
		const a = new Animator(entity, uniqueNamespace());
		a.add("idle", makeSprites(2, 12, 8), 0.1, true);
		expect(entity.flipX).toBe(12);
	});

	it("leaves entity.flipX alone when it was already set", () => {
		const entity = makeEntity();
		entity.flipX = 99;
		const a = new Animator(entity, uniqueNamespace());
		a.add("idle", makeSprites(2, 12, 8), 0.1, true);
		expect(entity.flipX).toBe(99);
	});

	it("caches rendered sprites keyed by (namespace, animation, frame)", () => {
		const ns = uniqueNamespace();
		const a = new Animator(makeEntity(), ns);
		a.add("idle", makeSprites(2, 8, 8), 0.1, true);
		const first = a.image;
		a.update(0.2);
		a.update(0.0); // back to frame 0 next time
		// drive a fresh Animator with the same namespace+anim → same cached canvases
		const b = new Animator(makeEntity(), ns);
		b.add("idle", makeSprites(2, 8, 8), 0.1, true);
		expect(b.image).toBe(first);
	});

	it("keeps separate cache buckets for lookLeft=true vs false", () => {
		const ns = uniqueNamespace();
		const a = new Animator(makeEntity(), ns);
		a.add("idle", makeSprites(2, 8, 8), 0.1, true);
		const unflipped = a.image;
		a.lookLeft = true;
		a.play("idle");
		expect(a.image).not.toBe(unflipped);
	});
});

// ==================== clearSpriteCache ====================

describe("Animator.clearSpriteCache", () => {
	it("clears all cached sprites when called with no arguments", () => {
		const ns1 = uniqueNamespace();
		const ns2 = uniqueNamespace();
		new Animator(makeEntity(), ns1).add("idle", makeSprites(2), 0.1, true);
		new Animator(makeEntity(), ns2).add("idle", makeSprites(2), 0.1, true);
		const cache = (
			Animator as unknown as { spriteCache: Map<string, unknown> }
		).spriteCache;
		expect(cache.size).toBeGreaterThan(0);
		Animator.clearSpriteCache();
		expect(cache.size).toBe(0);
	});

	it("clears only the matching namespace prefix when given one", () => {
		const ns1 = uniqueNamespace();
		const ns2 = uniqueNamespace();
		new Animator(makeEntity(), ns1).add("idle", makeSprites(2), 0.1, true);
		new Animator(makeEntity(), ns2).add("idle", makeSprites(2), 0.1, true);
		Animator.clearSpriteCache(ns1);
		const cache = (
			Animator as unknown as { spriteCache: Map<string, unknown> }
		).spriteCache;
		expect(cache.has(`${ns1}.idle`)).toBe(false);
		expect(cache.has(`${ns2}.idle`)).toBe(true);
	});
});
