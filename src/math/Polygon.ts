import Vec2 from "@/math/Vec2";
import type Rect from "@/math/Rect";
import { throttle } from "@/utilities/Functions";
import { wrapRadians } from "@/utilities/Math";

/** Result of a {@link Polygon.collide} call. */
export interface PolygonCollisionResult {
	/** `true` if the polygons currently overlap. */
	intersect: boolean;
	/** Smallest displacement that would separate the polygons (zero `Vec2` when they're disjoint). */
	minimumTranslationVector: Vec2;
	/** `true` if applying the `velocity` passed to `collide` would put the polygons into contact. */
	willIntersect: boolean;
}

const warnZeroEdge = throttle(count => {
	console.warn(
		`Polygon.collide: found a zero-edge polygon — no collision possible. (called x${count} since last trace)`,
	);
});

function pointDirection(
	xfrom: number,
	yfrom: number,
	xto: number,
	yto: number,
): number {
	return Math.atan2(yto - yfrom, xto - xfrom);
}

function intervalDistance(
	minA: number,
	maxA: number,
	minB: number,
	maxB: number,
): number {
	return minA < minB ? minB - maxA : minA - maxB;
}

function projectPolygon(axis: Vec2, polygon: Polygon, bounds: Vec2): void {
	let dotProduct = axis.dotProduct(polygon.points[0]);
	bounds.x = dotProduct;
	bounds.y = dotProduct;

	for (let i = 1; i < polygon.points.length; i++) {
		dotProduct = polygon.points[i].dotProduct(axis);

		if (dotProduct < bounds.x) {
			bounds.x = dotProduct;
		} else if (dotProduct > bounds.y) {
			bounds.y = dotProduct;
		}
	}
}

/**
 * Convex 2D polygon. **The collision API ({@link Polygon.collide}) uses SAT, which is mathematically defined only for convex polygons** — feeding it a concave polygon silently produces wrong results.
 */
export default class Polygon {
	/**
	 * Trace an outline around the opaque pixels of `canvas` via four directional sweeps (top, right, bottom, left). `detail` is the pixel stride (≥ 2) between scanline samples — higher = faster but coarser. `angle` is the simplification threshold in radians: vertices whose turn angle wraps to within ±`angle` of straight are dropped. Throws if fewer than 3 vertices survive.
	 *
	 * **Convex shapes only.** The sweep ignores anything an outer-perimeter ray can't reach: holes (donuts), inward bays (a "C" opening sideways), or any row/column with multiple disjoint opaque spans. For those inputs the result is either a broken polygon or simply the outer hull, and {@link Polygon.collide} relies on convexity anyway.
	 */
	public static fromCanvas(
		canvas: HTMLCanvasElement,
		detail: number,
		angle: number,
	): Polygon {
		detail = Math.max(2, detail);

		const w = canvas.width;
		const h = canvas.height;
		const data = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;

		const vertexX = [0];
		const vertexY = [0];
		const vertexK = [1];

		let numPoints = 0;
		let fy = -1;
		let lx = 0;
		let ly = 0;

		for (let tx = 0; tx < w; tx += detail) {
			for (let ty = 0; ty < h; ty += 1) {
				if (data[(ty * w + tx) * 4 + 3] !== 0) {
					vertexX[numPoints] = tx;
					vertexY[numPoints] = ty;
					vertexK[numPoints] = 1;
					numPoints++;
					if (fy < 0) {
						fy = ty;
					}
					lx = tx;
					ly = ty;
					break;
				}
			}
		}

		for (let ty = 0; ty < h; ty += detail) {
			for (let tx = w - 1; tx >= 0; tx -= 1) {
				if (data[(ty * w + tx) * 4 + 3] !== 0 && ty > ly) {
					vertexX[numPoints] = tx;
					vertexY[numPoints] = ty;
					vertexK[numPoints] = 1;
					numPoints++;
					lx = tx;
					ly = ty;
					break;
				}
			}
		}

		for (let tx = w - 1; tx >= 0; tx -= detail) {
			for (let ty = h - 1; ty >= 0; ty -= 1) {
				if (data[(ty * w + tx) * 4 + 3] !== 0 && tx < lx) {
					vertexX[numPoints] = tx;
					vertexY[numPoints] = ty;
					vertexK[numPoints] = 1;
					numPoints++;
					lx = tx;
					ly = ty;
					break;
				}
			}
		}

		for (let ty = h - 1; ty >= 0; ty -= detail) {
			for (let tx = 0; tx < w; tx += 1) {
				if (data[(ty * w + tx) * 4 + 3] !== 0 && ty < ly && ty > fy) {
					vertexX[numPoints] = tx;
					vertexY[numPoints] = ty;
					vertexK[numPoints] = 1;
					numPoints++;
					lx = tx;
					ly = ty;
					break;
				}
			}
		}

		if (numPoints < 3) {
			throw new Error(
				`Polygon.fromCanvas: scan produced "${numPoints}" vertices (need >=3). Canvas may be empty or detail (${detail}) too large.`,
			);
		}

		for (let i = 0; i < numPoints; i++) {
			const a = i;
			const b = (i + 1) % numPoints;
			const c = (i + 2) % numPoints;

			const ang1 = pointDirection(
				vertexX[a],
				vertexY[a],
				vertexX[b],
				vertexY[b],
			);
			const ang2 = pointDirection(
				vertexX[b],
				vertexY[b],
				vertexX[c],
				vertexY[c],
			);

			if (Math.abs(wrapRadians(ang1 - ang2)) <= angle) {
				vertexK[b] = 0;
			}
		}

		const points: Vec2[] = [];
		for (let i = 0; i < numPoints; i++) {
			if (vertexK[i] === 1) {
				points.push(new Vec2(vertexX[i], vertexY[i]));
			}
		}

		return new Polygon(...points);
	}

	/** Regular convex polygon with `edges` vertices, inscribed in a bounding box of `size` (number = square). */
	public static fromEdges(edges: number, size: Vec2 | number): Polygon {
		const s = size instanceof Vec2 ? size : new Vec2(size, size);

		const rad = Math.min(s.x, s.y) * 0.5;
		const Xcenter = s.x * 0.5;
		const Ycenter = s.y * 0.5;

		const points: Vec2[] = [];
		for (let i = 1; i <= edges; i++) {
			points.push(
				new Vec2(
					Math.round(
						Xcenter + rad * Math.cos((i * 2 * Math.PI) / edges),
					),
					Math.round(
						Ycenter + rad * Math.sin((i * 2 * Math.PI) / edges),
					),
				),
			);
		}

		return new Polygon(...points);
	}

	/** Polygon from the four corners of `rect`. */
	public static fromRect(rect: Rect): Polygon {
		return new Polygon(
			new Vec2(rect.x, rect.y),
			new Vec2(rect.x + rect.w, rect.y),
			new Vec2(rect.x + rect.w, rect.y + rect.h),
			new Vec2(rect.x, rect.y + rect.h),
		);
	}

	private _center: Vec2 = new Vec2();
	private _points: Vec2[] = [];
	private edges: Vec2[] = [];

	/** Centroid (mean of vertex positions). Recomputed whenever the vertex set changes. */
	public get center(): Readonly<Vec2> {
		return this._center;
	}

	/** Read-only view of the current vertex list. Use `addPoint`/`offset`/`rotate` to mutate. */
	public get points(): Readonly<Vec2[]> {
		return this._points;
	}

	constructor(...points: Vec2[]) {
		this.addPoints(...points);
	}

	/** Stroke the polygon to `context`, shifted by `offset`. Coordinates are truncated to integers (via `| 0`) for crisp lines. */
	public draw(
		context: CanvasRenderingContext2D,
		offset: Vec2 = new Vec2(),
	): void {
		if (this._points.length === 0) {
			return;
		}

		context.beginPath();

		context.moveTo(
			(offset.x + this._points[0].x) | 0,
			(offset.y + this._points[0].y) | 0,
		);

		for (let i = 1; i < this._points.length; i++) {
			context.lineTo(
				(offset.x + this._points[i].x) | 0,
				(offset.y + this._points[i].y) | 0,
			);
		}

		context.closePath();
		context.stroke();
	}

	/** Append a single vertex at `(x, y)`. Mutates and returns `this`. */
	public addPoint(x: number, y: number): Polygon {
		this._points.push(new Vec2(x, y));
		this.update();

		return this;
	}

	/** Append cloned copies of every passed vertex. Mutates and returns `this`. */
	public addPoints(...points: Vec2[]): Polygon {
		points.forEach(point => this._points.push(point.clone()));
		this.update();

		return this;
	}

	/** Translate every vertex by `(x, y)`. Mutates and returns `this`. */
	public offset(x = 0, y = 0): Polygon {
		this._points.forEach(point => point.add(x, y));
		this.update();

		return this;
	}

	/** Rotate by `angle` radians around `pos` (defaults to the centroid). Mutates and returns `this`. */
	public rotate(angle: number, pos: Readonly<Vec2> = this.center) {
		if (!angle) {
			return this;
		}

		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		this._points.forEach(point => {
			const dx = point.x - pos.x;
			const dy = point.y - pos.y;
			point.set(dx * cos - dy * sin + pos.x, dx * sin + dy * cos + pos.y);
		});

		this.update();

		return this;
	}

	/** SAT collision against `otherPolygon`. **Both polygons must be convex** — SAT silently misses collisions for concave shapes. Pass a non-zero `velocity` to also compute whether the polygons would intersect after that displacement. Warns and returns a no-collision result if either polygon has zero edges. */
	public collide(
		otherPolygon: Polygon,
		velocity: Vec2 = new Vec2(),
	): PolygonCollisionResult {
		const result: PolygonCollisionResult = {
			intersect: true,
			minimumTranslationVector: new Vec2(),
			willIntersect: true,
		};

		const edgeCountA = this.edges.length;
		const edgeCountB = otherPolygon.edges.length;

		if (edgeCountA === 0 || edgeCountB === 0) {
			warnZeroEdge();

			return {
				intersect: false,
				minimumTranslationVector: new Vec2(),
				willIntersect: false,
			};
		}

		let minDistance = Infinity;
		let translationAxis = new Vec2();
		let edge: Vec2;

		for (
			let edgeIndex = 0;
			edgeIndex < edgeCountA + edgeCountB;
			edgeIndex++
		) {
			if (edgeIndex < edgeCountA) {
				edge = this.edges[edgeIndex];
			} else {
				edge = otherPolygon.edges[edgeIndex - edgeCountA];
			}

			const axis = new Vec2(-edge.y, edge.x);
			axis.normalize();

			const boundsA = new Vec2();
			const boundsB = new Vec2();
			projectPolygon(axis, this, boundsA);
			projectPolygon(axis, otherPolygon, boundsB);

			if (
				intervalDistance(boundsA.x, boundsA.y, boundsB.x, boundsB.y) > 0
			) {
				result.intersect = false;
			}

			const velocityProjection = axis.dotProduct(velocity);

			if (velocityProjection < 0) {
				boundsA.x += velocityProjection;
			} else {
				boundsA.y += velocityProjection;
			}

			let distance = intervalDistance(
				boundsA.x,
				boundsA.y,
				boundsB.x,
				boundsB.y,
			);
			if (distance > 0) {
				result.willIntersect = false;
			}

			if (!result.intersect && !result.willIntersect) {
				break;
			}

			distance = Math.abs(distance);
			if (distance < minDistance) {
				minDistance = distance;
				translationAxis = axis.clone();

				const d = this.center.clone().sub(otherPolygon.center);
				if (d.dotProduct(translationAxis) < 0) {
					translationAxis.negate();
				}
			}
		}

		if (result.willIntersect) {
			result.minimumTranslationVector = translationAxis.mult(minDistance);
		}

		return result;
	}

	/** New `Polygon` with the same vertices. */
	public clone(): Polygon {
		return new Polygon(...this._points);
	}

	private update(): void {
		if (this._points.length === 0) {
			return;
		}

		// edges
		let p1: Vec2;
		let p2: Vec2;

		// Allocates one Vec2 per edge per call; called every offset/rotate.
		// Reuse via edges[i].set(...) if profiling shows GC pressure here.
		this.edges.length = 0;
		for (let i = 0; i < this._points.length; i++) {
			p1 = this._points[i];

			if (i + 1 >= this._points.length) {
				p2 = this._points[0];
			} else {
				p2 = this._points[i + 1];
			}

			this.edges.push(p2.clone().sub(p1));
		}

		// center
		let totalX = 0;
		let totalY = 0;

		this.points.forEach(point => {
			totalX += point.x;
			totalY += point.y;
		});

		this.center.set(
			totalX / this._points.length,
			totalY / this._points.length,
		);
	}
}
