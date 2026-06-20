/**
 * Storage Module
 * Centralized localStorage management for theme persistence, custom colors, and high scores.
 * All localStorage operations go through these functions for consistency and maintainability.
 */

const STORAGE_KEYS = {
  THEME: "koi42_theme",
  CUSTOM_PRIMARY: "koi42_custom_primary",
  CUSTOM_SECONDARY: "koi42_custom_secondary",
  CUSTOM_ACCENT: "koi42_custom_accent",
  HIGH_SCORE: "koi42_high_score"
};

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("Unable to read from localStorage:", error);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Unable to write to localStorage:", error);
  }
}

function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("Unable to remove from localStorage:", error);
  }
}

/**
 * Save the selected theme name.
 * @param {string} themeName - Name of the theme (e.g., "bee", "custom")
 */
export function saveTheme(themeName) {
  if (!themeName) return;
  writeStorage(STORAGE_KEYS.THEME, themeName);
}

/**
 * Load the saved theme name.
 * @returns {string} Saved theme name, or "bee" if none saved
 */
export function loadTheme() {
  return readStorage(STORAGE_KEYS.THEME) || "bee";
}

/**
 * Save custom theme colors.
 * @param {Object} colors - { primary, secondary, accent }
 */
export function saveCustomTheme(colors) {
  if (!colors) return;
  if (colors.primary) writeStorage(STORAGE_KEYS.CUSTOM_PRIMARY, colors.primary);
  if (colors.secondary) writeStorage(STORAGE_KEYS.CUSTOM_SECONDARY, colors.secondary);
  if (colors.accent) writeStorage(STORAGE_KEYS.CUSTOM_ACCENT, colors.accent);
}

/**
 * Load saved custom theme colors.
 * @returns {Object} { primary, secondary, accent } or all null if not saved
 */
export function loadCustomTheme() {
  return {
    primary: readStorage(STORAGE_KEYS.CUSTOM_PRIMARY),
    secondary: readStorage(STORAGE_KEYS.CUSTOM_SECONDARY),
    accent: readStorage(STORAGE_KEYS.CUSTOM_ACCENT)
  };
}

/**
 * Save the highest Tetris score.
 * @param {number} score - The score to save (only if higher than current)
 * @returns {number} The new high score
 */
export function saveHighScore(score) {
  const numericScore = Number(score) || 0;
  const current = loadHighScore();

  if (numericScore > current) {
    writeStorage(STORAGE_KEYS.HIGH_SCORE, numericScore.toString());
    return numericScore;
  }

  return current;
}

/**
 * Load the highest Tetris score.
 * @returns {number} High score, or 0 if none saved
 */
export function loadHighScore() {
  const saved = readStorage(STORAGE_KEYS.HIGH_SCORE);
  const highScore = Number.parseInt(saved, 10);
  return Number.isNaN(highScore) ? 0 : highScore;
}

/**
 * Clear all KOI42 storage (useful for testing).
 */
export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach(removeStorage);
}
