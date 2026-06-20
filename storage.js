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

/**
 * Save the selected theme name.
 * @param {string} themeName - Name of the theme (e.g., "bee", "custom")
 */
export function saveTheme(themeName) {
  if (!themeName) return;
  localStorage.setItem(STORAGE_KEYS.THEME, themeName);
}

/**
 * Load the saved theme name.
 * @returns {string} Saved theme name, or "bee" if none saved
 */
export function loadTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || "bee";
}

/**
 * Save custom theme colors.
 * @param {Object} colors - { primary, secondary, accent }
 */
export function saveCustomTheme(colors) {
  if (!colors) return;
  if (colors.primary) localStorage.setItem(STORAGE_KEYS.CUSTOM_PRIMARY, colors.primary);
  if (colors.secondary) localStorage.setItem(STORAGE_KEYS.CUSTOM_SECONDARY, colors.secondary);
  if (colors.accent) localStorage.setItem(STORAGE_KEYS.CUSTOM_ACCENT, colors.accent);
}

/**
 * Load saved custom theme colors.
 * @returns {Object} { primary, secondary, accent } or all undefined if not saved
 */
export function loadCustomTheme() {
  return {
    primary: localStorage.getItem(STORAGE_KEYS.CUSTOM_PRIMARY),
    secondary: localStorage.getItem(STORAGE_KEYS.CUSTOM_SECONDARY),
    accent: localStorage.getItem(STORAGE_KEYS.CUSTOM_ACCENT)
  };
}

/**
 * Save the highest Tetris score.
 * @param {number} score - The score to save (only if higher than current)
 * @returns {number} The new high score
 */
export function saveHighScore(score) {
  const current = loadHighScore();
  if (score > current) {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
    return score;
  }
  return current;
}

/**
 * Load the highest Tetris score.
 * @returns {number} High score, or 0 if none saved
 */
export function loadHighScore() {
  const saved = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
  return saved ? parseInt(saved, 10) : 0;
}

/**
 * Clear all KOI42 storage (useful for testing).
 */
export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
