# KOI42

A personal website with custom aesthetics, a playable Tetris build, and room for future arcade-style experiments.

## Files

- `index.html` contains the page structure, theme buttons, custom theme controls, favicon, and Tetris UI.
- `styles.css` contains visual styling, layout rules, fullscreen behavior, and animations.
- `main.js` handles the aesthetics menu, theme initialization, custom color application, and pause-label normalization.
- `themes.js` stores named theme definitions and theme color helpers so theme data stays out of `main.js`.
- `storage.js` centralizes persistence helpers for selected themes, custom colors, and Tetris high scores.
- `games/tetris.js` is the main Tetris controller. It wires together the UI, input handling, game loop, drawing, pause/settings behavior, fullscreen behavior, gameplay state, and high-score saving.
- `games/tetris/constants.js` stores shared Tetris constants and UI labels.
- `games/tetris/dom.js` safely collects required DOM elements and prevents Tetris from starting if required markup is missing.
- `games/tetris/pieces.js` stores matrix helpers, piece creation, bag randomization, rotation helpers, and cell utilities.
- `games/tetris/scoring.js` stores level, speed, combo, back-to-back, T-spin, and perfect-clear scoring helpers.

## Theme system

Themes use three color roles:

- `--text`: the primary color. This is used for text, outlines, borders, and grid lines.
- `--bg`: the secondary color. This is used for the page and canvas background.
- `--accent`: the accent color. This is used for Tetris blocks, active buttons, overlays, and highlighted UI surfaces.

Current themes:

- `bee`: orange background, black text, orange accent.
- `anti-bee`: black background, orange text, charcoal accent.
- `heather`: pink background, black text, pink accent.
- `anti-heather`: black background, pink text, charcoal accent.
- `pearl`: mint background, black text, mint accent.
- `anti-pearl`: black background, mint text, charcoal accent.
- `oatmeal`: cream background, black text, oatmeal accent.
- `anti-oatmeal`: black background, cream text, charcoal accent.
- `coral`: coral background, black text, coral accent.
- `anti-coral`: black background, coral text, charcoal accent.
- `custom`: user-selected primary, secondary, and accent colors from the aesthetics menu.

Theme definitions live in `themes.js`. `main.js` imports the theme helper instead of storing the named colorways inline.

## Persistence

`storage.js` is the only module that should talk directly to `localStorage` for site persistence. It provides helpers for saving and loading:

- The selected theme name.
- Custom primary, secondary, and accent colors.
- The highest locally recorded Tetris score.

On page load, KOI42 restores the saved named theme. If no saved theme exists, it defaults to `bee`.

Custom theme colors are also restored on page load. If the saved theme is `custom`, the saved custom colors are applied automatically without changing the visual design of the picker or the game.

High-score persistence is currently an underlying storage layer. Tetris saves the highest score locally at game over, but there is no high-score display yet. TODO: add a future high-score UI without changing current gameplay behavior.

## Tetris notes

The current Tetris build includes:

- A 10×20 board with a 7-bag piece randomizer.
- Next-piece preview.
- Pause/resume behavior with title-case button labels.
- Restart and fullscreen buttons.
- Settings modal with speed-increase toggle.
- Level and line tracking.
- Soft-drop points.
- Tetris, combo, back-to-back, T-spin, mini T-spin, and perfect-clear scoring.
- DOM null checks so missing UI elements fail safely instead of crashing the whole page.
- Local high-score saving as a foundation for a future high-score display.

The game remains grid-based, but rendering is isolated enough that future modes like Jelly Tetris or Block Blast can be added without stuffing everything into one giant file.

## Rendering notes

The game draws the grid first, then draws blocks on top using the active theme accent color. Blocks slightly overlap their own grid cells so fullscreen scaling does not show tiny seams inside pieces. Piece outlines and grid lines use the primary/text color.

## Fullscreen layout

Fullscreen mode centers the Tetris board in the viewport. The score, next-piece preview, and buttons sit to the right of the centered board so the game window itself stays visually centered.

## Deployment

This site is deployed from the GitHub repository through Cloudflare Pages. Commits to the connected branch trigger a new deployment.
