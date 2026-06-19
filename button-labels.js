const pauseButton = document.getElementById("pauseButton");

function normalizePauseButtonLabel() {
  if (!pauseButton) return;

  const labels = {
    PAUSE: "Pause",
    RESUME: "Resume"
  };

  const normalizedLabel = labels[pauseButton.innerText];
  if (normalizedLabel) pauseButton.innerText = normalizedLabel;
}

normalizePauseButtonLabel();

if (pauseButton) {
  new MutationObserver(normalizePauseButtonLabel).observe(pauseButton, {
    childList: true,
    characterData: true,
    subtree: true
  });
}
