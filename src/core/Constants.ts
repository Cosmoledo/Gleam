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
