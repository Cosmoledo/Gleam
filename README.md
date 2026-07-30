<div align="center">

[![npm](https://img.shields.io/npm/v/@cosmoledo/gleam.svg)](https://www.npmjs.com/package/@cosmoledo/gleam)
[![Integration Action](https://github.com/Cosmoledo/Gleam/actions/workflows/ci.yml/badge.svg)](https://github.com/Cosmoledo/Gleam/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@cosmoledo/gleam.svg)](https://github.com/Cosmoledo/Gleam/blob/main/LICENSE)

</div>

# Gleam

A TypeScript framework for 2D canvas games in the browser.

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

Also bundled: asset loaders (`loadImage`, `loadCanvas`, `loadText`, `loadJson`, `loadBunch`, …), `Translator` for localization, and many pure utilities: `Array`, `Canvas`, `Color`, `DOM`, `Fetch` (buffer a `Response` while reporting download progress), `Functions`, `Grid`, `Json`, `Math`, `Number`, `String`.

> **The `content/` classes are starting points, not fixed APIs.** `Animator`, `Particle`, `Projectile`, and `ControllerCursor` are deliberately minimal — they give you a working baseline to subclass and override for your own game rather than a final implementation. Take a look at the `Particle` examples.

## Contents

- [Install](#install)
- [Examples](#examples)
- [API reference](#api-reference)
- [Quick start](#quick-start)
- [Prototype helpers](#prototype-helpers)
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
<script src="https://cdn.jsdelivr.net/npm/@cosmoledo/gleam/dist/gleam.min.js"></script>
<script>
    const { Game, Settings } = Gleam;
    // ...
</script>
```

## Examples

Live demos: [cosmoledo.github.io/Gleam/examples/](https://cosmoledo.github.io/Gleam/examples/). Source under [`examples/`](https://github.com/Cosmoledo/Gleam/tree/main/examples) — each demo is a single self-contained HTML file that imports the published bundle via jsdelivr, so you can also open them directly with any static server (`npx serve examples`).

## API reference

Full API reference is generated from the source by [TypeDoc](https://typedoc.org/) and served alongside the examples on Pages: [cosmoledo.github.io/Gleam/](https://cosmoledo.github.io/Gleam/). Regenerate locally with `npm run docs` (outputs to `docs/`, gitignored).

## Quick start

Add a canvas to the page:

```html
<canvas id="game" width="960" height="540"></canvas>
```

Subclass `Game`, register the canvas as `MAIN` on the `CanvasManager` instance `canman`, implement `init`/`update`/`draw`, and kick off `preInit()` from the constructor:

```ts
import { Game, CANVAS_TYPES, Vec2, random2Pi } from "@cosmoledo/gleam";

class MyGame extends Game {
    private pos = new Vec2(460, 250);
    // Unit vector at a random angle, scaled to 180 px/s (fromAngle(rad, scale)).
    private vel = Vec2.fromAngle(random2Pi(), 180);
    private size = 40;

    constructor() {
        // SettingsOverrides. enableResize:false keeps the canvas at its
        // declared 960x540; otherwise the lib stretches it to the window.
        super({ fps: 1 / 60, backgroundColor: "#222", enableResize: false });

        this.canman.setupCanvas(CANVAS_TYPES.MAIN, "#game");

        this.preInit();
    }

    public async init() {
        // load assets / build the scene (runs once before the loop starts)
    }

    public update(dt: number) {
        // dt is the fixed step in seconds (= Settings.fps); scaling by it
        // keeps motion frame-rate independent.
        this.pos.add(this.vel.x * dt, this.vel.y * dt);

        // Bounce off the walls by flipping the offending axis.
        if (this.pos.x < 0 || this.pos.x > this.canman.width - this.size) {
            this.vel.x *= -1;
        }

        if (this.pos.y < 0 || this.pos.y > this.canman.height - this.size) {
            this.vel.y *= -1;
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        // The loop clears the canvas before draw() — just paint the frame.
        ctx.fillStyle = "#4ea1ff";
        ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
    }
}

// Constructing the Game starts everything (constructor -> preInit -> init -> loop).
new MyGame();
```

`preInit()`:

- Calls `canman.finishSetup()` — at least one canvas must already be registered as `CANVAS_TYPES.MAIN` with non-zero `width`/`height`.
- Wires global listeners and the game loop.
- Starts the loop as soon as `init()` resolves (with the default `Settings.autoloop`).

## Prototype helpers

Gleam extends the built-in DOM prototypes with drawing/asset helpers — `ctx.drawCircle`, `ctx.fillBar`, `img.subImage`, `audio.stop`, `canvas.getPixelAt`, and more. Subclassing `Game` installs them automatically (the `Game` module imports them), and the IIFE/CDN bundle always has them.

If you use Gleam without `Game` — say just `Vec2` and the canvas helpers, letting your bundler tree-shake the rest — opt in once at startup:

```ts
import "@cosmoledo/gleam/prototypes";
```

It's a side-effect import (binds nothing) and ships the matching global type augmentations, so `ctx.drawCircle(…)` type-checks.

## Constraints

- **One `Game` per page.** The framework registers listeners on `window`/`document` and sets `history.scrollRestoration`; multiple instances will fight each other.
- Targets evergreen browsers (`es2020`).

## How errors surface

Two error sources, handled differently:

**Caller errors — crash early.** The lib user uses a method wrong, forgets a required input, or trips an API with side effects. These reproduce every time with the same args, so the lib throws synchronously. A loud immediate crash surfaces the bug in dev where it can be fixed directly.

**Runtime errors — harder to spot.** As the game loop runs, subtle things go wrong: a vector shrinks toward zero and `normalize` would divide by zero, audio playback gets blocked by autoplay policy, a DOM element disappears mid-frame. These don't always reveal themselves on the first frame. Recoverable cases get a throttled `console.warn` (once per unique case, not every frame) plus the safest fallback the lib can manage. Unrecoverable cases crash — when something fundamental is gone, there's nothing useful left to do.

## Build outputs

`dist/` ships the per-module ESM tree, two single-file IIFE bundles, and a single rolled-up `.d.ts`:

- `esm/` — per-module ESM mirroring the `src/` tree, entry `esm/index.js` (`main`/`import`); module boundaries are preserved so bundlers can tree-shake.
- `gleam.js` — IIFE, exposes the `Gleam` global.
- `gleam.min.js` — minified IIFE.
- `gleam.d.ts` — bundled type definitions.
- `gleam.prototypes.d.ts` — types for the `@cosmoledo/gleam/prototypes` side-effect entry (the global augmentations).

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
