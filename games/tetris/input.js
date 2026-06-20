export function setupInputHandlers(dom, callbacks) {
  const {
    onKeydown,
    onPauseClick,
    onBeginClick,
    onPlayAgainClick,
    onRestartClick,
    onSettingsClick,
    onCloseSettings,
    onGameBoardClick,
    onFullscreenClick,
    onSpeedToggle,
    onTabClick
  } = callbacks;

  // === Keyboard ===
  if (onKeydown) {
    document.addEventListener("keydown", onKeydown);
  }

  // === Button Listeners ===
  if (dom.beginButton && onBeginClick) {
    dom.beginButton.addEventListener("click", onBeginClick);
  }

  if (dom.playAgainButton && onPlayAgainClick) {
    dom.playAgainButton.addEventListener("click", onPlayAgainClick);
  }

  if (dom.restartButton && onRestartClick) {
    dom.restartButton.addEventListener("click", onRestartClick);
  }

  if (dom.pauseButton && onPauseClick) {
    dom.pauseButton.addEventListener("click", onPauseClick);
  }

  if (dom.settingsButton && onSettingsClick) {
    dom.settingsButton.addEventListener("click", onSettingsClick);
  }

  if (dom.closeSettingsButton && onCloseSettings) {
    dom.closeSettingsButton.addEventListener("click", onCloseSettings);
  }

  if (dom.fullscreenButton && onFullscreenClick) {
    dom.fullscreenButton.addEventListener("click", onFullscreenClick);
  }

  // === Game Board ===
  if (dom.gameBoard && onGameBoardClick) {
    dom.gameBoard.addEventListener("pointerdown", onGameBoardClick);
  }

  // === Settings Modal ===
  if (dom.settingsModal && onCloseSettings) {
    dom.settingsModal.addEventListener("click", (event) => {
      if (event.target === dom.settingsModal) onCloseSettings();
    });
  }

  // === Speed Toggle ===
  if (dom.speedIncreaseToggle && onSpeedToggle) {
    dom.speedIncreaseToggle.addEventListener("change", onSpeedToggle);
  }

  // === Settings Tabs ===
  if (dom.settingsTabs && dom.settingsTabs.length > 0 && onTabClick) {
    dom.settingsTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (tab.dataset.tab && onTabClick) onTabClick(tab.dataset.tab);
      });
    });
  }
}
