export {};

declare global {
	interface HTMLAudioElement {
		defaultVolume?: number;
		clone(): HTMLAudioElement;
		stop: () => void;
	}
}

HTMLAudioElement.prototype.clone = function clone(): HTMLAudioElement {
	const node = this.cloneNode(true) as HTMLAudioElement;
	node.volume = this.volume;
	return node;
};

HTMLAudioElement.prototype.stop = function stop(): void {
	this.pause();
	this.currentTime = 0;
	this.volume = this.defaultVolume === undefined ? 1 : this.defaultVolume;
};
