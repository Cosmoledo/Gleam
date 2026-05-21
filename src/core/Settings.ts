import "@/prototypes/Storage";
import { isMobile } from "@/utilities/Functions";
import type Game from "./Game";

export type SettingsOverrides = Partial<
	Omit<typeof Settings, "prototype" | "init" | "change">
>;

export default class Settings {
	public static antialias = false;
	public static autoloop = true;
	public static backgroundColor = "#444";
	public static debug = false;
	public static doNotClear = false;
	public static enableResize = true;
	public static font = "Arial";
	public static fps = 1 / 60;
	public static localStorage = {
		isMobile: false,
		language: "",
	};
	public static triedToClose = (): void => void 0;
	public static useClearRect = true;
	public static warnBeforeClose = false;

	public static change<K extends keyof typeof this.localStorage>(
		key: K,
		value: (typeof this.localStorage)[K],
	): void {
		localStorage.setItem(key, String(value));
		this.localStorage[key] = value;
	}

	public static init(overrides: SettingsOverrides, game: Game): void {
		Object.assign(this, overrides);

		if (this.debug) {
			// debug hook: expose instance on window for devtools inspection
			(window as any).game = game;
		}

		if (this.warnBeforeClose) {
			window.addEventListener(
				"beforeunload",
				(event: BeforeUnloadEvent) => {
					if (this.triedToClose) {
						this.triedToClose();
					}

					event.preventDefault();
					event.returnValue = true;
					return "Are you sure?";
				},
				false,
			);
		}

		this.localStorage.isMobile = localStorage.getOrSetDefault(
			"isMobile",
			isMobile(),
		);

		this.localStorage.language = localStorage.getOrSetDefault(
			"language",
			navigator.language.split("-")[0] || "en",
		);
	}
}
