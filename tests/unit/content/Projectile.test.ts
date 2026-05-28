import { describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Projectile from "@/content/Projectile";
import Vec2 from "@/math/Vec2";

import "@/prototypes/HTMLCanvasElement";

// ==================== Helpers ====================

function makeImage(w: number = 16, h: number = 16): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	return c;
}

function readPos(p: Projectile): Vec2 {
	return (p as unknown as { pos: Vec2 }).pos;
}

function readVel(p: Projectile): Vec2 {
	return (p as unknown as { vel: Vec2 }).vel;
}

function readRotation(p: Projectile): number {
	return (p as unknown as { rotation: number }).rotation;
}

function readImage(p: Projectile): HTMLCanvasElement {
	return (p as unknown as { image: HTMLCanvasElement }).image;
}

function readLifetime(p: Projectile): number {
	return (p as unknown as { lifetime: number }).lifetime;
}

// ==================== constructor ====================

describe("Projectile constructor", () => {
	it("starts alive with lifetime 0 and infinite maxLifetime", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage());
		expect(p.alive).toBe(true);
		expect(readLifetime(p)).toBe(0);
		expect(p.maxLifetime).toBe(Infinity);
	});

	it("defaults speed to 1200", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage());
		expect(p.speed).toBe(1200);
	});

	it("clones the pos vector so external mutation does not leak in", () => {
		const pos = new Vec2(10, 20);
		const p = new Projectile(pos, makeImage());
		pos.set(999, 999);
		expect(readPos(p).x).toBe(10);
		expect(readPos(p).y).toBe(20);
	});

	it("clones the vel vector so external mutation does not leak in", () => {
		const vel = new Vec2(1, 0);
		const p = new Projectile(new Vec2(0, 0), makeImage(), vel);
		vel.set(0, 0);
		expect(readVel(p).x).toBe(1);
		expect(readVel(p).y).toBe(0);
	});

	it("defaults vel to (0, 0) when omitted", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage());
		expect(readVel(p).x).toBe(0);
		expect(readVel(p).y).toBe(0);
	});

	it("computes rotation from vel via atan2(y, x)", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage(), new Vec2(0, 1));
		expect(readRotation(p)).toBeCloseTo(Math.PI / 2);
	});

	it("sets the bounding rect to pos + rotated-image size", () => {
		const p = new Projectile(new Vec2(5, 7), makeImage(16, 32));
		expect(p.rect.x).toBe(5);
		expect(p.rect.y).toBe(7);
		// rect uses the rotated image (a square sized to fit the source's diagonal)
		const diam = Math.ceil(Math.sqrt(16 * 16 + 32 * 32));
		expect(p.rect.w).toBe(diam);
		expect(p.rect.h).toBe(diam);
	});

	it("populates image via originalImage.rotateBy", () => {
		const img = makeImage(10, 10);
		const p = new Projectile(new Vec2(0, 0), img, new Vec2(1, 0));
		// rotation is 0 here, but rotateBy still produces a fresh canvas
		expect(readImage(p)).toBeInstanceOf(HTMLCanvasElement);
	});

	it("accepts an optional generic payload", () => {
		const p = new Projectile<{ damage: number }>(
			new Vec2(0, 0),
			makeImage(),
		);
		p.payload = { damage: 5 };
		expect(p.payload.damage).toBe(5);
	});
});

// ==================== alive ====================

describe("Projectile.alive", () => {
	it("is true while lifetime < maxLifetime", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage());
		p.maxLifetime = 1;
		p.update(0.5);
		expect(p.alive).toBe(true);
	});

	it("is false once lifetime reaches maxLifetime", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage());
		p.maxLifetime = 1;
		p.update(1);
		expect(p.alive).toBe(false);
	});
});

// ==================== update ====================

describe("Projectile.update", () => {
	it("advances lifetime by dt", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage());
		p.update(0.5);
		expect(readLifetime(p)).toBeCloseTo(0.5);
	});

	it("moves pos by vel * speed * dt", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage(), new Vec2(1, 0));
		p.speed = 100;
		p.update(0.5);
		expect(readPos(p).x).toBeCloseTo(50);
		expect(readPos(p).y).toBe(0);
	});

	it("keeps the bounding rect x/y in sync with pos", () => {
		const p = new Projectile(new Vec2(10, 10), makeImage(), new Vec2(0, 1));
		p.speed = 10;
		p.update(1);
		expect(p.rect.x).toBeCloseTo(10);
		expect(p.rect.y).toBeCloseTo(20);
	});
});

// ==================== rebuildRotation ====================

describe("Projectile.rebuildRotation", () => {
	it("recomputes rotation from the current vel", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage(), new Vec2(1, 0));
		expect(readRotation(p)).toBeCloseTo(0);
		readVel(p).set(0, 1);
		p.rebuildRotation();
		expect(readRotation(p)).toBeCloseTo(Math.PI / 2);
	});

	it("rebuilds the image from originalImage (not the previously-rotated one)", () => {
		const img = makeImage(10, 10);
		const rotateBy = vi.spyOn(HTMLCanvasElement.prototype, "rotateBy");
		const p = new Projectile(new Vec2(0, 0), img, new Vec2(1, 0));
		const firstCallReceiver = rotateBy.mock.instances[0];
		p.rebuildRotation();
		const secondCallReceiver = rotateBy.mock.instances[1];
		// both calls should be on the original image, not on the prior rotated output
		expect(firstCallReceiver).toBe(img);
		expect(secondCallReceiver).toBe(img);
		rotateBy.mockRestore();
	});
});

// ==================== remove ====================

describe("Projectile.remove", () => {
	it("forces alive=false when maxLifetime is finite", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage());
		p.maxLifetime = 10;
		p.remove();
		expect(p.alive).toBe(false);
	});

	it("forces alive=false even with the default infinite maxLifetime", () => {
		const p = new Projectile(new Vec2(0, 0), makeImage());
		p.remove();
		expect(p.alive).toBe(false);
	});
});

// ==================== draw ====================

describe("Projectile.draw", () => {
	it("draws the rotated image at pos", () => {
		const p = new Projectile(new Vec2(40, 60), makeImage(), new Vec2(1, 0));
		const ctx = document
			.createElement("canvas")
			.getContext("2d") as CanvasRenderingContext2D;
		const spy = vi.spyOn(ctx, "drawImage");
		p.draw(ctx);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0]).toBe(readImage(p));
		expect(spy.mock.calls[0][1]).toBe(40);
		expect(spy.mock.calls[0][2]).toBe(60);
	});

	it("applies an offset to the draw position", () => {
		const p = new Projectile(new Vec2(10, 10), makeImage(), new Vec2(1, 0));
		const ctx = document
			.createElement("canvas")
			.getContext("2d") as CanvasRenderingContext2D;
		const spy = vi.spyOn(ctx, "drawImage");
		p.draw(ctx, new Vec2(5, -3));
		expect(spy.mock.calls[0][1]).toBe(15);
		expect(spy.mock.calls[0][2]).toBe(7);
	});
});
