import { initTetris } from "./games/tetris.js";

const aestheticButton = document.getElementById("aestheticButton");
const aestheticPanel = document.getElementById("aestheticPanel");
const themeOptions = document.querySelectorAll("[data-theme-choice]");

function setTheme(themeName) {
  document.body.dataset.theme = themeName;

  themeOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.themeChoice === themeName);
  });
}

aestheticButton.addEventListener("click", () => {
  const isHidden = aestheticPanel.classList.toggle("hidden");
  aestheticButton.setAttribute("aria-expanded", String(!isHidden));
});

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    setTheme(option.dataset.themeChoice);
  });
});

setTheme("bee");
initTetris();
