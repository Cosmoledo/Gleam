import { isInteger } from "@/utilities/Math";

Storage.prototype.getOrSetDefault = function getOrSetDefault<T>(
	key: string,
	defaultValue: T,
): T {
	const content = this.getItem(key);

	if (content === null || content.length === 0) {
		this.setItem(key, defaultValue + "");
		return defaultValue;
	}

	switch (typeof defaultValue) {
		case "boolean":
			return (content === "true") as T;

		case "number":
			if (isInteger(content)) {
				return parseInt(content) as T;
			}

			this.setItem(key, defaultValue + "");
			return defaultValue;
	}

	return content as T;
};
