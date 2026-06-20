import {
  BASE_DROP_INTERVAL,
  BORDER_WIDTH,
  COLS,
  EXIT_FULLSCREEN_LABEL,
  FILL_OVERLAP,
  FULLSCREEN_LABEL,
  NEXT_SIZE,
  PAUSE_LABEL,
  RESUME_LABEL,
  ROWS
} from "./tetris/constants.js";
import { getTetrisDom } from "./tetris/dom.js";
import { copyCell, createMatrix, createPiece, hasCell, refillBag, rotateMatrix } from "./tetris/pieces.js";
import { calculateDropInterval, calculateLevel, scoreLineClear } from "./tetris/scoring.js";

export function initTetris() {
  const dom = getTetrisDom();
  if (!dom) return;

  const arena = createMatrix(COLS, ROWS);
  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    type: null,
    rotation: 0,
    nextMatrix: null,
    nextType: null,
    score: 0,
    level: 1,
    lines: 0,
    combo: -1,
    backToBack: false,
    pieceId: 0,
    nextPieceId: 1,
    lastAction: null
  };

  let gameStarted = false;
  let gameOver = false;
  let paused = false;
  let dropCounter = 0;
  let dropInterval = BASE_DROP_INTERVAL;
  let lastTime = 0;
  let pieceIdCounter = 1;
  let bag = [];
  let speedIncreaseEnabled = dom.speedIncreaseToggle.checked;

  dom.beginButton.addEventListener("click", startGame);
  dom.playAgainButton.addEventListener("click", startGame);
  dom.restartButton.addEventListener("click", restartGame);
  dom.pauseButton.addEventListener("click", togglePause);
  dom.settingsButton.addEventListener("click", openSettingsModal);
  dom.closeSettingsButton.addEventListener("click", closeSettingsModal);

  dom.gameBoard.addEventListener("pointerdown", () => {
    if (paused) resumeGame();
  });

  dom.settingsModal.addEventListener("click", (event) => {
    if (event.target === dom.settingsModal) closeSettingsModal();
  });

  dom.speedIncreaseToggle.addEventListener("change", () => {
    speedIncreaseEnabled = dom.speedIncreaseToggle.checked;
    refreshLevelAndSpeed();
    updateStats();
    bounceElement(dom.speedIncreaseToggle);
  });

  dom.settingsTabs.forEach((tab) => {
    tab.addEventListener("click", () => activateSettingsTab(tab.dataset.tab));
  });

  dom.settingsModal.addEventListener("animationend", () => {
    if (dom.settingsModal.classList.contains("closing")) {
      dom.settingsModal.classList.add("hidden");
      dom.settingsModal.classList.remove("closing");
      dom.settingsModal.setAttribute("aria-hidden", "true");
    }
  });

  dom.fullscreenButton.addEventListener("click", async () => {
    try {
      animateElement(dom.gameSection, "enter-fullscreen");
      if (document.fullscreenElement) await document.exitFullscreen();
      else await dom.gameSection.requestFullscreen();
    } catch (error) {
      console.warn("Fullscreen failed:", error);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    dom.fullscreenButton.innerText = document.fullscreenElement ? EXIT_FULLSCREEN_LABEL : FULLSCREEN_LABEL;
    animateElement(dom.gameSection, "enter-fullscreen");
    requestAnimationFrame(draw);
  });

  window.addEventListener("resize", draw);
  document.addEventListener("keydown", handleKeydown);

  function nextFromBag() {
    if (bag.length === 0) bag = refillBag();
    const type = bag.pop();
    return { type, matrix: createPiece(type) };
  }

  function resizeCanvas(canvasElement, drawingContext, cols, rows) {
    const pixelRatio = window.devicePixelRatio || 1;
    const rect = canvasElement.getBoundingClientRect();
    canvasElement.width = Math.max(1, Math.round(rect.width * pixelRatio));
    canvasElement.height = Math.max(1, Math.round(rect.height * pixelRatio));
    drawingContext.setTransform(canvasElement.width / cols, 0, 0, canvasElement.height / rows, 0, 0);
  }

  function resizeCanvases() {
    resizeCanvas(dom.canvas, dom.context, COLS, ROWS);
    resizeCanvas(dom.nextCanvas, dom.nextContext, NEXT_SIZE, NEXT_SIZE);
  }

  function collide(arenaToCheck, playerToCheck) {
    if (!playerToCheck.matrix) return false;

    return playerToCheck.matrix.some((row, y) => row.some((value, x) => {
      if (value === 0) return false;
      const arenaX = x + playerToCheck.pos.x;
      const arenaY = y + playerToCheck.pos.y;
      if (arenaX < 0 || arenaX >= COLS || arenaY >= ROWS) return true;
      if (arenaY < 0) return false;
      return hasCell(arenaToCheck[arenaY]?.[arenaX]);
    }));
  }

  function merge() {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value === 0) return;
        const arenaY = y + player.pos.y;
        const arenaX = x + player.pos.x;
        if (arenaY < 0 || arenaY >= ROWS || arenaX < 0 || arenaX >= COLS) return;
        arena[arenaY][arenaX] = { type: value, pieceId: player.pieceId, tetromino: player.type };
      });
    });
  }

  function playerRotate(direction) {
    if (!canMove()) return;

    const startX = player.pos.x;
    const startY = player.pos.y;
    const startMatrix = player.matrix;
    const startRotation = player.rotation;
    const rotated = rotateMatrix(player.matrix, direction);
    const nextRotation = (player.rotation + direction + 4) % 4;
    const kicks = [0, 1, -1, 2, -2];

    player.matrix = rotated;
    player.rotation = nextRotation;

    for (const offsetX of kicks) {
      player.pos.x = startX + offsetX;
      if (!collide(arena, player)) {
        player.lastAction = "rotate";
        return;
      }
    }

    player.pos.y = startY - 1;
    for (const offsetX of kicks) {
      player.pos.x = startX + offsetX;
      if (!collide(arena, player)) {
        player.lastAction = "rotate";
        return;
      }
    }

    player.matrix = startMatrix;
    player.rotation = startRotation;
    player.pos.x = startX;
    player.pos.y = startY;
  }

  function playerMove(direction) {
    if (!canMove()) return;
    player.pos.x += direction;
    if (collide(arena, player)) player.pos.x -= direction;
    else player.lastAction = "move";
  }

  function playerDrop(isManual = false) {
    if (!canMove()) return;
    player.pos.y++;

    if (collide(arena, player)) {
      player.pos.y--;
      lockPiece(isManual ? "small" : null);
    } else if (isManual) {
      player.score += 1;
      player.lastAction = "drop";
      updateStats();
    }

    dropCounter = 0;
  }

  function canMove() {
    return gameStarted && !gameOver && !paused && player.matrix;
  }

  function lockPiece(impactType) {
    const spin = getTSpinType();
    merge();
    if (impactType) triggerImpact(impactType);
    finishLineClear(findFullLines(), spin);
  }

  function findFullLines() {
    const lines = [];
    for (let y = arena.length - 1; y >= 0; y--) {
      if (arena[y].every(hasCell)) lines.push(y);
    }
    return lines;
  }

  function finishLineClear(lines, spin) {
    if (lines.length > 0) {
      const clearedSet = new Set(lines);
      const keptRows = arena.filter((row, y) => !clearedSet.has(y)).map((row) => row.map(copyCell));
      const rebuiltArena = [...createMatrix(COLS, ROWS - keptRows.length), ...keptRows];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) arena[y][x] = rebuiltArena[y][x];
    }

    scoreLineClear(player, lines.length, spin, isPerfectClear(), speedIncreaseEnabled);
    refreshLevelAndSpeed();
    if (lines.length > 0) triggerImpact("big");
    playerReset();
    updateStats();
  }

  function getTSpinType() {
    if (player.type !== "T" || player.lastAction !== "rotate") return null;

    const centerX = player.pos.x + 1;
    const centerY = player.pos.y + 1;
    const corners = [
      [centerX - 1, centerY - 1],
      [centerX + 1, centerY - 1],
      [centerX - 1, centerY + 1],
      [centerX + 1, centerY + 1]
    ];
    const occupied = corners.filter(isBlockedCorner).length;
    if (occupied < 3) return null;

    const frontCornersByRotation = [
      [[centerX - 1, centerY - 1], [centerX + 1, centerY - 1]],
      [[centerX + 1, centerY - 1], [centerX + 1, centerY + 1]],
      [[centerX - 1, centerY + 1], [centerX + 1, centerY + 1]],
      [[centerX - 1, centerY - 1], [centerX - 1, centerY + 1]]
    ];
    const frontOccupied = frontCornersByRotation[player.rotation].filter(isBlockedCorner).length;
    return frontOccupied >= 2 ? "tspin" : "mini";
  }

  function isBlockedCorner([x, y]) {
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y < 0) return false;
    return hasCell(arena[y]?.[x]);
  }

  function isPerfectClear() {
    return arena.every((row) => row.every((cell) => !hasCell(cell)));
  }

  function refreshLevelAndSpeed() {
    player.level = calculateLevel(player.lines, speedIncreaseEnabled);
    dropInterval = calculateDropInterval(player.level, speedIncreaseEnabled);
  }

  function playerReset() {
    player.matrix = player.nextMatrix;
    player.type = player.nextType;
    player.rotation = 0;
    player.pieceId = player.nextPieceId || pieceIdCounter++;

    const next = nextFromBag();
    player.nextMatrix = next.matrix;
    player.nextType = next.type;
    player.nextPieceId = pieceIdCounter++;
    player.lastAction = null;
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);

    if (collide(arena, player)) endGame();
  }

  function triggerImpact(type) {
    animateElement(dom.gameBoard, type === "big" ? "impact-big" : "impact-small", type === "big" ? 260 : 180);
  }

  function lineWidth(canvasElement, cols) {
    return BORDER_WIDTH / (canvasElement.getBoundingClientRect().width / cols);
  }

  function themeColor(property) {
    return getComputedStyle(document.body).getPropertyValue(property).trim();
  }

  function drawGrid(drawingContext, canvasElement, cols, rows) {
    drawingContext.strokeStyle = getComputedStyle(document.body).color;
    drawingContext.lineWidth = lineWidth(canvasElement, cols);
    drawingContext.lineCap = "square";
    drawingContext.beginPath();
    for (let x = 0; x <= cols; x++) {
      drawingContext.moveTo(x, 0);
      drawingContext.lineTo(x, rows);
    }
    for (let y = 0; y <= rows; y++) {
      drawingContext.moveTo(0, y);
      drawingContext.lineTo(cols, y);
    }
    drawingContext.stroke();
  }

  function cellPieceId(cell, fallbackPieceId) {
    if (!hasCell(cell)) return null;
    return typeof cell === "object" ? cell.pieceId : fallbackPieceId;
  }

  function drawMatrix(matrix, offset, drawingContext = dom.context, canvasElement = dom.canvas, cols = COLS, fallbackPieceId = null) {
    if (!matrix) return;
    drawingContext.fillStyle = themeColor("--accent");
    matrix.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (hasCell(cell)) drawingContext.fillRect(x + offset.x - FILL_OVERLAP, y + offset.y - FILL_OVERLAP, 1 + FILL_OVERLAP * 2, 1 + FILL_OVERLAP * 2);
      });
    });
    drawPieceOutlines(matrix, offset, drawingContext, canvasElement, cols, fallbackPieceId);
  }

  function drawPieceOutlines(matrix, offset, drawingContext, canvasElement, cols, fallbackPieceId) {
    const width = lineWidth(canvasElement, cols);
    const halfWidth = width / 2;
    drawingContext.fillStyle = getComputedStyle(document.body).color;
    matrix.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!hasCell(cell)) return;
        const currentPieceId = cellPieceId(cell, fallbackPieceId);
        const hasSamePieceNeighbor = (neighborX, neighborY) => cellPieceId(matrix[neighborY]?.[neighborX], fallbackPieceId) === currentPieceId;
        const left = x + offset.x;
        const top = y + offset.y;
        const right = left + 1;
        const bottom = top + 1;
        if (!hasSamePieceNeighbor(x, y - 1)) drawingContext.fillRect(left - halfWidth, top - halfWidth, 1 + width, width);
        if (!hasSamePieceNeighbor(x + 1, y)) drawingContext.fillRect(right - halfWidth, top - halfWidth, width, 1 + width);
        if (!hasSamePieceNeighbor(x, y + 1)) drawingContext.fillRect(left - halfWidth, bottom - halfWidth, 1 + width, width);
        if (!hasSamePieceNeighbor(x - 1, y)) drawingContext.fillRect(left - halfWidth, top - halfWidth, width, 1 + width);
      });
    });
  }

  function drawNextPiece() {
    dom.nextContext.fillStyle = getComputedStyle(document.body).backgroundColor;
    dom.nextContext.fillRect(0, 0, NEXT_SIZE, NEXT_SIZE);
    drawGrid(dom.nextContext, dom.nextCanvas, NEXT_SIZE, NEXT_SIZE);
    if (!player.nextMatrix) return;

    const usedCells = [];
    player.nextMatrix.forEach((row, y) => row.forEach((value, x) => { if (hasCell(value)) usedCells.push({ x, y }); }));
    if (usedCells.length === 0) return;

    const minX = Math.min(...usedCells.map((cell) => cell.x));
    const maxX = Math.max(...usedCells.map((cell) => cell.x));
    const minY = Math.min(...usedCells.map((cell) => cell.y));
    const maxY = Math.max(...usedCells.map((cell) => cell.y));
    const offset = { x: Math.round((NEXT_SIZE - (maxX - minX + 1)) / 2 - minX), y: Math.round((NEXT_SIZE - (maxY - minY + 1)) / 2 - minY) };
    drawMatrix(player.nextMatrix, offset, dom.nextContext, dom.nextCanvas, NEXT_SIZE, player.nextPieceId);
  }

  function draw() {
    resizeCanvases();
    dom.context.fillStyle = getComputedStyle(document.body).backgroundColor;
    dom.context.fillRect(0, 0, COLS, ROWS);
    drawGrid(dom.context, dom.canvas, COLS, ROWS);
    drawMatrix(arena, { x: 0, y: 0 });
    if (gameStarted && !gameOver && player.matrix) drawMatrix(player.matrix, player.pos, dom.context, dom.canvas, COLS, player.pieceId);
    drawNextPiece();
  }

  function updateStats() {
    dom.scoreElement.innerText = player.score;
    dom.levelElement.innerText = player.level;
    dom.linesElement.innerText = player.lines;
  }

  function startGame() {
    arena.forEach((row) => row.fill(null));
    bag = [];
    player.score = 0;
    player.level = 1;
    player.lines = 0;
    player.combo = -1;
    player.backToBack = false;
    player.matrix = null;
    player.lastAction = null;

    const next = nextFromBag();
    player.nextMatrix = next.matrix;
    player.nextType = next.type;
    player.nextPieceId = pieceIdCounter++;
    gameStarted = true;
    gameOver = false;
    paused = false;
    dropCounter = 0;
    lastTime = 0;
    dom.startScreen.classList.add("hidden");
    dom.pauseScreen.classList.add("hidden");
    dom.gameOverScreen.classList.add("hidden");
    dom.pauseButton.innerText = PAUSE_LABEL;
    speedIncreaseEnabled = dom.speedIncreaseToggle.checked;
    refreshLevelAndSpeed();
    updateStats();
    playerReset();
    draw();
  }

  function restartGame() {
    startGame();
  }

  function endGame() {
    gameOver = true;
    gameStarted = false;
    paused = false;
    dom.pauseScreen.classList.add("hidden");
    dom.gameOverScreen.classList.remove("hidden");
    dom.pauseButton.innerText = PAUSE_LABEL;
    triggerImpact("big");
  }

  function pauseGame() {
    if (!gameStarted || gameOver) return;
    paused = true;
    dom.pauseScreen.classList.remove("hidden");
    dom.pauseButton.innerText = RESUME_LABEL;
  }

  function resumeGame() {
    if (!gameStarted || gameOver) return;
    paused = false;
    dom.pauseScreen.classList.add("hidden");
    dom.pauseButton.innerText = PAUSE_LABEL;
    lastTime = performance.now();
    animateElement(dom.gameBoard, "resume-pop", 280);
  }

  function togglePause() {
    if (paused) resumeGame();
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
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function bounceElement(element) {
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "toggleBounce 0.24s ease";
  }

  function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (canMove()) {
      dropCounter += deltaTime;
      if (dropCounter > dropInterval) playerDrop(false);
    }

    draw();
    requestAnimationFrame(update);
  }

  function handleKeydown(event) {
    const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space", "KeyA", "KeyD", "KeyS", "KeyW"];
    if (gameStarted && gameKeys.includes(event.code)) event.preventDefault();
    if (event.key === "Escape") closeSettingsModal();

    if (event.code === "Space") {
      if (gameOver) startGame();
      else togglePause();
      return;
    }

    if (paused && gameKeys.includes(event.code)) resumeGame();
    if (event.key === "ArrowLeft" || event.code === "KeyA") playerMove(-1);
    if (event.key === "ArrowRight" || event.code === "KeyD") playerMove(1);
    if (event.key === "ArrowDown" || event.code === "KeyS") playerDrop(true);
    if (event.key === "ArrowUp" || event.code === "KeyW") playerRotate(1);
    if (event.key.toLowerCase() === "r" && gameStarted) restartGame();
  }

  resizeCanvases();
  refreshLevelAndSpeed();
  updateStats();
  dom.pauseButton.innerText = PAUSE_LABEL;
  dom.fullscreenButton.innerText = FULLSCREEN_LABEL;
  draw();
  update();
}
