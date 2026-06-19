import { initTetris } from "./games/tetris.js";

const aestheticButton = document.getElementById("aestheticButton");
const aestheticPanel = document.getElementById("aestheticPanel");
const themeOptions = document.querySelectorAll("[data-theme-choice]");
const customPrimaryColor = document.getElementById("customPrimaryColor");
const customSecondaryColor = document.getElementById("customSecondaryColor");
const customAccentColor = document.getElementById("customAccentColor");
const applyCustomTheme = document.getElementById("applyCustomTheme");

function setTheme(themeName) {
  document.body.dataset.theme = themeName;

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
