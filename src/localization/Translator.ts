import Settings from "@/core/Settings";
import { defineMethod } from "@/utilities/Prototype";
import { throttleByKey } from "@/utilities/Functions";

declare global {
	interface Window {
		/** Translate `key` for the active language. Throws until `prepareLanguage` has run. */
		t(key: string): string;
	}
}

// non-enumerable own property on the instance.
defineMethod(window, "t", function (_key): string {
	throw new Error("Call 'prepareLanguage' first!");
});

const logMissingKey = throttleByKey<[string]>((count, key) => {
	const suffix = count > 1 ? ` (x${count} since last log)` : "";

	console.warn(`"${key}" has no translation${suffix}`);
});

const logMissingLanguage = throttleByKey<[string, string]>(
	(count, current, fallback) => {
		const suffix = count > 1 ? ` (x${count} since last log)` : "";

		console.warn(
			`Language "${current}" not found, falling back to "${fallback}"${suffix}`,
		);
	},
);

/** Translation tables keyed by `languageCode → translationKey → text` (e.g. `{ en: { hello: "Hi" }, de: { hello: "Hallo" } }`). */
export type Languages = Record<string, Record<string, string>>;

/**
 * Install the global `window.t(key)` translator. Picks the active language from `Settings.localStorage.language` (seeded from `navigator.language` and overridable via `Settings.setLocalStorage("language", ...)`). Falls back to `defaultLanguage` when the active language isn't registered; returns the key itself when a translation is missing. Both fallback cases log a throttled `console.warn`. Logs `console.error` per missing key during preparation if some languages don't cover every key. Throws if `defaultLanguage` isn't in `languages`.
 */
export function prepareLanguage(
	languages: Languages,
	defaultLanguage: string = "en",
): void {
	if (!languages[defaultLanguage]) {
		throw new Error(
			`Default language is defined as "${defaultLanguage}" but isn't supplied!`,
		);
	}

	const allKeys: Set<string> = new Set();

	for (const lang in languages) {
		for (const key in languages[lang]) {
			allKeys.add(key);
		}
	}

	const sortedKeys = [...allKeys].sort();

	for (const lang in languages) {
		sortedKeys.forEach(key => {
			if (languages[lang][key] === undefined) {
				console.error(`"${lang}" misses "${key}"`);
			}
		});
	}

	defineMethod(window, "t", function (key): string {
		const currentLang = Settings.localStorage.language;

		let language = languages[currentLang];
		if (!language) {
			logMissingLanguage(currentLang, currentLang, defaultLanguage);
			language = languages[defaultLanguage];
		}

		if (language[key] === undefined) {
			logMissingKey(key, key);
			return key;
		}

		return language[key];
	});
}
