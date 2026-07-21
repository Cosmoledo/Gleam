# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.7] - Unreleased
### Changed
- Published ESM is now emitted per-module under `dist/esm/` instead of a single pre-bundled file, so bundlers can tree-shake — importing e.g. `Vec2` no longer pulls in the whole engine (~57 kB → ~6 kB). The single-specifier import (`import { … } from "@cosmoledo/gleam"`) is unchanged, as are the `<script>`-tag IIFE bundles.
- The bundled `dist/gleam.d.ts` is now type-checked during the build (dropped dts-bundle-generator's `--no-check`), so an invalid public type surface fails the build instead of shipping.
- `generate-barrel` now aborts the build when two modules export the same name — otherwise the collision would silently break a consumer's `import { X }` (`conflicting star exports`) and drop the name from `import *`.
- Lint enforces `consistent-type-imports`; type-only imports now use `import type` (internal, no consumer-facing effect).

### Removed
- `engines.node` (`">=24"`) — this is a browser library with no Node runtime requirement; the field only produced install warnings/errors for consumers on Node 20/22 LTS.

## [1.0.6] - 2026-07-20
### Fixed
- `typedEntries` now handles objects with optional properties. The `Entries<T>` type used a homomorphic mapped type that carried the optional (`?`) modifier through to the value union, leaking `undefined` into it and making the returned entries array non-iterable — so `for...of typedEntries(obj)` failed to compile for any object with an optional field. Added a `-?` modifier to strip optionality during the mapping. An optional property's value now correctly narrows to `T | undefined` (e.g. `string | undefined`) instead of breaking iteration.

## [1.0.5] - 2026-07-20
### Added
- `typedEntries` + `Entries<T>` — a retyped `Object.entries` that keeps the key↔value type relationship, so narrowing the key narrows the value. Runtime-identical to `Object.entries`, zero allocation overhead.
- New Screenshake example (`examples/screenshake.html`), linked from the examples index.

### Changed
- **BREAKING:** `input`/`Keyboard` event payload changed from `(keys, code, pressed)` to `(keys, event)`. Listeners now get the raw `KeyboardEvent` — recover the old values with `event.code` and `event.type === "keydown"`, and gain modifiers, `repeat`, `key`, and `preventDefault()` (dispatch is synchronous inside the DOM handler).
- **BREAKING:** Custom `ShakeType`s must now implement `reset(updateCss)`. `Screenshake` no longer auto-snapshots/restores CSS; each recipe clears the keys it wrote. The built-in `SHAKE_TYPES.NORMAL`/`FAST` are updated — any custom shake type needs a reset.
- Examples now import gleam from the unversioned jsDelivr CDN (always the latest published release).
- Silenced Node DEP0190 in the build/docs npx spawns (kept Windows compat via a single command string).
- Dev-deps: typescript-eslint 8.64, vitest/browser/coverage 4.1.10, happy-dom 20.11, typedoc 0.28.20, @types/node 26.1.1; actions/setup-node v6 → v7.

### Fixed
- Screenshake left a permanent tilt. The old snapshot logic captured a mid-shake `webkitTransform` as the "original" and restored that, so the element drifted after every shake. Recipe-owned reset fixes it; the redundant `webkitTransform` write was dropped (unprefixed `transform` is enough).
- Settings types were dropped from the shipped `.d.ts`. `Settings.localStorage` / `setLocalStorage` derived their types from a private field via `typeof`, and declaration emit elides private member types — so consumers got `Readonly<{}>` and `keyof never`. Now backed by an exported `LocalStorage` interface, so `.language` and the setter keys are typed for consumers again.
- Windows builds — barrel import paths normalized to `/`; npx shims resolve via `shell: true` in the build/docs scripts.

## [1.0.4] - 2026-07-06
### Added
- Fetch utility — new `download(response, onProgress)` helper that buffers a fetch `Response` to completion while reporting download progress. `onProgress` fires per chunk with cumulative bytes loaded and the total from `Content-Length` (or `null` when absent), then returns a fresh `Response` backed by the buffered bytes. Bodyless responses (204, HEAD) pass through untouched; throws on non-ok responses.
- `Color.int2hex(int)` — new low-level helper to format a packed 24-bit RGB integer as a `#rrggbb` string. `rgb2hex()` now routes through it to remove duplicated bit-twiddling.

### Changed
- `Canvas.getUsedColors()` now returns colors ordered by usage count (most-used first) instead of insertion order, and shares the `int2hex` conversion path.
- Dependency bumps: @types/node 26.0.1 → 26.1.0, @typescript-eslint/* 8.62.0 → 8.62.1.
- README updated to list the new Fetch utility.
- Added unit tests for Fetch, Color, and Canvas.

## [1.0.3] - 2026-07-02
### Added
- New `priority` option on `addEventListener(name, cb, { priority: true })` — fires the listener ahead of the non-priority tier. FIFO is preserved within each tier. Reserved for engine-internal wiring, but available to callers.

### Changed
- **BREAKING:** `Color` is now a default export — import as `import Color from "@cosmoledo/gleam"` (was a named export).
- Engine-internal listeners now run before user listeners for the same event, regardless of registration order. Previously ordering was pure registration-order (FIFO), so a user listener registered before the engine wired its own (e.g. canvas `resize` on `"resized"`) would fire first.
- Extra options passed to `addEventListener` are now preserved verbatim on the stored listener (forward-compatible metadata).
- `Rect` coordinate members reordered to a consistent `xywh` → sides grouping.
- Filled in JSDoc defaults (`Canvas`), tightened `Settings` window typing, and corrected the `Translator` stub signature.
- Coverage checker normalizes path separators on Windows.
- Dependency updates.

## [1.0.2] - 2026-06-20
### Added
- API reference site generated by TypeDoc and deployed via GitHub Pages, with `examples/` (bouncing-ball, brick-breaker) hosted alongside.
- Public types referenced from APIs are now exported: `onEndType`, `onFrameType`, `BaseEntity`, `Sides`, `GridPrimitive`, `ShakeType`, `CssProxy`, `CssStyleKey`, `Method`.
- JSDoc added across the public API: audio, color, content, core, effects, input, localization, math, and utilities.

### Changed
- **BREAKING:** `Controller` no longer depends on `Game` and no longer owns cursors, draw, or stick state. `poll()` now returns the deadzone-applied `Vec2[]` (in place, cached per unchanged timestamp). The per-axis deadzone of 0.3 is replaced by a radial deadzone of 0.25 with magnitude clamping so output stays in `[0, 1]`.
- **BREAKING:** `ControllerCursor` moved from `src/input` to `src/content`. Its constructor now takes `crosshair: CanvasImageSource` plus per-stick anchors and range; the embedded PNG and `loadImage` IIFE are gone. Cursor motion uses exponential smoothing toward `axis * range`.
- **BREAKING:** `CanvasManager.setupCanvas`'s `resize` parameter now defaults to `Settings.enableResize` (previously a hard-coded default).
- `Controller` and `ControllerCursor` decoupled, with a radial deadzone replacing the per-axis one.
- README: API reference section, Examples section, npm/CI/license badges, install snippet switched to jsDelivr, Quick-start import fixed (`Game` is a named export).
- New TypeDoc + Pages workflow; `npm run docs` runs `scripts/docs.mjs` mirroring the `build.mjs` barrel-gen pattern.
- `verify.sh` now prepends `npm audit` and runs TypeDoc with `--treatWarningsAsErrors`, so any undocumented public export fails CI.
- Dependabot configured for weekly npm + GitHub Actions updates.
- Bumped dev deps: typescript-eslint 8.61, vitest 4.1.8, esbuild 0.28.1, happy-dom 20.10.3, @types/node 20.19.43.

## [1.0.1] - 2026-06-14
### Changed
- No functional changes; this release exercised the CI workflow.

## [1.0.0] - 2026-06-14
### Added
- Initial release. TypeScript framework for 2D canvas games in the browser — graphics, loop, effects, audio, math. `npm install @cosmoledo/gleam`; see the README for quick start.

[1.0.7]: https://github.com/Cosmoledo/Gleam/compare/v1.0.6...HEAD
[1.0.6]: https://github.com/Cosmoledo/Gleam/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/Cosmoledo/Gleam/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Cosmoledo/Gleam/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Cosmoledo/Gleam/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Cosmoledo/Gleam/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Cosmoledo/Gleam/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Cosmoledo/Gleam/releases/tag/v1.0.0
