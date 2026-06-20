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
    base = [4000, 8000, 12000, 16000][lineCount] || 0;
    difficult = lineCount > 0;
  } else if (spin === "mini") {
    base = lineCount === 0 ? 1000 : lineCount === 1 ? 2000 : 4000;
    difficult = lineCount > 0;
  } else {
    base = [0, 1000, 3000, 5000, 8000][lineCount] || 0;
    difficult = lineCount === 4;
  }

  if (difficult && player.backToBack) base = Math.floor(base * 1.5);

  if (lineCount > 0) {
    player.combo += 1;
    player.lines += lineCount;
    player.score += base * level;
    if (player.combo > 0) player.score += 500 * player.combo * level;
  } else {
    player.combo = -1;
    player.score += base * level;
  }

  if (difficult) player.backToBack = true;
  else if (lineCount > 0) player.backToBack = false;

  if (lineCount > 0 && perfectClear) {
    const perfectClearBonus = [0, 8000, 12000, 18000, 20000][lineCount] || 8000;
    player.score += perfectClearBonus * level;
  }

  player.level = calculateLevel(player.lines, speedIncreaseEnabled);
}
