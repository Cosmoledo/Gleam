# 🤖 Game Framework AI Agent System

## Overview

This document describes how AI agents should work with the TypeScript game framework. The library is a single-page, single-`Game`-instance engine. Keep that constraint in mind when designing APIs or evaluating audit findings.

## Best Practices

### File Modification Workflow

```plain
1. read_file(filepath="...")           # Always read current file state
2. Analyze changes needed              # Plan modifications
3. Present analysis to user            # Wait for explicit go-ahead
4. edit_existing_file()                # Apply changes with edit tool
5. view_diff()                         # Verify diff before commit
```

### Type Safety

- Prefer typed signatures over `any`. `unknown` is the safer default for unknown shapes.
- Reuse global ambient types from `src/index.d.ts` (under the `GameLIB` namespace).
- For "could-be-parsed-as-a-number" validation use `isNumeric(value)` from `utilities/Math.ts`. For typed numbers, `Number.isFinite(v)` inline is enough.

### Verification commands

```sh
npx tsc --noEmit              # type-check only (fast)
npm run test:unit             # unit tests (vitest, happy-dom)
npm run test:browser          # browser tests (vitest, playwright/chromium)
./build.sh                    # eslint --fix, all tests, coverage ≥95%, build
```

Run `./build.sh` before declaring work complete. During iteration the lighter commands are faster.

The `vitest.config.ts` sets `silent: true` globally. Pass `--silent=false` if a test prints something you need to see.

Browser tests that exercise canvas prototype methods need `import "@/prototypes/index";` at the top of the test file.

### Never Implement Without Explicit Confirmation

#### What NOT to Do ❌

- **DO NOT** implement fixes mid-conversation when asked to just list/analyze
- **DO NOT** modify files after providing a complete analysis without being asked
- **DO NOT** "helpfully" fix multiple issues before user confirms
- **ALWAYS** wait for an explicit trigger: "go ahead", "implement these", "do it", "apply fixes"

#### Correct Workflow ✅

**User asks:** "list all `as any` usages and how I would solve them"

**I should:**

1. ✅ Find ALL instances first
2. ✅ Present complete analysis table (severity + proposed solutions)
3. ✅ WAIT and ask: "Would you like me to implement these fixes now?"
4. ❌ Never edit files until user gives explicit permission

#### Triggers That Allow Implementation

User explicitly says one of:

- `"go ahead"` / `"proceed"` / `"do it"`
- `"apply the fix(es)"` / `"implement"`
- `"make the changes"` / `"fix it"`
- `"update the code"` / `"edit these files"`

## Project Conventions

### Codebase layout

- `src/core/` — game classes: `Game` (abstract base), `Settings` (static-class singleton), `Sound`, `Color`, `ColorShifter`, `Polygon`, `Vec2`, `Rect`, `Constants`.
- `src/utilities/` — pure helpers split by domain: `Array.ts`, `Canvas.ts`, `Color.ts` (low-level free fns), `DOM.ts`, `Functions.ts` (orphans only — `delay`, `isMobile`), `Grid.ts`, `Json.ts`, `Math.ts`, `Number.ts`, `String.ts`.
- `src/prototypes/` — side-effect imports extending built-in prototypes (`HTMLCanvasElement`, `CanvasRenderingContext2D`, `Audio`, `Storage`).
- `src/loader/` — asset/data loaders (`UrlLoaders`, `TiledMap`).
- `src/effects/`, `src/content/`, `src/localization/` — feature folders.
- `src/index.d.ts` — global ambient types under the `GameLIB` namespace.

### Coding conventions

- **Module-level exports use the `function` keyword**, not arrow functions. Internal callbacks can still be arrows.
- **Tabs** for indentation.
- **Path alias `@/`** maps to `src/`. Prefer it for cross-directory imports.
- **JSDoc on public utility exports**: one short line is the norm. Only expand for non-obvious behavior. Skip `@param`/`@returns` — types live in the signature.
- **PascalCase** file names (matching the default export when applicable).
- **No section comment headers inside class files** (`// --- Factories ---` etc.) — they get removed.
- **No multi-paragraph comments inside function bodies** unless explaining a non-obvious "why".

### Architectural notes

- **Single Game per page.** The lib registers global listeners on `window` / `document` and sets `history.scrollRestoration`. Don't design APIs for multi-`Game` use. "Listener cleanup" audits don't apply — the browser tears everything down on page unload.
- **`Settings` is a static-class singleton** (`src/core/Settings.ts`). Read with `Settings.fps`, `Settings.localStorage.isMobile`. Write top-level fields directly (`Settings.fps = 0.5` — type-checked per field). `Settings.change(key, value)` is for persisted `localStorage` subkeys (auto-stringifies via `localStorage.setItem`). `Settings.init(overrides, game)` runs once from `Game`'s constructor.
- **`Color` split**: rich `Color` class in `src/core/Color.ts` (mutators, transforms, CSS output); low-level free functions in `src/utilities/Color.ts` (`rgb2hex`, `hex2rgb`, `hueToRGB`, `randomHex`, `randomRgb`). Use free functions in hot per-pixel loops — `Color` construction allocates and clamps.
- **All `Color.to*` methods produce CSS-compatible strings** (`toHex`, `toHSL`, `toCSS`). `fromHSL` and `hsl()` use hue in degrees `[0, 360]`.
- **All `Color` mutators route through `set(r, g, b, a?)`** which clamps and rounds. Compute new channel values into locals first, then call `set` — direct field writes mid-method cause aliasing bugs.

### Pre-existing patterns worth following

- **Hot-path performance**: prefer integer bit-ops over string concatenation in per-pixel loops. See `getUsedColors` (packs RGB into int, converts to hex once at the end) and `Polygon.fromCanvas` (one `getImageData` upfront, then index into the buffer).
- **`getElement<T>(selector)`** throws on miss instead of returning `null`. Use it as the default DOM lookup.

### Commit style

- Lowercase, imperative subject line.
- No scope prefixes (no `fix(scope): ...`).
- One-line subject; optional body explaining "why" if the diff alone doesn't tell the story.
