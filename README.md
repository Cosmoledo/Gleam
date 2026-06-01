# Gleam

A small TypeScript framework for 2D canvas games in the browser.

- **G**raphics
  - `CanvasManager` — sizes/clears the canvas and exposes the 2D context
  - prototype extensions on `CanvasRenderingContext2D`, `HTMLCanvasElement`, `HTMLImageElement`
  - `Color` class with CSS-string converters (`toHex`, `toHSL`, `toCSS`)
  - drawable content: `Animator` (sprite frames), `Particle`, `Projectile`
- **L**oop
  - `Game` — abstract base; subclass and implement `init`/`update`/`draw`
  - `Gameloop` — fixed-step `update(dt)` + `draw(ctx)` driver
  - `EventSystem` — engine-wide event dispatch (e.g. `resized`)
  - `Settings` — runtime config + persisted `localStorage` prefs
  - input wired into the loop: `Keyboard`, `Mouse`, `Controller`, `ControllerCursor`
- **E**ffects
  - `Screenshake` — camera shake
  - `ColorShifter` — animated color transitions
- **A**udio
  - `Sound` — one-shot SFX
  - `Music` — looped tracks
  - `AudioBase` — shared base class
  - `Audio` prototype extension
- **M**ath
  - `Vec2`, `Rect`, `Polygon` (with collision) — geometry primitives
  - numeric helpers in `utilities/Math`, `utilities/Number`, `utilities/Grid`

Also bundled: asset loaders (`UrlLoaders`, `TiledMap`), `Translator` for localization, and pure utilities (`Array`, `DOM`, `Functions`, `Json`, `String`).

## Install

```sh
npm install @cosmoledo/gleam
```

Or drop the IIFE bundle into a page and use the `Gleam` global:

```html
<script src="https://unpkg.com/@cosmoledo/gleam/dist/gleam.min.js"></script>
<script>
    const { Game, Settings } = Gleam;
    // ...
</script>
```

## Quick start

Add a canvas to the page:

```html
<canvas id="game" width="960" height="540"></canvas>
```

Subclass `Game`, register the canvas as `MAIN` on the `CanvasManager` instance `canman`, implement `init`/`update`/`draw`, and kick off `preInit()` from the constructor:

```ts
import Game, { CANVAS_TYPES, type SettingsOverrides } from "@cosmoledo/gleam";

class MyGame extends Game {
    constructor(overrides: SettingsOverrides = {}) {
        super(overrides);

        this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");

        this.preInit();
    }

    public async init() {
        // load assets, build the scene
    }

    public update(dt: number) {
        // advance simulation
    }

    public draw(ctx: CanvasRenderingContext2D) {
        // render the frame
    }
}

new MyGame({ fps: 1 / 60, backgroundColor: "#222" });
```

`preInit()` calls `canman.finishSetup()`, so at least one canvas must already be registered as `CANVAS_TYPES.MAIN` (with non-zero `width`/`height`). It then wires global listeners and the game loop — with the default `Settings.autoloop`, the loop starts as soon as `init()` resolves.

## What's inside

| Area | Module | Notable exports |
|------|--------|-----------------|
| Core | `src/core` | `Game`, `Gameloop`, `CanvasManager`, `EventSystem`, `Settings` |
| Math | `src/math` | `Vec2`, `Rect`, `Polygon` |
| Color | `src/color` | `Color`, `ColorShifter` (plus free fns in `utilities/Color`) |
| Audio | `src/audio` | `Sound`, `Music`, `AudioBase` |
| Input | `src/input` | `Keyboard`, `Mouse`, `Controller`, `ControllerCursor` |
| Content | `src/content` | `Animator`, `Particle`, `Projectile` |
| Effects | `src/effects` | `Screenshake` |
| Loaders | `src/loader` | `UrlLoaders`, `TiledMap` |
| Localization | `src/localization` | `Translator` |
| Prototypes | `src/prototypes` | side-effect extensions to `HTMLCanvasElement`, `HTMLImageElement`, `CanvasRenderingContext2D`, `Audio` |
| Utilities | `src/utilities` | `Array`, `Canvas`, `Color`, `DOM`, `Functions`, `Grid`, `Json`, `Math`, `Number`, `String` |

## Settings

`Settings` is a static-class singleton. Pass overrides to the `Game` constructor or read/write fields directly:

```ts
Settings.fps = 1 / 120;
Settings.debug = true;
```

Persisted user preferences live under the `gleam` `localStorage` key and are written via `Settings.setLocalStorage(key, value)`.

## Build outputs

`dist/` ships three bundles plus a single rolled-up `.d.ts`:

- `gleam.esm.js` — ESM, for bundlers (`main`/`import`).
- `gleam.js` — IIFE, exposes the `Gleam` global.
- `gleam.min.js` — minified IIFE.
- `gleam.d.ts` — bundled type definitions.

## Constraints

- **One `Game` per page.** The framework registers listeners on `window`/`document` and sets `history.scrollRestoration`; multiple instances will fight each other.
- Targets evergreen browsers (`es2020`).

## Development

```sh
npm run test            # full vitest run
npm run test:unit       # unit tests (happy-dom)
npx playwright install  # one-time: install chromium for test:browser
npm run test:browser    # browser tests (playwright/chromium)
npm run lint            # eslint over src/ and tests/
npm run build           # esbuild bundles + dts-bundle-generator
bash scripts/verify.sh  # lint → tests → coverage ≥95% → build
```

## License

MIT
