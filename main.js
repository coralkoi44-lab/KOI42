import { initTetris } from "./games/tetris.js";
import { themeColors, applyThemeColors } from "./themes.js";
import { saveTheme, loadTheme, saveCustomTheme, loadCustomTheme } from "./storage.js";

// === DOM References (with null checks) ===
const aestheticButton = document.getElementById("aestheticButton");
const aestheticPanel = document.getElementById("aestheticPanel");
const themeOptions = document.querySelectorAll("[data-theme-choice]");
const customPrimaryColor = document.getElementById("customPrimaryColor");
const customSecondaryColor = document.getElementById("customSecondaryColor");
const customAccentColor = document.getElementById("customAccentColor");
const applyCustomTheme = document.getElementById("applyCustomTheme");
const pauseButton = document.getElementById("pauseButton");

// === Theme Management ===
function setTheme(themeName) {
  if (!themeName) return;

  document.body.dataset.theme = themeName;
  applyThemeColors(themeName);
  saveTheme(themeName);

  // Update active button state
  if (themeOptions.length > 0) {
    themeOptions.forEach((option) => {
      option.classList.toggle("active", option.dataset.themeChoice === themeName);
    });
  }
}

function applyCustomColors() {
  if (!customPrimaryColor || !customSecondaryColor || !customAccentColor) return;

  const colors = {
    primary: customPrimaryColor.value,
    secondary: customSecondaryColor.value,
    accent: customAccentColor.value
  };

  document.body.style.setProperty("--custom-primary", colors.primary);
  document.body.style.setProperty("--custom-secondary", colors.secondary);
  document.body.style.setProperty("--custom-accent", colors.accent);
  saveCustomTheme(colors);
  setTheme("custom");
}

// === UI Helpers ===
function openAestheticPanel() {
  if (!aestheticPanel || !aestheticButton) return;
  aestheticPanel.classList.remove("hidden", "closing");
  aestheticButton.setAttribute("aria-expanded", "true");
}

function closeAestheticPanel() {
  if (!aestheticPanel || !aestheticButton) return;
  aestheticPanel.classList.add("closing");
  aestheticButton.setAttribute("aria-expanded", "false");
}

function normalizePauseButtonLabel() {
  if (!pauseButton) return;

  const labels = {
    PAUSE: "Pause",
    RESUME: "Resume"
  };

  const normalizedLabel = labels[pauseButton.innerText];
  if (normalizedLabel) pauseButton.innerText = normalizedLabel;
}

// === Event Listeners (with null checks) ===
if (aestheticButton) {
  aestheticButton.addEventListener("click", () => {
    if (aestheticPanel && aestheticPanel.classList.contains("hidden")) {
      openAestheticPanel();
    } else {
      closeAestheticPanel();
    }
  });
}

if (aestheticPanel) {
  aestheticPanel.addEventListener("animationend", () => {
    if (aestheticPanel.classList.contains("closing")) {
      aestheticPanel.classList.add("hidden");
      aestheticPanel.classList.remove("closing");
    }
  });
}

if (themeOptions.length > 0) {
  themeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const themeName = option.dataset.themeChoice;
      if (themeName) setTheme(themeName);
    });
  });
}

if (applyCustomTheme) {
  applyCustomTheme.addEventListener("click", applyCustomColors);
}

if (pauseButton) {
  new MutationObserver(normalizePauseButtonLabel).observe(pauseButton, {
    childList: true,
    characterData: true,
    subtree: true
  });
}

// === Initialization ===
// Restore saved theme or use default
const savedTheme = loadTheme();
setTheme(savedTheme);

// Restore saved custom colors if theme is "custom"
if (savedTheme === "custom") {
  const customTheme = loadCustomTheme();
  if (customTheme.primary && customTheme.secondary && customTheme.accent) {
    if (customPrimaryColor) customPrimaryColor.value = customTheme.primary;
    if (customSecondaryColor) customSecondaryColor.value = customTheme.secondary;
    if (customAccentColor) customAccentColor.value = customTheme.accent;
    applyCustomColors();
  }
}

initTetris();
normalizePauseButtonLabel();
