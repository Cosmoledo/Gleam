import Settings from "@/core/Settings";

declare global {
	function _(key: string): string;
}

window._ = function fallbackTranslate() {
	throw new Error("Call 'prepareLanguage' first!");
};

export type Languages = Record<string, Record<string, string>>;

export function prepareLanguage(languages: Languages): void {
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
				console.error(`'${lang}' misses '${key}'`);
			}
		});
	}

	window._ = function translate(key: string): string {
		let language = languages[Settings.localStorage.language];

		if (!language) {
			console.error(
				`Language '${Settings.localStorage.language}' not found, falling back to '${Object.keys(languages)[0]}'`,
			);
			language = languages[Object.keys(languages)[0]];
		}

		if (language[key] === undefined) {
			console.error(`'${key}' has no translation`);
			return key;
		}

		return language[key];
	};
}
