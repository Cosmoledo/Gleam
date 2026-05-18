import {
	loadCanvas,
	SpriteSheetHandler,
	createNewCanvas,
	convert1DTo2D,
	loadText,
} from "@/utilities/Functions";
import { isInteger } from "@/utilities/Math";
import Polygon, { PolygonCollision } from "@/core/Polygon";
import Rect from "@/core/Rect";
import Vec2 from "@/core/Vec2";

interface TiledTile {
	"@attributes": {
		id: number;
		terrain?: string;
	};
	image: {
		"@attributes": {
			height: number;
			source: string;
			width: number;
		};
	};
	objectgroup?: {
		"@attributes": {
			draworder: string;
		};
		object: TiledObject | TiledObject[];
	};
}

interface TiledTileset {
	"@attributes": {
		columns: number;
		firstgid: number;
		name: string;
		tilecount: number;
		tileheight: number;
		tilewidth: number;
	};
	grid?: {
		"@attributes": {
			height: number;
			orientation: string;
			width: number;
		};
	};
	image?: {
		"@attributes": {
			height: number;
			source: string;
			width: number;
		};
	};
	terraintypes?: {
		terrain: {
			"@attributes": {
				name: string;
				tile: number;
			};
		};
	};
	tile?: TiledTile | TiledTile[];
}

interface TiledLayer {
	"@attributes": {
		height: number;
		id: number;
		name: string;
		width: number;
	};
	data: string;
}

interface TiledObject {
	"@attributes": {
		gid?: number;
		height: number;
		id: number;
		name: string;
		type: string;
		width: number;
		x: number;
		y: number;
	};
	polygon?: {
		"@attributes": {
			points: string;
		};
	};
}

interface TiledObjectGroup {
	"@attributes": {
		id: number;
		name: string;
	};
	object: TiledObject | TiledObject[];
}

interface TiledMapFile {
	"@attributes": {
		height: number;
		infinite: number;
		nextlayerid: number;
		nextobjectid: number;
		orientation: string;
		renderorder: string;
		tiledversion: string;
		tileheight: number;
		tilewidth: number;
		version: number;
		width: number;
	};
	tileset: TiledTileset[];
	layer: TiledLayer[];
	objectgroup: TiledObjectGroup | TiledObjectGroup[];
}

export interface RoomDataHolder {
	name: string;
	background: HTMLCanvasElement;
	foreground: HTMLCanvasElement;
	moveBounds: Rect;
	rect: Rect;
	selected: boolean;
}

interface CollisionObject {
	polygon: Polygon;
	rect: Rect;
}

export interface TriggerObject extends CollisionObject {
	isEnabled: boolean;
	name: string;
	type: string;
}

interface TeleportObject {
	autoTp: boolean;
	name: string;
	polygon: Polygon;
	rect: Rect;
	room: string;
	tpPosOffset: Vec2;
	tpTo: string;
}

interface Dimensions {
	HEIGHT: number;
	REAL_HEIGHT: number;
	REAL_WIDTH: number;
	TILE_HEIGHT: number;
	TILE_WIDTH: number;
	WIDTH: number;
}

export interface TiledMap {
	collisions: CollisionObject[];
	collisionMap: Map<number, Polygon>;
	curRoom: RoomDataHolder;
	dimensions: Dimensions;
	filename: string;
	layersMap: Map<string, HTMLCanvasElement[][]>;
	objectsMap: Map<string, Rect>;
	roomsMap: Map<string, RoomDataHolder>;
	teleporter: TeleportObject[];
	triggers: TriggerObject[];
	setRoom(room: string, updateRoom?: Function): void;
	update(dt: number, player: any, tell: Function): void;
	changeTriggerState(triggerName: string, state: boolean): void;
	getLayer(name: string): HTMLCanvasElement[][];
}

// https://gist.github.com/chinchang/8106a82c56ad007e27b1#file-xmltojson-js
function xmlToJson(xml: any): any {
	let obj: any = {};

	if (xml.nodeType === 1) {
		if (xml.attributes.length > 0) {
			obj["@attributes"] = {};
			for (let j = 0; j < xml.attributes.length; j++) {
				const attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = isInteger(
					attribute.nodeValue,
				)
					? Math.round(parseFloat(attribute.nodeValue))
					: attribute.nodeValue;
			}
		}
	} else if (xml.nodeType === 3) {
		obj = xml.nodeValue;
	}

	const textNodes = Array.from(xml.childNodes as any[]).filter(
		(node: Node) => node.nodeType === 3,
	);

	if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
		obj = Array.from(xml.childNodes as any[]).reduce(
			(text: string, node: Node) => text + node.nodeValue,
			"",
		);
	} else if (xml.hasChildNodes()) {
		for (let i = 0; i < xml.childNodes.length; i++) {
			const item = xml.childNodes.item(i);
			const nodeName = item.nodeName;

			if (nodeName === "#text") {
				continue;
			}

			if (typeof obj[nodeName] === "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof obj[nodeName].push === "undefined") {
					const old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}

	return obj;
}

export default async function loadTiledMap(
	baseDir: string,
	filename: string,
	onRoomChange?: (_: RoomDataHolder) => void,
	layersToSkip?: string[],
): Promise<TiledMap> {
	const collisionMap: Map<number, Polygon> = new Map();
	const collisions: CollisionObject[] = [];
	const imageMap: Map<number, HTMLCanvasElement> = new Map();
	const layersMap: Map<string, HTMLCanvasElement[][]> = new Map();
	const objectsMap: Map<string, Rect> = new Map();
	const roomsMap: Map<string, RoomDataHolder> = new Map();
	const teleporter: TeleportObject[] = [];
	const triggers: TriggerObject[] = [];
	let background: HTMLCanvasElement;
	let foreground: HTMLCanvasElement;
	let curRoom: RoomDataHolder = {} as any;
	let dimensions: Dimensions = {} as any;

	const mapData = await loadText(baseDir + filename + ".tmx").then(
		(text: string) => {
			const XmlNode = new DOMParser().parseFromString(text, "text/xml");
			return xmlToJson(XmlNode).map;
		},
	);

	if (!mapData || mapData.length === 0) {
		throw new Error(`Map ${filename} could not be loaded!`);
	}

	function setRoom(room: string, updateRoom?: Function): void {
		if (roomsMap.has(room)) {
			curRoom = roomsMap.get(room) as RoomDataHolder;
			if (updateRoom && typeof updateRoom === "function") {
				updateRoom(curRoom);
			}
		} else {
			console.error("Room does not exist: " + room);
		}
	}

	/**
	 * // TODO create base player and tell function
	 * @param dt
	 * @param player
	 * @param tell
	 */
	function update(_dt: number, player: any, tell: Function): void {
		for (const teleport of teleporter) {
			if (
				teleport.rect.collide(player.rect) &&
				PolygonCollision(teleport.polygon, player.polygon)
			) {
				const tpTo = teleporter.find(
					(teleporter: TeleportObject) =>
						teleporter.name === teleport.tpTo,
				) as TeleportObject;

				const pos = tpTo.rect.sides.centerPos
					.clone()
					.add(
						tpTo.tpPosOffset
							.clone()
							.mult(player.rect.w, player.rect.h),
					);

				setRoom(teleport.room);
				player.setPos(pos.x, pos.y);
			}
		}

		for (const trigger of triggers) {
			if (
				trigger.isEnabled &&
				trigger.rect.collide(player.rect) &&
				PolygonCollision(trigger.polygon, player.polygon).intersect
			) {
				tell("trigger", undefined, trigger);
				break;
			}
		}
	}

	function generateCanvasImages(layersToSkip?: string[]): any {
		const _background = createNewCanvas(
			dimensions.REAL_WIDTH,
			dimensions.REAL_HEIGHT,
		);
		const _foreground = createNewCanvas(
			dimensions.REAL_WIDTH,
			dimensions.REAL_HEIGHT,
		);

		layersMap.forEach((tiles, layerName) => {
			if (
				layersToSkip &&
				layersToSkip.length > 0 &&
				layersToSkip.some(name => layerName.includes(name))
			) {
				return;
			}

			const context = (
				layerName.toLowerCase().startsWith("top")
					? _foreground
					: _background
			).context;

			for (let y = 0; y < dimensions.HEIGHT; y++) {
				for (let x = 0; x < dimensions.WIDTH; x++) {
					if (tiles[y] && tiles[y][x]) {
						context.drawImage(
							tiles[y][x],
							x * dimensions.TILE_WIDTH,
							y * dimensions.TILE_HEIGHT,
							tiles[y][x].width,
							tiles[y][x].height,
						);
					}
				}
			}
		});

		background = _background.canvas;
		foreground = _foreground.canvas;

		// window.open("about:blank").document.write("<style>body{background:blue}img{border:solid 2px black;width:100%}></style><img src='" + background.toDataURL() + "'/>");

		// window.open("about:blank").document.write("<style>body{background:blue}img{border:solid 2px black;width:100%}></style><img src='" + foreground.toDataURL() + "'/>");
	}

	async function extractAndLoadImages(
		baseDir: string,
		mapData: TiledMapFile,
	): Promise<void> {
		const fetches: Promise<any>[] = [];

		if (!Array.isArray(mapData.tileset)) {
			mapData.tileset = [mapData.tileset];
		}

		mapData.tileset.forEach(tileset => {
			if (tileset.image) {
				const attr = tileset["@attributes"];

				fetches.push(
					loadCanvas(
						baseDir + tileset.image["@attributes"].source,
					).then((img: HTMLCanvasElement) => {
						const sprites = SpriteSheetHandler(
							img,
							img.width / attr.tilewidth,
							img.height / attr.tileheight,
						);

						for (let i = 0; i < sprites.length; i++) {
							imageMap.set(attr.firstgid + i, sprites[i]);
						}
					}),
				);
			}

			if (tileset.tile) {
				if (!Array.isArray(tileset.tile)) {
					tileset.tile = [tileset.tile];
				}

				tileset.tile
					.filter(tile => tile.image)
					.forEach(tile => {
						fetches.push(
							loadCanvas(
								baseDir + tile.image["@attributes"].source,
							).then((img: HTMLCanvasElement) =>
								imageMap.set(
									(tileset["@attributes"].firstgid +
										tile["@attributes"].id) %
										256,
									img,
								),
							),
						);
					});
			}
		});

		await Promise.all(fetches);
	}

	function extractCollisions(mapData: TiledMapFile): void {
		mapData.tileset.forEach(tileset => {
			if (!tileset.tile) {
				return;
			}

			if (!Array.isArray(tileset.tile)) {
				tileset.tile = [tileset.tile];
			}

			tileset.tile.forEach(tile => {
				if (!tile.objectgroup) {
					return;
				}

				if (!Array.isArray(tile.objectgroup.object)) {
					tile.objectgroup.object = [tile.objectgroup.object];
				}

				const rects: Rect[] = [];
				tile.objectgroup.object.forEach(object => {
					const attr = object["@attributes"];

					if (
						tile.image &&
						[attr.x, attr.y, attr.width, attr.height].some(
							(value: number) => value <= 0,
						)
					) {
						console.log(
							tile.image["@attributes"].source +
								" hat Kollision außerhalb des Bereichs!",
						);
					}

					if (object.polygon) {
						const points =
							object.polygon["@attributes"].points.split(" ");

						const polygon = new Polygon();
						points.forEach(pointString => {
							const point = pointString
								.split(",")
								.map(parseFloat);
							polygon.addPoint(point[0], point[1]);
						});
						polygon.offset(attr.x, attr.y);
						polygon.buildEdges();
						collisionMap.set(
							tileset["@attributes"].firstgid +
								tile["@attributes"].id,
							polygon,
						);
					} else {
						rects.push(
							new Rect(attr.x, attr.y, attr.width, attr.height),
						);
					}
				});
			});
		});
	}

	function extractDimensions(mapData: TiledMapFile): void {
		const WIDTH = mapData["@attributes"].width;
		const HEIGHT = mapData["@attributes"].height;
		const TILE_WIDTH = mapData["@attributes"].tilewidth;
		const TILE_HEIGHT = mapData["@attributes"].tileheight;
		const REAL_HEIGHT = HEIGHT * TILE_HEIGHT;
		const REAL_WIDTH = WIDTH * TILE_WIDTH;

		dimensions = {
			HEIGHT,
			REAL_HEIGHT,
			REAL_WIDTH,
			TILE_HEIGHT,
			TILE_WIDTH,
			WIDTH,
		};
	}

	function extractLayers(mapData: TiledMapFile): void {
		mapData.layer.forEach(layer => {
			let data: any = layer.data.replace(/\t|\r\n|\n| /g, "");
			data = atob(data);
			data = data.split("").map((a: string) => a.charCodeAt(0));
			data = new (window as any).Zlib.Inflate(data).decompress();

			const out: HTMLCanvasElement[][] = [];
			data.forEach((val: number, pos: number) => {
				if (pos % 4 === 0) {
					const imgId = val + data[pos + 1] * 256;
					if (imgId > 0 && imageMap.has(imgId)) {
						const canvas = imageMap.get(imgId) as HTMLCanvasElement;
						const real = new Vec2(
							convert1DTo2D(pos * 0.25, dimensions.WIDTH),
						);
						real.y += 1 - canvas.height / dimensions.TILE_HEIGHT;
						real.floor();

						if (!out[real.y]) {
							out[real.y] = [];
						}
						out[real.y][real.x] = canvas;

						real.mult(
							dimensions.TILE_WIDTH,
							dimensions.TILE_HEIGHT,
						);

						if (collisionMap.has(imgId)) {
							const polygon = (
								collisionMap.get(imgId) as Polygon
							).clone();
							polygon.offset(real.x, real.y);
							collisions.push({
								polygon,
								rect: Rect.from(polygon),
							});
						}
					}
				}
			});

			layersMap.set(layer["@attributes"].name, out);
		});

		collisions.sort(
			(a: CollisionObject, b: CollisionObject) =>
				a.rect.x - b.rect.x || a.rect.y - b.rect.y,
		);
	}

	function extractObjects(mapData: TiledMapFile): void {
		if (!Array.isArray(mapData.objectgroup)) {
			mapData.objectgroup = [mapData.objectgroup];
		}

		let rect: Rect;

		mapData.objectgroup.forEach(objectGroup => {
			if (!objectGroup) {
				return;
			}

			if (!Array.isArray(objectGroup.object)) {
				objectGroup.object = [objectGroup.object];
			}

			objectGroup.object.forEach(object => {
				const attr = object["@attributes"];

				switch (objectGroup["@attributes"].name) {
					case "Teleporter":
						const [offset, autoTp, room]: string[] =
							attr.type.split("|");

						const tpPosOffset = new Vec2();
						if (offset === "up") {
							tpPosOffset.set(-0.6, -1.3);
						} else if (offset === "bottom") {
							tpPosOffset.set(-0.6, 0.2);
						} else if (offset === "left") {
							tpPosOffset.set(-1.5, 0);
						} else if (offset === "right") {
							tpPosOffset.set(1.5, 0);
						} else {
							console.error(
								"Unknown tp pos offset: " +
									attr.type +
									" " +
									attr.name,
							);
						}

						rect = new Rect(
							attr.x,
							attr.y,
							attr.width,
							attr.height,
						);

						teleporter.push({
							autoTp: autoTp === "auto" ? true : false,
							name: attr.name,
							polygon: Polygon.from(rect),
							rect,
							room,
							tpPosOffset,
							tpTo:
								attr.name.slice(0, -1) +
								(attr.name.slice(-1) === "1" ? "2" : "1"),
						});
						break;

					case "Objects":
						objectsMap.set(
							attr.name,
							new Rect(attr.x, attr.y, attr.width, attr.height),
						);
						break;

					case "Trigger":
						rect = new Rect(
							attr.x,
							attr.y,
							attr.width,
							attr.height,
						);

						triggers.push({
							isEnabled: true,
							name: attr.name,
							polygon: Polygon.from(rect),
							rect,
							type: attr.type,
						});
						break;

					case "Rooms":
						rect = new Rect(
							attr.x,
							attr.y,
							attr.width,
							attr.height,
						);
						const moveBounds = rect.clone();
						moveBounds.x += dimensions.TILE_WIDTH * -1;
						moveBounds.y += dimensions.TILE_WIDTH * -1;
						moveBounds.w += dimensions.TILE_WIDTH * 1;
						moveBounds.h += dimensions.TILE_WIDTH * 1;

						if (attr.type) {
							const offset = attr.type
								.split("|")
								.map((val: string) => parseInt(val));

							offset[0] &&
								(moveBounds.x +=
									dimensions.TILE_WIDTH * offset[0]);
							offset[1] &&
								(moveBounds.y +=
									dimensions.TILE_WIDTH * offset[1]);
							offset[2] &&
								(moveBounds.w +=
									dimensions.TILE_WIDTH * offset[2]);
							offset[3] &&
								(moveBounds.h +=
									dimensions.TILE_WIDTH * offset[3]);
						}
						moveBounds.update();

						roomsMap.set(attr.name, {
							background: background.subImage(
								rect.x,
								rect.y,
								rect.w,
								rect.h,
							),
							foreground: foreground.subImage(
								rect.x,
								rect.y,
								rect.w,
								rect.h,
							),
							moveBounds,
							name: attr.name,
							rect,
							selected: attr.type === "true",
						});
						break;

					default:
						console.error(
							"There are objects in: " +
								objectGroup["@attributes"].name,
						);
						break;
				}
			});
		});

		if (roomsMap.size === 0) {
			const defaultRoom = {
				background,
				foreground,
				moveBounds: new Rect(
					-dimensions.TILE_WIDTH,
					-dimensions.TILE_HEIGHT * 0.5,
					dimensions.REAL_WIDTH + dimensions.TILE_WIDTH,
					dimensions.REAL_HEIGHT + dimensions.HEIGHT * 0.5,
				),
				name: "main",
				rect: new Rect(
					0,
					0,
					dimensions.REAL_WIDTH,
					dimensions.REAL_HEIGHT,
				),
				selected: true,
			};

			roomsMap.set("main", defaultRoom);
		}
	}

	await extractAndLoadImages(baseDir, mapData);
	extractCollisions(mapData);
	extractDimensions(mapData);
	extractLayers(mapData);
	generateCanvasImages(layersToSkip);
	extractObjects(mapData);

	roomsMap.forEach((room, name) => {
		if (room.selected) {
			setRoom(name, onRoomChange);
		}
	});

	return {
		collisions,
		collisionMap,
		curRoom,
		dimensions,
		filename,
		layersMap,
		objectsMap,
		roomsMap,
		teleporter,
		triggers,
		setRoom,
		update,
		changeTriggerState(triggerName: string, state: boolean): void {
			triggers.forEach(trigger => {
				trigger.name === triggerName && (trigger.isEnabled = state);
			});
		},
		getLayer(name: string): HTMLCanvasElement[][] {
			return (layersMap.has(name) && layersMap.get(name)) as any;
		},
	};
}
