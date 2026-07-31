// Localization demo — Translator + the global `window.t(key)`:
//
//   prepareLanguage(tables, "en") installs a global window.t(key). It reads
//   the ACTIVE language from Settings.localStorage.language (seeded from
//   navigator.language in Settings.init), NOT from an argument — so you
//   switch languages by writing that setting, and t() picks it up on the
//   next call. draw() calls t() every frame, so a switch re-localizes the
//   whole menu live.
//
// Fallbacks (both log a throttled console.warn): an unregistered language
// falls back to the default; a missing key returns the key itself. This
// demo shows the latter on purpose — `de` omits the `quit` key, so
// prepareLanguage logs a coverage error at startup and t("quit")
// renders the raw key while German is active.
//
// The demo UI is interactive: language buttons (built from the config keys)
// write Settings.localStorage.language; an editable JSON textarea + "Reload
// config" re-runs prepareLanguage live; and a panel mirrors the coverage
// console.error on-page.
import {
	Game,
	CANVAS_TYPES,
	Settings,
	prepareLanguage,
} from "@cosmoledo/gleam";

// languageCode → key → text. `de` deliberately has no `quit` entry.
const LANGUAGES = {
	en: {
		title: "PARAGON",
		start: "Start",
		options: "Options",
		quit: "Quit",
		highscore: "High score",
	},
	de: {
		title: "PARAGON",
		start: "Starten",
		options: "Optionen",
		// quit: intentionally missing — demonstrates the key fallback.
		highscore: "Bestwert",
	},
	es: {
		title: "PARAGON",
		start: "Comenzar",
		options: "Opciones",
		quit: "Salir",
		highscore: "Puntuación máxima",
	},
	fr: {
		title: "PARAGON",
		start: "Jouer",
		options: "Options",
		quit: "Quitter",
		highscore: "Meilleur score",
	},
};

// A tiny "main menu" whose every label is fetched through the global t(), so
// the whole screen re-localizes the moment the active language changes.
class I18nDemo extends Game {
	constructor() {
		// enableResize:false keeps the canvas at its declared 640x360.
		super({
			fps: 1 / 60, // fixed step in SECONDS — 60 Hz
			backgroundColor: "#0e0e10",
			enableResize: false,
		});

		// Install window.t before the loop's first draw. t() reads the active
		// language from Settings (which super() just initialised) only when
		// called, so the constructor is a fine place. `de` omits `quit`,
		// so prepareLanguage logs a coverage error here.
		prepareLanguage(LANGUAGES, "en");

		this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");

		// Nothing left to set up, so skip the init() step. The default init()
		// throws, so a Game with no init() override must pass doInit: false.
		this.preInit(false);
	}

	update() {
		// No per-frame logic — draw() re-reads the active language each frame.
	}

	/** @param {CanvasRenderingContext2D} ctx */
	draw(ctx) {
		const centerX = this.canman.width / 2;

		// Title.
		ctx.fillStyle = "#e8e8ea";
		ctx.font = "bold 34px system-ui, sans-serif";
		ctx.writeText(window.t("title"), centerX, 84);

		// Menu items — every label comes from the global t(). "Start" is the
		// selected row (▸ prefix); nudge it left so the label stays centered.
		ctx.fillStyle = "#c9c9d0";
		ctx.font = "20px system-ui, sans-serif";
		ctx.writeText("▸ " + window.t("start"), centerX - 8, 148);
		ctx.writeText(window.t("options"), centerX, 184);
		ctx.writeText(window.t("quit"), centerX, 220);

		// A number glued to a translated label (Translator has no interpolation).
		ctx.fillStyle = "#8a8a93";
		ctx.font = "16px system-ui, sans-serif";
		ctx.writeText(window.t("highscore") + ": 12,480", centerX, 278);

		// HUD.
		ctx.font = "12px system-ui, sans-serif";
		ctx.writeText(
			`active language: ${Settings.localStorage.language.toUpperCase()} · buttons save it to localStorage (survives reload)`,
			centerX,
			26,
		);
	}
}

/**
 * @param {(desc: string) => void} setDesc
 * @param {HTMLCanvasElement} canvas
 */
export function init(setDesc, canvas) {
	setDesc(
		"Translator + global window.t &middot; edit the config, reload live",
	);

	const parent = /** @type {HTMLElement} */ (canvas.parentElement);

	function setupButtons() {
		// Container the language buttons render into.
		const controls = document.createElement("div");
		controls.className = "controls";
		parent.append(controls);

		/**
		 * (Re)build the button row for `config`: one button per language key,
		 * labelled with the raw code, each writing that code to Settings on
		 * click. Then highlight whichever is the active language.
		 * @param {Record<string, Record<string, string>>} config
		 */
		return config => {
			// Flag the button matching the active language via aria-current.
			function highlightActiveButton() {
				Object.keys(config).forEach(code => {
					controls
						.querySelector(`#lang-${code}`)
						?.setAttribute(
							"aria-current",
							code === Settings.localStorage.language
								? "true"
								: "false",
						);
				});
			}

			controls.innerHTML = Object.keys(config)
				.map(
					code =>
						`<button id="lang-${code}">${code.toUpperCase()}</button>`,
				)
				.join("");

			Object.keys(config).forEach(code => {
				controls
					.querySelector(`#lang-${code}`)
					?.addEventListener("click", () => {
						// The only supported way to change language: write the setting.
						Settings.setLocalStorage("language", code);
						highlightActiveButton();
					});
			});

			highlightActiveButton();
		};
	}

	function setupEditor() {
		// --- Editable config -------------------------------------------------
		// A textarea prefilled with the language table plus a "Reload config"
		// button, so you can edit the JSON and re-apply it live.
		const editor = document.createElement("div");
		editor.className = "json-editor";
		editor.innerHTML = `
			<textarea id="lang-json" spellcheck="false" rows="20"></textarea>
			<div class="controls">
				<button id="lang-reload">Reload config</button>
				<span id="lang-status"></span>
			</div>
		`;
		parent.append(editor);

		const textarea = /** @type {HTMLTextAreaElement} */ (
			editor.querySelector("#lang-json")
		);
		textarea.value = JSON.stringify(LANGUAGES, null, 4);

		const status = /** @type {HTMLSpanElement} */ (
			editor.querySelector("#lang-status")
		);
		editor.querySelector("#lang-reload")?.addEventListener("click", () => {
			try {
				const parsed = JSON.parse(textarea.value);

				// Drop the previous config's mirrored coverage errors first.
				clearLog();

				// Re-install window.t from the edited table. Throws if the default
				// language ("en") is absent; logs a coverage error per missing key.
				prepareLanguage(parsed, "en");

				// Rebuild the buttons from the new config only after it applied — if
				// prepareLanguage threw above, window.t and the buttons stay on the
				// last-good config.
				buildButtons(parsed);

				status.textContent = "✓ config reloaded";
			} catch (err) {
				status.textContent =
					"✗ " + (err instanceof Error ? err.message : String(err));
			}
		});

		// Any interaction with the textarea invalidates the last loaded result
		["change", "keydown", "pointerdown"].forEach(event =>
			textarea.addEventListener(event, () => (status.textContent = "")),
		);
	}

	function setupLogListener() {
		// prepareLanguage logs a console.error for every missing translation key
		// (its coverage check). Mirror those into an on-page panel so they're
		// visible without opening devtools. (CSS hides the panel, note included,
		// until it holds at least one entry.)
		const log = document.createElement("div");
		log.className = "console-log";
		parent.append(log);

		const logNote = document.createElement("div");
		logNote.className = "log-note";
		logNote.textContent =
			"prepareLanguage checked the config and wrote to console.error. Mirrored here:";
		log.append(logNote);

		// Wrap console.error: mirror the message into the panel, then still
		// forward to the real console.error.
		const originalError = console.error;
		console.error = (...params) => {
			const line = document.createElement("div");
			line.className = "log-entry";
			line.textContent = params.join(" ");
			log.append(line);

			originalError(...params);
		};

		// Returned so the reload handler can drop stale entries (note survives).
		return () =>
			log
				.querySelectorAll(".log-entry")
				.forEach(element => element.remove());
	}

	// Build the DOM controls. setupLogListener() must run before the Game is
	// constructed, since the Game's constructor calls prepareLanguage and we
	// want its coverage console.error mirrored into the panel.
	const buildButtons = setupButtons();
	setupEditor();
	const clearLog = setupLogListener();

	// Construct the demo Game — its constructor installs window.t and logs the
	// `de` coverage error, captured by the listener above.
	new I18nDemo();

	// Populate the buttons now that Settings (and the active language) exists.
	buildButtons(LANGUAGES);
}
