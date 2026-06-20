/**
 * Themes Module
 * Centralized theme definitions and helpers.
 * Keeps theme data out of main.js for better maintainability.
 */

export const themeColors = {
  bee: { bg: "#FFB84E", text: "#1B1A1B", accent: "#FF9A3B" },
  "anti-bee": { bg: "#1B1A1B", text: "#FFB84E", accent: "#252425" },
  heather: { bg: "#FFC2E7", text: "#1B1A1B", accent: "#EE90CA" },
  "anti-heather": { bg: "#1B1A1B", text: "#FFC2E7", accent: "#252425" },
  pearl: { bg: "#A8D5D1", text: "#1B1A1B", accent: "#84C1BB" },
  "anti-pearl": { bg: "#1B1A1B", text: "#A8D5D1", accent: "#252425" },
  oatmeal: { bg: "#FFDBB1", text: "#1B1A1B", accent: "#FFCC93" },
  "anti-oatmeal": { bg: "#1B1A1B", text: "#FFDBB1", accent: "#252425" },
  coral: { bg: "#FFBBA9", text: "#1B1A1B", accent: "#FFA38A" },
  "anti-coral": { bg: "#1B1A1B", text: "#FFBBA9", accent: "#252425" }
};

/**
 * Apply theme colors to the document.
 * @param {string} themeName - Name of the theme
 */
export function applyThemeColors(themeName) {
  const colors = themeColors[themeName];

  if (!colors) {
    document.body.style.removeProperty("--bg");
    document.body.style.removeProperty("--text");
    document.body.style.removeProperty("--accent");
    return;
  }

  document.body.style.setProperty("--bg", colors.bg);
  document.body.style.setProperty("--text", colors.text);
  document.body.style.setProperty("--accent", colors.accent);
}
