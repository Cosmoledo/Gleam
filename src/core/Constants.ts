export const EVENT_NAMES = {
	AFTER_RESIZE: "afterResize",
	KEY: "key",
	MOUSE: "mouse",
	STOP: "stop",
	CONTROLLER: "controller",
	CONTROLLER_DISCONNECTED: "controllerDisconnected",
} as const;

export const CANVAS_TYPES = {
	ANY: Symbol("any"),
	DEFAULT: Symbol("default"),
	BACKGROUND: Symbol("background"),
} as const;

export const MOUSE_KEYS = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,
	PREV: 3,
	FORWARD: 4,
} as const;

export const MOUSE_TYPES = {
	DOWN: Symbol("down"),
	MOVE: Symbol("move"),
	NONE: Symbol("none"),
	UP: Symbol("up"),
} as const;

export const CONTROLLER_KEYS = {
	A: 0,
	B: 1,
	X: 2,
	Y: 3,
	LB: 4,
	RB: 5,
	LT: 6,
	RT: 7,
	SELECT: 8,
	START: 9,
	LEFT_STICK: 10,
	RIGHT_STICK: 11,
	UP: 12,
	DOWN: 13,
	LEFT: 14,
	RIGHT: 15,
	GUIDE: 16,
} as const;
