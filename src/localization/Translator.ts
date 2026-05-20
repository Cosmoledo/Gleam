import Settings from "@/core/Settings";

declare global {
	function _(key: string): string;
}

window._ = (): any => {
	throw new Error("Call 'prepareLanguage' first!");
};

export const prepareLanguage = (languages: any): void => {
	const allKeys: string[] = [];

	for (const lang in languages) {
		for (const obj in languages[lang]) {
			if (allKeys.indexOf(obj) < 0) {
				allKeys.push(obj);
			}
		}
	}

	allKeys.sort();

	for (const lang in languages) {
		allKeys.forEach(key => {
			if (languages[lang][key] === undefined) {
				console.error(lang + " misses '" + key + "'");
			}
		});
	}

	window._ = (key: string): string => {
		const language = languages[Settings.localStorage.language];

		if (language[key] === undefined) {
			console.error("'" + key + "' has no translation");
		}
		return language[key];
	};
};
