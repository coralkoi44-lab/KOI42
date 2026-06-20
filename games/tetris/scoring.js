import { BASE_DROP_INTERVAL, LEVEL_SPEED_STEP, MIN_DROP_INTERVAL } from "./constants.js";

export function calculateLevel(lines, speedIncreaseEnabled) {
  return speedIncreaseEnabled ? Math.floor(lines / 10) + 1 : 1;
}

export function calculateDropInterval(level, speedIncreaseEnabled) {
  if (!speedIncreaseEnabled) return BASE_DROP_INTERVAL;
  return Math.max(MIN_DROP_INTERVAL, BASE_DROP_INTERVAL - (level - 1) * LEVEL_SPEED_STEP);
}

export function scoreLineClear(player, lineCount, spin, perfectClear, speedIncreaseEnabled) {
  const level = player.level;
  let base = 0;
  let difficult = false;

  if (spin === "tspin") {
    base = [400, 800, 1200, 1600][lineCount] || 0;
    difficult = lineCount > 0;
  } else if (spin === "mini") {
    base = lineCount === 0 ? 100 : lineCount === 1 ? 200 : 400;
    difficult = lineCount > 0;
  } else {
    base = [0, 100, 300, 500, 800][lineCount] || 0;
    difficult = lineCount === 4;
  }

  if (difficult && player.backToBack) base = Math.floor(base * 1.5);

  if (lineCount > 0) {
    player.combo += 1;
    player.lines += lineCount;
    player.score += base * level;
    if (player.combo > 0) player.score += 50 * player.combo * level;
  } else {
    player.combo = -1;
    player.score += base * level;
  }

  if (difficult) player.backToBack = true;
  else if (lineCount > 0) player.backToBack = false;

  if (lineCount > 0 && perfectClear) {
    const perfectClearBonus = [0, 800, 1200, 1800, 2000][lineCount] || 800;
    player.score += perfectClearBonus * level;
  }

  player.level = calculateLevel(player.lines, speedIncreaseEnabled);
}
