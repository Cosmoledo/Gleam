import type Controller from "./Controller";
import type Game from "@/core/Game";
import type Vec2 from "@/core/Vec2";
import { clamp } from "@/utilities/Number";
import { loadImage } from "@/loader/UrlLoaders";

const SPEED = 600;

let CROSSHAIR: HTMLImageElement;
(async (): Promise<HTMLImageElement> =>
	(CROSSHAIR = await loadImage(
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAilBMVEUAAAAaGhoZGRkZGRkbGxsZGRkaGhoWFhYgICAZGRkZGRkZGRkZGRkZGRkZGRkYGBgZGRkZGRkbGxsaGhoZGRkZGRkZGRkZGRkZGRkaGhoZGRkZGRkaGhoZGRkZGRkZGRkYGBgZGRkZGRkbGxsZGRkYGBgZGRkYGBgaGhoYGBgYGBgYGBgZGRkaGhqj+rsBAAAALXRSTlMA9fvsBINBCwfhZTnS2sByMcUZE8oe1TUqubeppJOLhlDyeiPOrp57X19dSkdeSFeiAAAELElEQVR42sSY2XaqQBBFD20jozKJI3E2Tun//72bKgmXZBmjLbT7KQ9J2HSdrqoFtMiCw2I2SUKvI0THC5PJbHEIMhjBOc/7HXWVTn9+dtAmbtdOhLqJSOyui3YYvXXUXXTeRmicfN9TNaxtYUf+shtbVtxd+pFdbC1Vo7fPm335Xe3Z0/VyI1FiWSiRm+V6WrPYNXcMwbSq8KCqcCXwMyWDKiXTAE3Q7auSMEpB/C7ApFGoSvpdPEs6q5IVA/hbgImrvM5SPIOMVorxfBe4U4BxfU8xq0hCmyAsM+1L4BEBlvd7ZeV0oyBtoQjvJIEHBRh58hQhbKlV/Uv4xNwBNAQYZy4uYdRIwsclRkkMaAowcXKJ8AceQy4UYfmApkCFbyli8VAZ3EIRwzGeF8B4qIjCxd04E0W8O2hCAM67IiYO7iQb8PEfgQYEmCOXYZDhLvIexyZAcwIIONK9/K735+d7YzQpgLHHBtkdBRtw/HI0K4B8yFVw/sz/pKxWswJVsiYubiILfv8MzQsg4zMoJG6x4PrnaEMAOedgcbP/cv7HaEcAY74LN7pySr9gBWhLAIFFL5j+GgCef0e0J4Ajz8bfYmBz/0WbAuCubOMqgaAL4LQr4NBVEMHVAoQUgDHaFcCYYhBeK0KkPvHRtgB8ek505QbQ/pugfQEktCun+MmMahObEIgpazP8oKs+mcOEAOb0rC6+Qy3Ac8wIOB41A3wjIKkTzAjgRE8LUGdK24I0JSBp55mixuhyBY0IVFdxhP/sKAHSnICkFOxQkeseAAtoH0GOL/Y0JF2TAi4N/j2+oEy8waQA3ij13yIYmxWIOYY1mxBmBRDSqdfqEZkWiDh31RgQqWmBVNBAqDaxAUwLYFDtZgn9ZF7A/to/HD4L8wJceQfAmVZB17yAS8vhuVwPpjAvwBN4Xq4i61cIrMu1hLrA8hUCS+oEQKY+2bxCYENPzhBQBuUrBKTFi9lBKbXFKwSwVUod+JNE8RqBgj9XzKgPGheoeuEMEx6FuoyEGAFPDMQJTwIfeuR9/t6QQw+fp0Go3wbcoWKGrn4jCOHpj6K1WtmWZa/UWn8ceejo74OhiCmEsQj198IOBDUiPZSwLPpjof0PlBL/mrd3GwiBIAiiAgRYCOcMfOzNP70TpNBCr4kAaX8zPVX+B6IluJ4luKIlSDbhOpZzms5lrMEmTI7hfoz3O/bgGEYX0f17s/07uYjCq3ib5y27iv1jxJ9jXpDwkowXpbws940Jb814c8rbcx5Q+IiGh1Q8puNBpY9qeVjt43o+sOAjGz+04mM7P7jko1s/vObjew8wcITDQywc4/Egk0e5OMzmcT4PNHqkk0OtHuv1YLNHuz3c7vF+Lzh4xcNLLgWajxedvOpVILt53a9AeCxQPguk1wLtt0B8blC/C+T3L/T/P3gDDpik2UVvAAAAAElFTkSuQmCC",
	)))();

export default class ControllerCursor {
	private axisId: number;
	private controller: Controller;
	private game: Game;
	private pos: Vec2;

	constructor(controller: Controller, game: Game, axisId: number) {
		this.controller = controller;
		this.game = game;
		this.axisId = axisId;

		this.pos = game.canman.size.mult(0.5);
	}

	public get centerPos(): Vec2 {
		return this.pos
			.clone()
			.add(CROSSHAIR.width * 0.5, CROSSHAIR.height * 0.5);
	}

	public draw(context: CanvasRenderingContext2D): void {
		context.drawImage(CROSSHAIR, this.pos.x, this.pos.y);
	}

	public update(dt: number): void {
		const step = this.controller.stick(this.axisId).mult(SPEED * dt);

		if (step.length() === 0) {
			return;
		}

		this.pos.x = clamp(
			this.pos.x + step.x,
			0,
			this.game.canman.width - CROSSHAIR.width,
		);

		this.pos.y = clamp(
			this.pos.y + step.y,
			0,
			this.game.canman.height - CROSSHAIR.height,
		);
	}
}
