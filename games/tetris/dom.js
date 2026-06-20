export function getRequiredElement(id) {
  const element = document.getElementById(id);
  if (!element) console.warn("Tetris missing required element:", id);
  return element;
}

export function getTetrisDom() {
  const refs = {
    gameBoard: getRequiredElement("gameBoard"),
    gameSection: getRequiredElement("gameSection"),
    startScreen: getRequiredElement("startScreen"),
    pauseScreen: getRequiredElement("pauseScreen"),
    gameOverScreen: getRequiredElement("gameOverScreen"),
    beginButton: getRequiredElement("beginButton"),
    playAgainButton: getRequiredElement("playAgainButton"),
    restartButton: getRequiredElement("restartButton"),
    settingsButton: getRequiredElement("settingsButton"),
    pauseButton: getRequiredElement("pauseButton"),
    fullscreenButton: getRequiredElement("fullscreenButton"),
    settingsModal: getRequiredElement("settingsModal"),
    closeSettingsButton: getRequiredElement("closeSettingsButton"),
    speedIncreaseToggle: getRequiredElement("speedIncreaseToggle"),
    canvas: getRequiredElement("tetris"),
    nextCanvas: getRequiredElement("nextPiece"),
    scoreElement: getRequiredElement("score"),
    highScoreElement: getRequiredElement("highScore"),
    levelElement: getRequiredElement("level"),
    linesElement: getRequiredElement("lines")
  };

  if (Object.values(refs).some((element) => !element)) return null;

  refs.settingsTabs = document.querySelectorAll("[data-tab]");
  refs.settingsPanels = document.querySelectorAll(".settings-panel");
  refs.context = refs.canvas.getContext("2d");
  refs.nextContext = refs.nextCanvas.getContext("2d");

  if (!refs.context || !refs.nextContext) {
    console.warn("Tetris missing canvas context.");
    return null;
  }

  return refs;
}
