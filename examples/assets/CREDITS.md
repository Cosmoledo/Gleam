# Example assets

All assets in this folder are **CC0 (public domain)** — free for any use,
attribution appreciated but not required.

## Graphics — Pixel Adventure by Pixel Frog

[pixelfrog-assets.itch.io/pixel-adventure-1](https://pixelfrog-assets.itch.io/pixel-adventure-1) · CC0

| File | Notes |
| --- | --- |
| `idle.png` | Ninja Frog idle — 11 frames of 32×32; slice with `splitSpriteSheet(sheet, 11, 1)` |
| `run.png` | Ninja Frog run — 12 frames of 32×32 |
| `jump.png`, `fall.png` | Ninja Frog jump / fall — single 32×32 frames |
| `terrain.png` | 22×11 grid of 16×16 tiles |
| `terrain.json` | hand-authored atlas (grass, dirt, wood, stone, brick, gold) for `loadImageFromJson` |
| `apple.png` | single sprite — frame 0 of the animated fruit strip, cropped to its 12×14 bounds |

## Audio

| File | Source | Notes |
| --- | --- | --- |
| `sfx.mp3` | Kenney — [Interface Sounds](https://kenney.nl/assets/interface-sounds) · CC0 | glass tap (`glass_001`); converted from `.ogg` for cross-browser `<audio>` support |
| `A_Brand_New_Wisdom.mp3`, `Just_Saying_Tho.mp3`, `Winter_Dust.mp3`, `Swinging_Sweet.mp3` | [Short Loops Background Music Pack](https://opengameart.org/content/short-loops-background-music-pack) (OpenGameArt) · CC0 | four seamless looping tracks (~17–25 s) for `Music.fade` crossfades + auto-cycle; converted from `.ogg` |
