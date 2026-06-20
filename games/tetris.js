import {
  BASE_DROP_INTERVAL,
  COLS,
  EXIT_FULLSCREEN_LABEL,
  FULLSCREEN_LABEL,
  PAUSE_LABEL,
  RESUME_LABEL,
  ROWS
} from "./tetris/constants.js";
import { getTetrisDom } from "./tetris/dom.js";
import { createGameState, resetGame, createMatrix } from "./tetris/gamestate.js";
import { drawGame } from "./tetris/render.js";
import { setupInputHandlers } from "./tetris/input.js";
import { copyCell } from "./tetris/pieces.js";
import { scoreLineClear } from "./tetris/scoring.js";
import {
  canMove,
  nextFromBag,
  collide,
  merge,
  playerMove,
  playerDrop,
  playerRotate,
  getTSpinType,
  findFullLines,
  isPerfectClear,
  refreshLevelAndSpeed,
  getDropInterval
} from "./tetris/gameplay.js";
import { loadHighScore, saveHighScore } from "../storage.js";

export function initTetris() {
  const dom = getTetrisDom();
  if (!dom) return;

  const state = createGameState(COLS, ROWS);
  let dropInterval = BASE_DROP_INTERVAL;
  let highScore = loadHighScore();

  function updateStats() {
    dom.scoreElement.innerText = state.player.score;
    dom.highScoreElement.innerText = highScore;
    dom.levelElement.innerText = state.player.level;
    dom.linesElement.innerText = state.player.lines;
  }

  function updateHighScore() {
    highScore = saveHighScore(state.player.score);
    updateStats();
  }

  function updateVisualPosition() {
    if (!canMove(state)) {
      state.player.visualY = state.player.pos.y;
      return;
    }

    const dropProgress = Math.min(state.dropCounter / dropInterval, 0.98);
    state.player.visualY = state.player.pos.y + dropProgress;
  }

  function playerReset() {
    state.player.matrix = state.player.nextMatrix;
    state.player.type = state.player.nextType;
    state.player.rotation = 0;
    state.player.pieceId = state.player.nextPieceId || state.pieceIdCounter++;

    const next = nextFromBag(state);
    state.player.nextMatrix = next.matrix;
    state.player.nextType = next.type;
    state.player.nextPieceId = state.pieceIdCounter++;
    state.player.lastAction = null;
    state.player.pos.y = 0;
    state.player.visualY = 0;
    state.player.pos.x = Math.floor(COLS / 2) - Math.floor(state.player.matrix[0].length / 2);

    if (collide(state.arena, state.player)) endGame();
  }

  function finishLineClear(lines, spin) {
    if (lines.length > 0) {
      const clearedSet = new Set(lines);
      const keptRows = state.arena.filter((row, y) => !clearedSet.has(y)).map((row) => row.map(copyCell));
      const rebuiltArena = [...createMatrix(COLS, ROWS - keptRows.length), ...keptRows];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) state.arena[y][x] = rebuiltArena[y][x];
    }

    scoreLineClear(state.player, lines.length, spin, isPerfectClear(state.arena), state.speedIncreaseEnabled);
    refreshLevelAndSpeed(state, state.speedIncreaseEnabled);
    dropInterval = getDropInterval(state, state.speedIncreaseEnabled);
    if (lines.length > 0) boardBump("big");
    playerReset();
    updateStats();
  }

  function lockPiece(impactType) {
    const spin = getTSpinType(state.arena, state.player);
    merge(state.arena, state.player);
    if (impactType) boardBump(impactType);
    finishLineClear(findFullLines(state.arena), spin);
  }

  function startGame() {
    resetGame(state, COLS, ROWS, dom.speedIncreaseToggle.checked);
    state.gameStarted = true;

    const next = nextFromBag(state);
    state.player.nextMatrix = next.matrix;
    state.player.nextType = next.type;
    state.player.nextPieceId = state.pieceIdCounter++;

    dom.startScreen.classList.add("hidden");
    dom.pauseScreen.classList.add("hidden");
    dom.gameOverScreen.classList.add("hidden");
    dom.pauseButton.innerText = PAUSE_LABEL;

    refreshLevelAndSpeed(state, state.speedIncreaseEnabled);
    dropInterval = getDropInterval(state, state.speedIncreaseEnabled);
    updateStats();
    playerReset();
    drawGame(state, dom);
  }

  function restartGame() {
    startGame();
  }

  function endGame() {
    state.gameOver = true;
    state.gameStarted = false;
    state.paused = false;
    dom.pauseScreen.classList.add("hidden");
    dom.gameOverScreen.classList.remove("hidden");
    dom.pauseButton.innerText = PAUSE_LABEL;
    boardBump("big");
    updateHighScore();
  }

  function pauseGame() {
    if (!state.gameStarted || state.gameOver) return;
    state.paused = true;
    dom.pauseScreen.classList.remove("hidden");
    dom.pauseButton.innerText = RESUME_LABEL;
  }

  function resumeGame() {
    if (!state.gameStarted || state.gameOver) return;
    state.paused = false;
    dom.pauseScreen.classList.add("hidden");
    dom.pauseButton.innerText = PAUSE_LABEL;
    state.lastTime = performance.now();
    animateElement(dom.gameBoard, "resume-pop", 280);
  }

  function togglePause() {
    if (state.paused) resumeGame();
    else pauseGame();
  }

  function openSettingsModal() {
    dom.settingsModal.classList.remove("hidden", "closing");
    dom.settingsModal.setAttribute("aria-hidden", "false");
    pauseGame();
  }

  function closeSettingsModal() {
    if (dom.settingsModal.classList.contains("hidden")) return;
    dom.settingsModal.classList.add("closing");
  }

  function activateSettingsTab(tabId) {
    dom.settingsTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabId));
    dom.settingsPanels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
  }

  function animateElement(element, className, duration = 400) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function boardBump(size) {
    animateElement(dom.gameBoard, size === "big" ? "impact-big" : "impact-small", size === "big" ? 240 : 160);
  }

  function bounceElement(element) {
    if (!element) return;
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "toggleBounce 0.24s ease";
  }

  function handleKeydown(event) {
    const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space", "KeyA", "KeyD", "KeyS", "KeyW"];
    if (state.gameStarted && gameKeys.includes(event.code)) event.preventDefault();
    if (event.key === "Escape") closeSettingsModal();

    if (event.code === "Space") {
      if (state.gameOver) startGame();
      else togglePause();
      return;
    }

    if (state.paused && gameKeys.includes(event.code)) resumeGame();
    if (event.key === "ArrowLeft" || event.code === "KeyA") playerMove(state.arena, state.player, -1, state);
    if (event.key === "ArrowRight" || event.code === "KeyD") playerMove(state.arena, state.player, 1, state);
    if (event.key === "ArrowDown" || event.code === "KeyS") {
      const result = playerDrop(state.arena, state.player, state, true);
      state.player.visualY = state.player.pos.y;
      if (result === "lock") lockPiece("small");
      updateStats();
    }
    if (event.key === "ArrowUp" || event.code === "KeyW") playerRotate(state.arena, state.player, state, 1);
    if (event.key.toLowerCase() === "r" && state.gameStarted) restartGame();
  }

  async function handleFullscreenClick() {
    try {
      animateElement(dom.gameSection, "enter-fullscreen");
      if (document.fullscreenElement) await document.exitFullscreen();
      else await dom.gameSection.requestFullscreen();
    } catch (error) {
      console.warn("Fullscreen failed:", error);
    }
  }

  function handleSpeedToggle() {
    state.speedIncreaseEnabled = dom.speedIncreaseToggle.checked;
    refreshLevelAndSpeed(state, state.speedIncreaseEnabled);
    dropInterval = getDropInterval(state, state.speedIncreaseEnabled);
    updateStats();
    bounceElement(dom.speedIncreaseToggle);
  }

  setupInputHandlers(dom, {
    onKeydown: handleKeydown,
    onBeginClick: startGame,
    onPlayAgainClick: startGame,
    onRestartClick: restartGame,
    onPauseClick: togglePause,
    onSettingsClick: openSettingsModal,
    onCloseSettings: closeSettingsModal,
    onGameBoardClick: () => { if (state.paused) resumeGame(); },
    onFullscreenClick: handleFullscreenClick,
    onSpeedToggle: handleSpeedToggle,
    onTabClick: activateSettingsTab
  });

  dom.settingsModal.addEventListener("animationend", () => {
    if (dom.settingsModal.classList.contains("closing")) {
      dom.settingsModal.classList.add("hidden");
      dom.settingsModal.classList.remove("closing");
      dom.settingsModal.setAttribute("aria-hidden", "true");
    }
  });

  document.addEventListener("fullscreenchange", () => {
    dom.fullscreenButton.innerText = document.fullscreenElement ? EXIT_FULLSCREEN_LABEL : FULLSCREEN_LABEL;
    animateElement(dom.gameSection, "enter-fullscreen");
    drawGame(state, dom);
  });

  window.addEventListener("resize", () => drawGame(state, dom));

  function update(time = 0) {
    const deltaTime = time - state.lastTime;
    state.lastTime = time;

    if (canMove(state)) {
      state.dropCounter += deltaTime;
      if (state.dropCounter > dropInterval) {
        const result = playerDrop(state.arena, state.player, state, false);
        if (result === "lock") lockPiece();
      }
    }

    updateVisualPosition();
    drawGame(state, dom);
    requestAnimationFrame(update);
  }

  refreshLevelAndSpeed(state, state.speedIncreaseEnabled);
  dropInterval = getDropInterval(state, state.speedIncreaseEnabled);
  updateStats();
  dom.pauseButton.innerText = PAUSE_LABEL;
  dom.fullscreenButton.innerText = FULLSCREEN_LABEL;
  drawGame(state, dom);
  update();
}
