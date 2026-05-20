import Rect from "@/core/Rect";
import Vec2 from "@/core/Vec2";

export default class Polygon {
	public static from(rect: Rect): Polygon {
		const polygon = new Polygon();

		polygon.addPoint(rect.x, rect.y);
		polygon.addPoint(rect.x + rect.w, rect.y);
		polygon.addPoint(rect.x + rect.w, rect.y + rect.h);
		polygon.addPoint(rect.x, rect.y + rect.h);

		polygon.close();

		return polygon;
	}

	public static fromEdges(edges: number, size: Vec2 | number): Polygon {
		const s = size instanceof Vec2 ? size : new Vec2(size, size);

		const rad = Math.min(s.x, s.y) * 0.5;
		const Xcenter = s.x * 0.5;
		const Ycenter = s.y * 0.5;

		const polygon = new Polygon();

		for (let i = 1; i <= edges; i++) {
			polygon.addPoint(
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

		polygon.buildEdges();
		return polygon;
	}

	public points: Vec2[] = [];
	public edges: Vec2[] = [];

	public addPoint(x: GameLIB.Vector2 | number, y?: number): Polygon {
		if (typeof x === "number") {
			this.points.push(new Vec2(x, y));
		} else {
			this.points.push((x as Vec2).clone());
		}

		return this;
	}

	public rotate(angle: number, pos: Vec2 = this.center) {
		if (!angle) {
			return this;
		}

		this.points.forEach(point => {
			point.set(
				(point.x - pos.x) * Math.cos(angle) -
					(point.y - pos.y) * Math.sin(angle),
				(point.x - pos.x) * Math.sin(angle) +
					(point.y - pos.y) * Math.cos(angle),
			);
		});

		this.buildEdges();

		return this;
	}

	public close(): void {
		if (this.points.length > 0) {
			this.points.push(this.points[0].clone());
		}

		this.buildEdges();
	}

	public offset(x = 0, y = 0): Polygon {
		for (const point of this.points) {
			point.add(x, y);
		}

		this.buildEdges();

		return this;
	}

	public buildEdges(): void {
		this.edges.length = 0;
		let p1: Vec2;
		let p2: Vec2;

		for (let i = 0; i < this.points.length; i++) {
			p1 = this.points[i];

			if (i + 1 >= this.points.length) {
				p2 = this.points[0];
			} else {
				p2 = this.points[i + 1];
			}

			this.edges.push(p2.clone().sub(p1));
		}
	}

	public clone(): Polygon {
		const polygon = new Polygon();
		this.points.forEach(point => polygon.addPoint(point.clone()));
		polygon.buildEdges();
		return polygon;
	}

	public get center(): Vec2 {
		let totalX = 0;
		let totalY = 0;

		for (const point of this.points) {
			totalX += point.x;
			totalY += point.y;
		}

		return new Vec2(
			totalX / this.points.length,
			totalY / this.points.length,
		);
	}

	public draw(
		context: CanvasRenderingContext2D,
		offset: Vec2 = new Vec2(),
	): void {
		if (this.points.length === 0) {
			return;
		}

		context.beginPath();

		context.moveTo(
			(offset.x + this.points[0].x) | 0,
			(offset.y + this.points[0].y) | 0,
		);

		for (let i = 1; i < this.points.length; i++) {
			context.lineTo(
				(offset.x + this.points[i].x) | 0,
				(offset.y + this.points[i].y) | 0,
			);
		}

		context.closePath();
		context.stroke();
	}
}

/**
 * Creates an outline of a transparent image.
 * Then uses points to create a Polygon.
 *
 * @param {HTMLCanvasElement} sprite Source image
 * @param {number} d detail (lower = better)
 * @param {number} angle angle threshold in degrees (will remove points with angle differences below this level; 15 is a good value) making this larger will make the body faster but less accurate;
 * @returns {Polygon}
 */
export const generatePolygon = ((): ((
	canvas: HTMLCanvasElement,
	detail: number,
	angle: number,
) => Polygon) => {
	const pointDirection = (
		xfrom: number,
		yfrom: number,
		xto: number,
		yto: number,
	): number => {
		return (Math.atan2(yto - yfrom, xto - xfrom) * 180) / Math.PI;
	};

	return function generate(
		canvas: HTMLCanvasElement,
		detail: number,
		angle: number,
	): Polygon {
		detail = Math.max(2, detail);

		const w = canvas.width;
		const h = canvas.height;
		const data = (
			canvas.getContext("2d") as CanvasRenderingContext2D
		).getImageData(0, 0, w, h).data;

		const vertexX = [0];
		const vertexY = [0];
		const vertexK = [1];

		let numPoints = 0;
		let fy = -1;
		let lx = 0;
		let ly = 0;

		for (let tx = 0; tx < w; tx += detail) {
			for (let ty = 0; ty < h; ty += 1) {
				if (data[(ty * w + tx) * 4] !== 0) {
					vertexX[numPoints] = tx;
					vertexY[numPoints] = h - ty;
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
				if (data[(ty * w + tx) * 4] !== 0 && ty > ly) {
					vertexX[numPoints] = tx;
					vertexY[numPoints] = h - ty;
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
				if (data[(ty * w + tx) * 4] !== 0 && tx < lx) {
					vertexX[numPoints] = tx;
					vertexY[numPoints] = h - ty;
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
				if (data[(ty * w + tx) * 4] !== 0 && ty < ly && ty > fy) {
					vertexX[numPoints] = tx;
					vertexY[numPoints] = h - ty;
					vertexK[numPoints] = 1;
					numPoints++;
					lx = tx;
					ly = ty;
					break;
				}
			}
		}

		let ang1 = 0;
		let ang2 = 0;

		for (let i = 0; i < numPoints - 2; i++) {
			ang1 = pointDirection(
				vertexX[i],
				vertexY[i],
				vertexX[i + 1],
				vertexY[i + 1],
			);
			ang2 = pointDirection(
				vertexX[i + 1],
				vertexY[i + 1],
				vertexX[i + 2],
				vertexY[i + 2],
			);

			if (Math.abs(ang1 - ang2) <= angle) {
				vertexK[i + 1] = 0;
			}
		}

		ang1 = pointDirection(
			vertexX[numPoints - 2],
			vertexY[numPoints - 2],
			vertexX[numPoints - 1],
			vertexY[numPoints - 1],
		);
		ang2 = pointDirection(
			vertexX[numPoints - 1],
			vertexY[numPoints - 1],
			vertexX[0],
			vertexY[0],
		);

		if (Math.abs(ang1 - ang2) <= angle) {
			vertexK[numPoints - 1] = 0;
		}
		ang1 = pointDirection(
			vertexX[numPoints - 1],
			vertexY[numPoints - 1],
			vertexX[0],
			vertexY[0],
		);
		ang2 = pointDirection(vertexX[0], vertexY[0], vertexX[1], vertexY[1]);
		if (Math.abs(ang1 - ang2) <= angle) {
			vertexK[0] = 0;
		}

		const poly = new Polygon();
		for (let i = 0; i < numPoints; i++) {
			if (vertexK[i] === 1) {
				poly.addPoint(vertexX[i], h - vertexY[i]);
			}
		}
		poly.buildEdges();
		return poly;
	};
})();

export const PolygonCollision = ((): ((
	polygonA: Polygon,
	polygonB: Polygon,
	velocity?: Vec2,
) => GameLIB.PolygonCollisionResult) => {
	const intervalDistance = (
		minA: number,
		maxA: number,
		minB: number,
		maxB: number,
	): number => {
		if (minA < minB) {
			return minB - maxA;
		}

		return minA - maxB;

		/*
		const d1 = minB - maxA;
		const d2 = minA - maxB;
		const sign = (minA < minB) ? d1 / Math.abs(d1) : d2 / Math.abs(d2);
		return sign * Math.min(Math.abs(d1), Math.abs(d2));
		*/
	};

	const projectPolygon = (
		axis: Vec2,
		polygon: Polygon,
		bounds: Vec2,
	): void => {
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
	};

	return function collision(
		polygonA: Polygon,
		polygonB: Polygon,
		velocity: Vec2 = new Vec2(),
	): GameLIB.PolygonCollisionResult {
		const result: GameLIB.PolygonCollisionResult = {
			intersect: true,
			minimumTranslationVector: new Vec2(),
			willIntersect: true,
		};

		const edgeCountA = polygonA.edges.length;
		const edgeCountB = polygonB.edges.length;
		let minDistance = Infinity;
		let translationAxis = new Vec2();
		let edge: Vec2;

		for (
			let edgeIndex = 0;
			edgeIndex < edgeCountA + edgeCountB;
			edgeIndex++
		) {
			if (edgeIndex < edgeCountA) {
				edge = polygonA.edges[edgeIndex];
			} else {
				edge = polygonB.edges[edgeIndex - edgeCountA];
			}

			const axis = new Vec2(-edge.y, edge.x);
			axis.normalize();

			const boundsA = new Vec2();
			const boundsB = new Vec2();
			projectPolygon(axis, polygonA, boundsA);
			projectPolygon(axis, polygonB, boundsB);

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
				translationAxis = axis;

				const d: Vec2 = polygonA.center.sub(polygonB.center);
				if (d.dotProduct(translationAxis) < 0) {
					translationAxis.inv();
				}
			}
		}

		if (result.willIntersect) {
			result.minimumTranslationVector = translationAxis.mult(minDistance);
		}

		return result;
	};
})();
