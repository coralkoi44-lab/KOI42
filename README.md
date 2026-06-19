# KOI42

My website BITCH!
## Files

- `index.html` contains the page structure, theme buttons, custom theme controls, and Tetris UI.
- `styles.css` contains all visual styling, layout rules, theme colors, fullscreen behavior, and animations.
- `main.js` handles the aesthetics menu and applies custom theme colors.
- `games/tetris.js` contains the Tetris game logic and canvas drawing code.

## Theme system

Themes use three color roles:

- `--text`: the primary color. This is used for text, outlines, borders, and grid lines.
- `--bg`: the secondary color. This is used for the page and canvas background.
- `--accent`: the accent color. This is used for every Tetris block.

Current themes:

- `bee`: orange background, black text, orange accent `#FF9A3B`.
- `anti-bee`: black background, orange text, same orange accent.
- `heather`: pink background, black text, pink accent `#FF99D6`.
- `anti-heather`: black background, pink text, same pink accent.
- `custom`: user-selected primary, secondary, and accent colors from the aesthetics menu.

## Tetris rendering notes

The game draws the grid first, then draws blocks on top using the active theme accent color. Blocks slightly overlap their own grid cells so fullscreen scaling does not show tiny seams inside pieces. Piece outlines and grid lines use the primary/text color.

## Fullscreen layout

Fullscreen mode centers the Tetris board in the viewport. The score, next-piece preview, and buttons sit to the right of the centered board so the game window itself stays visually centered.

## Deployment

This site is deployed from the GitHub repository through Cloudflare Pages. Commits to the connected branch trigger a new deployment.
