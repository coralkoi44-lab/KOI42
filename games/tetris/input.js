export function setupInputHandlers(dom, callbacks) {
  const { onKeydown, onPauseClick, onSettingsClick, onCloseSettings, onGameBoardClick, onFullscreenClick, onSpeedToggle, onTabClick } = callbacks;

  document.addEventListener("keydown", onKeydown);
  dom.pauseButton.addEventListener("click", onPauseClick);
  dom.settingsButton.addEventListener("click", onSettingsClick);
  dom.closeSettingsButton.addEventListener("click", onCloseSettings);
  dom.gameBoard.addEventListener("pointerdown", onGameBoardClick);
  dom.fullscreenButton.addEventListener("click", onFullscreenClick);
  dom.speedIncreaseToggle.addEventListener("change", onSpeedToggle);
  dom.settingsTabs.forEach((tab) => tab.addEventListener("click", () => onTabClick(tab.dataset.tab)));

  dom.settingsModal.addEventListener("click", (event) => {
    if (event.target === dom.settingsModal) onCloseSettings();
  });
}
