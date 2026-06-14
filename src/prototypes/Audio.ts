import { defineMethod } from "@/utilities/Prototype";

// #region clone
declare global {
	interface HTMLAudioElement {
		/** Deep-clone this audio element, preserving the current `volume`. */
		clone(): HTMLAudioElement;
	}
}

defineMethod(
	HTMLAudioElement.prototype,
	"clone",
	function (): HTMLAudioElement {
		const node = this.cloneNode(true) as HTMLAudioElement;
		node.volume = this.volume;
		return node;
	},
);
// #endregion

// #region stop
declare global {
	interface HTMLAudioElement {
		/** Volume restored by `stop()` after pausing. If unset, `stop()` leaves `volume` as-is. */
		defaultVolume?: number;
		/** Pause playback, reset `currentTime` to 0, and restore `volume` to `defaultVolume` if set. */
		stop(): void;
	}
}

defineMethod(HTMLAudioElement.prototype, "stop", function (): void {
	this.pause();
	this.currentTime = 0;

	if (this.defaultVolume !== undefined) {
		this.volume = this.defaultVolume;
	}
});
// #endregion
