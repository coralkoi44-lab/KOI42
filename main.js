import { initTetris } from "./games/tetris.js";

const aestheticButton = document.getElementById("aestheticButton");
const aestheticPanel = document.getElementById("aestheticPanel");
const themeOptions = document.querySelectorAll("[data-theme-choice]");
const customPrimaryColor = document.getElementById("customPrimaryColor");
const customSecondaryColor = document.getElementById("customSecondaryColor");
const customAccentColor = document.getElementById("customAccentColor");
const applyCustomTheme = document.getElementById("applyCustomTheme");
const pauseButton = document.getElementById("pauseButton");

const themeColors = {
  bee: {
    bg: "#FFB84E",
    text: "#1B1A1B",
    accent: "#FF9A3B"
  },
  "anti-bee": {
    bg: "#1B1A1B",
    text: "#FFB84E",
    accent: "#252425"
  },
  heather: {
    bg: "#FFC2E7",
    text: "#1B1A1B",
    accent: "#EE90CA"
  },
  "anti-heather": {
    bg: "#1B1A1B",
    text: "#FFC2E7",
    accent: "#252425"
  },
  pearl: {
    bg: "#A8D5D1",
    text: "#1B1A1B",
    accent: "#84C1BB"
  },
  "anti-pearl": {
    bg: "#1B1A1B",
    text: "#A8D5D1",
    accent: "#252425"
  }
};

function applyThemeColors(themeName) {
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

function normalizePauseButtonLabel() {
  if (!pauseButton) return;

  const labels = {
    PAUSE: "Pause",
    RESUME: "Resume"
  };

  const normalizedLabel = labels[pauseButton.innerText];
  if (normalizedLabel) pauseButton.innerText = normalizedLabel;
}

function setTheme(themeName) {
  document.body.dataset.theme = themeName;
  applyThemeColors(themeName);

  themeOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.themeChoice === themeName);
  });
}

function openAestheticPanel() {
  aestheticPanel.classList.remove("hidden", "closing");
  aestheticButton.setAttribute("aria-expanded", "true");
}

function closeAestheticPanel() {
  aestheticPanel.classList.add("closing");
  aestheticButton.setAttribute("aria-expanded", "false");
}

aestheticButton.addEventListener("click", () => {
  if (aestheticPanel.classList.contains("hidden")) {
    openAestheticPanel();
  } else {
    closeAestheticPanel();
  }
});

aestheticPanel.addEventListener("animationend", () => {
  if (aestheticPanel.classList.contains("closing")) {
    aestheticPanel.classList.add("hidden");
    aestheticPanel.classList.remove("closing");
  }
});

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    setTheme(option.dataset.themeChoice);
  });
});

applyCustomTheme.addEventListener("click", () => {
  document.body.style.setProperty("--custom-primary", customPrimaryColor.value);
  document.body.style.setProperty("--custom-secondary", customSecondaryColor.value);
  document.body.style.setProperty("--custom-accent", customAccentColor.value);
  setTheme("custom");
});

setTheme("bee");
initTetris();
normalizePauseButtonLabel();

if (pauseButton) {
  new MutationObserver(normalizePauseButtonLabel).observe(pauseButton, {
    childList: true,
    characterData: true,
    subtree: true
  });
}
