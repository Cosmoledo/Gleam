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
  - input wired into the loop: `Keyboard`, `Pointer`, `Controller`, `ControllerCursor`
- **E**ffects
  - `Screenshake` — camera shake
  - `ColorShifter` — animated color transitions
- **A**udio
  - `Sound` — one-shot SFX
  - `Music` — looped tracks, fading between songs
  - `AudioBase` — shared base class
  - `Audio` prototype extension
- **M**ath
  - `Vec2`, `Rect`, `Polygon` (with collision) — geometry primitives
  - numeric utility helpers

Also bundled: asset loaders (`UrlLoaders`, `TiledMap`), `Translator` for localization, and many pure utilities: `Array`, `Canvas`, `Color`, `DOM`, `Functions`, `Grid`, `Json`, `Math`, `Number`, `String`).

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Constraints](#constraints)
- [How errors surface](#how-errors-surface)
- [Build outputs](#build-outputs)
- [Development](#development)
- [License](#license)

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

`preInit()`:

- Calls `canman.finishSetup()` — at least one canvas must already be registered as `CANVAS_TYPES.MAIN` with non-zero `width`/`height`.
- Wires global listeners and the game loop.
- Starts the loop as soon as `init()` resolves (with the default `Settings.autoloop`).

## Constraints

- **One `Game` per page.** The framework registers listeners on `window`/`document` and sets `history.scrollRestoration`; multiple instances will fight each other.
- Targets evergreen browsers (`es2020`).

## How errors surface

Two error sources, handled differently:

**Caller errors — crash early.** The lib user uses a method wrong, forgets a required input, or trips an API with side effects. These reproduce every time with the same args, so the lib throws synchronously. A loud immediate crash surfaces the bug in dev where it can be fixed directly.

**Runtime errors — harder to spot.** As the game loop runs, subtle things go wrong: a vector shrinks toward zero and `normalize` would divide by zero, audio playback gets blocked by autoplay policy, a DOM element disappears mid-frame. These don't always reveal themselves on the first frame. Recoverable cases get a throttled `console.warn` (once per unique case, not every frame) plus the safest fallback the lib can manage. Unrecoverable cases crash — when something fundamental is gone, there's nothing useful left to do.

## Build outputs

`dist/` ships three bundles plus a single rolled-up `.d.ts`:

- `gleam.esm.js` — ESM, for bundlers (`main`/`import`).
- `gleam.js` — IIFE, exposes the `Gleam` global.
- `gleam.min.js` — minified IIFE.
- `gleam.d.ts` — bundled type definitions.

## Development

```sh
npx playwright install  # one-time: installs chromium for test:browser
npm run test            # full vitest run
npm run test:unit       # unit tests (happy-dom)
npm run test:browser    # browser tests (playwright/chromium)
npm run lint            # eslint over src/ and tests/
npm run build           # esbuild bundles + dts-bundle-generator
bash scripts/verify.sh  # lint → tests → coverage ≥95% → build
```

## License

MIT
