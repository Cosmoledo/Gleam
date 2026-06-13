import Settings from "@/core/Settings";
import { throttleByKey } from "@/utilities/Functions";

declare global {
	interface Window {
		t(key: string): string;
	}
}

window.t = function fallbackTranslate() {
	throw new Error("Call 'prepareLanguage' first!");
};

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

export type Languages = Record<string, Record<string, string>>;

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

	window.t = function translate(key: string): string {
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
	};
}
