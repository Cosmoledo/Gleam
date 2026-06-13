import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ==================== Imports ====================

import Particle from "@/content/Particle";
import Vec2 from "@/math/Vec2";

import "@/prototypes/CanvasRenderingContext2D";

// ==================== Helpers ====================

function makeContext(): CanvasRenderingContext2D {
	return document
		.createElement("canvas")
		.getContext("2d") as CanvasRenderingContext2D;
}

function readVel(p: Particle): Vec2 {
	return (p as unknown as { vel: Vec2 }).vel;
}

function readLifetime(p: Particle): number {
	return (p as unknown as { lifetime: number }).lifetime;
}

function readMaxLifetime(p: Particle): number {
	return (p as unknown as { maxLifeTime: number }).maxLifeTime;
}

beforeEach(() => {
	// deterministic randomness for vel direction + maxLifeTime
	vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
	vi.restoreAllMocks();
});

// ==================== constructor ====================

describe("Particle constructor", () => {
	it("starts alive (lifetime < maxLifeTime)", () => {
		const p = new Particle(new Vec2(0, 0), "#ff0000");
		expect(p.alive).toBe(true);
	});

	it("defaults size to 2", () => {
		const p = new Particle(new Vec2(0, 0), "#ff0000");
		expect(p.rect.w).toBe(2);
		expect(p.rect.h).toBe(2);
	});

	it("uses an explicit size for the bounding rect", () => {
		const p = new Particle(new Vec2(10, 20), "#ff0000", 5);
		expect(p.rect.x).toBe(10);
		expect(p.rect.y).toBe(20);
		expect(p.rect.w).toBe(5);
		expect(p.rect.h).toBe(5);
	});

	it("scales velocity components by random per-axis speeds in [50, 150]", () => {
		// With Math.random=0: angle=0 → (cos, sin) = (1, 0); scales = (50, 50).
		const p = new Particle(new Vec2(0, 0), "#ff0000");
		const vel = readVel(p);
		expect(vel.x).toBeCloseTo(50);
		expect(vel.y).toBeCloseTo(0);
	});

	it("sets maxLifeTime in [0.5, 1.5)", () => {
		const p = new Particle(new Vec2(0, 0), "#ff0000");
		const max = readMaxLifetime(p);
		expect(max).toBeGreaterThanOrEqual(0.5);
		expect(max).toBeLessThan(1.5);
	});

	it("does not alias the caller's pos vector", () => {
		const callerPos = new Vec2(10, 20);
		const p = new Particle(callerPos, "#ff0000", 3);
		p.update(0.5);
		// caller's vector must remain untouched after Particle moves
		expect(callerPos.x).toBe(10);
		expect(callerPos.y).toBe(20);
		// and mutating the caller's vector must not retroactively shift the particle
		callerPos.set(999, 999);
		expect(p.rect.x).not.toBe(999);
		expect(p.rect.y).not.toBe(999);
	});
});

// ==================== alive ====================

describe("Particle.alive", () => {
	it("is true while lifetime < maxLifeTime", () => {
		const p = new Particle(new Vec2(0, 0), "#ff0000");
		expect(p.alive).toBe(true);
	});

	it("becomes false once lifetime reaches maxLifeTime", () => {
		const p = new Particle(new Vec2(0, 0), "#ff0000");
		p.update(readMaxLifetime(p));
		expect(p.alive).toBe(false);
	});
});

// ==================== update ====================

describe("Particle.update", () => {
	it("advances lifetime by dt", () => {
		const p = new Particle(new Vec2(0, 0), "#ff0000");
		p.update(0.25);
		expect(readLifetime(p)).toBeCloseTo(0.25);
	});

	it("moves pos by vel * dt", () => {
		const p = new Particle(new Vec2(10, 20), "#ff0000");
		const vel = readVel(p).clone();
		p.update(0.5);
		expect(p.rect.x).toBeCloseTo(10 + vel.x * 0.5);
		expect(p.rect.y).toBeCloseTo(20 + vel.y * 0.5);
	});

	it("keeps rect pos in sync with pos after update", () => {
		const p = new Particle(new Vec2(0, 0), "#ff0000", 3);
		p.update(1);
		const vel = readVel(p);
		expect(p.rect.x).toBeCloseTo(vel.x);
		expect(p.rect.y).toBeCloseTo(vel.y);
		// size remains constant
		expect(p.rect.w).toBe(3);
		expect(p.rect.h).toBe(3);
	});
});

// ==================== resetLifetime ====================

describe("Particle.resetLifetime", () => {
	it("subtracts maxLifeTime from lifetime, restoring alive=true", () => {
		const p = new Particle(new Vec2(0, 0), "#ff0000");
		const max = readMaxLifetime(p);
		p.update(max);
		expect(p.alive).toBe(false);
		p.resetLifetime();
		expect(p.alive).toBe(true);
		expect(readLifetime(p)).toBeCloseTo(0);
	});
});

// ==================== draw ====================

describe("Particle.draw", () => {
	it("draws a circle at pos using the configured color and size", () => {
		const p = new Particle(new Vec2(40, 60), "#abcdef", 4);
		const ctx = makeContext();
		const spy = vi.spyOn(ctx, "fillCircle");
		p.draw(ctx);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0]).toEqual({ x: 40, y: 60 });
		expect(spy.mock.calls[0][1]).toBe(4);
		expect(spy.mock.calls[0][2]).toBe("#abcdef");
	});

	it("applies an offset to the draw position", () => {
		const p = new Particle(new Vec2(10, 10), "#ff0000", 2);
		const ctx = makeContext();
		const spy = vi.spyOn(ctx, "fillCircle");
		p.draw(ctx, new Vec2(5, -3));
		expect(spy.mock.calls[0][0]).toEqual({ x: 15, y: 7 });
	});
});
