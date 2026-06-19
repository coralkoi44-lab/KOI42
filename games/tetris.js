export function initTetris() {
  const gameBoard = document.getElementById("gameBoard");
  const gameSection = document.getElementById("gameSection");
  const startScreen = document.getElementById("startScreen");
  const pauseScreen = document.getElementById("pauseScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const beginButton = document.getElementById("beginButton");
  const playAgainButton = document.getElementById("playAgainButton");
  const restartButton = document.getElementById("restartButton");
  const settingsButton = document.getElementById("settingsButton");
  const pauseButton = document.getElementById("pauseButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsButton = document.getElementById("closeSettingsButton");
  const settingsTabs = document.querySelectorAll("[data-tab]");
  const settingsPanels = document.querySelectorAll(".settings-panel");
  const speedIncreaseToggle = document.getElementById("speedIncreaseToggle");
  const canvas = document.getElementById("tetris");
  const nextCanvas = document.getElementById("nextPiece");
  const scoreElement = document.getElementById("score");
  const levelElement = document.getElementById("level");
  const linesElement = document.getElementById("lines");

  const context = canvas.getContext("2d");
  const nextContext = nextCanvas.getContext("2d");
  const COLS = 10;
  const ROWS = 20;
  const NEXT_SIZE = 6;
  const BORDER_WIDTH = 3;
  const FILL_OVERLAP = 0.03;
  const BASE_DROP_INTERVAL = 700;
  const PIECES = ["T", "J", "L", "O", "S", "Z", "I"];
  const COLORS = { T: 1, O: 2, L: 3, J: 4, I: 5, S: 6, Z: 7 };

  const arena = createMatrix(COLS, ROWS);
  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    type: null,
    nextMatrix: null,
    nextType: null,
    score: 0,
    level: 1,
    lines: 0,
    combo: -1,
    backToBack: false,
    pieceId: 0,
    nextPieceId: 1,
    lastMoveWasRotate: false
  };

  let gameStarted = false;
  let gameOver = false;
  let paused = false;
  let dropCounter = 0;
  let dropInterval = BASE_DROP_INTERVAL;
  let lastTime = 0;
  let pieceIdCounter = 1;
  let bag = [];
  let speedIncreaseEnabled = true;

  beginButton.addEventListener("click", startGame);
  playAgainButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", restartGame);
  pauseButton.addEventListener("click", togglePause);
  settingsButton.addEventListener("click", openSettingsModal);
  closeSettingsButton.addEventListener("click", closeSettingsModal);

  gameBoard.addEventListener("pointerdown", () => {
    if (paused) resumeGame();
  });

  settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) closeSettingsModal();
  });

  speedIncreaseToggle.addEventListener("change", () => {
    speedIncreaseEnabled = speedIncreaseToggle.checked;
    bounceElement(speedIncreaseToggle);
    refreshLevelFromLines();
    updateSpeed();
    updateStats();
  });

  settingsTabs.forEach((tab) => {
    tab.addEventListener("click", () => activateSettingsTab(tab.dataset.tab));
  });

  settingsModal.addEventListener("animationend", () => {
    if (settingsModal.classList.contains("closing")) {
      settingsModal.classList.add("hidden");
      settingsModal.classList.remove("closing");
      settingsModal.setAttribute("aria-hidden", "true");
    }
  });

  fullscreenButton.addEventListener("click", async () => {
    try {
      animateElement(gameSection, "enter-fullscreen");
      if (document.fullscreenElement) await document.exitFullscreen();
      else await gameSection.requestFullscreen();
    } catch (error) {
      console.warn("Fullscreen failed:", error);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.innerText = document.fullscreenElement ? "EXIT FULLSCREEN" : "FULLSCREEN";
    animateElement(gameSection, "enter-fullscreen");
    requestAnimationFrame(draw);
  });

  window.addEventListener("resize", draw);
  document.addEventListener("keydown", handleKeydown);

  function createMatrix(width, height) {
    return Array.from({ length: height }, () => new Array(width).fill(null));
  }

  function createPiece(type) {
    const pieces = {
      T: [[0, COLORS.T, 0], [COLORS.T, COLORS.T, COLORS.T], [0, 0, 0]],
      O: [[COLORS.O, COLORS.O], [COLORS.O, COLORS.O]],
      L: [[0, COLORS.L, 0], [0, COLORS.L, 0], [0, COLORS.L, COLORS.L]],
      J: [[0, COLORS.J, 0], [0, COLORS.J, 0], [COLORS.J, COLORS.J, 0]],
      I: [[0, 0, 0, 0], [COLORS.I, COLORS.I, COLORS.I, COLORS.I], [0, 0, 0, 0], [0, 0, 0, 0]],
      S: [[0, COLORS.S, COLORS.S], [COLORS.S, COLORS.S, 0], [0, 0, 0]],
      Z: [[COLORS.Z, COLORS.Z, 0], [0, COLORS.Z, COLORS.Z], [0, 0, 0]]
    };

    return pieces[type].map(row => [...row]);
  }

  function refillBag() {
    bag = [...PIECES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  function nextFromBag() {
    if (bag.length === 0) refillBag();
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
    resizeCanvas(canvas, context, COLS, ROWS);
    resizeCanvas(nextCanvas, nextContext, NEXT_SIZE, NEXT_SIZE);
  }

  function hasCell(cell) {
    return cell !== null && cell !== undefined && cell !== 0;
  }

  function collide(arena, player) {
    return player.matrix.some((row, y) => row.some((value, x) => {
      if (value === 0) return false;
      const arenaX = x + player.pos.x;
      const arenaY = y + player.pos.y;
      if (arenaX < 0 || arenaX >= COLS || arenaY >= ROWS) return true;
      if (arenaY < 0) return false;
      return hasCell(arena[arenaY]?.[arenaX]);
    }));
  }

  function merge(arena, player) {
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

  function rotate(matrix, direction) {
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < y; x++) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
    if (direction > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
  }

  function playerRotate(direction) {
    if (!canMove()) return;
    const startX = player.pos.x;
    let offset = 1;
    rotate(player.matrix, direction);
    while (collide(arena, player)) {
      player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (Math.abs(offset) > player.matrix[0].length) {
        rotate(player.matrix, -direction);
        player.pos.x = startX;
        player.lastMoveWasRotate = false;
        return;
      }
    }
    player.lastMoveWasRotate = true;
  }

  function playerMove(direction) {
    if (!canMove()) return;
    player.pos.x += direction;
    if (collide(arena, player)) player.pos.x -= direction;
    else player.lastMoveWasRotate = false;
  }

  function playerDrop(isManual = false) {
    if (!canMove()) return;
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
      lockPiece(isManual ? "small" : null);
    }
    dropCounter = 0;
  }

  function canMove() {
    return gameStarted && !gameOver && !paused;
  }

  function lockPiece(impactType) {
    const spin = getTSpinType();
    merge(arena, player);
    if (impactType) triggerImpact(impactType);
    finishLineClear(findFullLines(), spin);
  }

  function findFullLines() {
    const lines = [];
    for (let y = arena.length - 1; y >= 0; y--) if (arena[y].every(hasCell)) lines.push(y);
    return lines;
  }

  function copyCell(cell) {
    return typeof cell === "object" && cell !== null ? { ...cell } : cell;
  }

  function finishLineClear(lines, spin) {
    if (lines.length > 0) {
      const clearedSet = new Set(lines);
      const keptRows = arena.filter((row, y) => !clearedSet.has(y)).map(row => row.map(copyCell));
      const rebuiltArena = [...createMatrix(COLS, ROWS - keptRows.length), ...keptRows];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) arena[y][x] = rebuiltArena[y][x];
    }

    awardScore(lines.length, spin);
    if (lines.length > 0) triggerImpact("big");
    playerReset();
    updateStats();
  }

  function getTSpinType() {
    if (player.type !== "T" || !player.lastMoveWasRotate) return null;
    const centerX = player.pos.x + 1;
    const centerY = player.pos.y + 1;
    const corners = [[centerX - 1, centerY - 1], [centerX + 1, centerY - 1], [centerX - 1, centerY + 1], [centerX + 1, centerY + 1]];
    const occupied = corners.filter(([x, y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && hasCell(arena[y]?.[x]))).length;
    if (occupied < 3) return null;
    const frontCorners = [[centerX - 1, centerY - 1], [centerX + 1, centerY - 1]];
    const frontOccupied = frontCorners.filter(([x, y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && hasCell(arena[y]?.[x]))).length;
    return frontOccupied >= 2 ? "tspin" : "mini";
  }

  function awardScore(lineCount, spin) {
    const level = player.level;
    let base = 0;
    let difficult = false;

    if (spin === "tspin") {
      base = [400, 800, 1200, 1600][lineCount] || 0;
      difficult = lineCount > 0;
    } else if (spin === "mini") {
      base = lineCount === 0 ? 100 : lineCount === 1 ? 200 : 400;
      difficult = lineCount > 0;
    } else {
      base = [0, 100, 300, 500, 800][lineCount] || 0;
      difficult = lineCount === 4;
    }

    if (difficult && player.backToBack) base = Math.floor(base * 1.5);

    if (lineCount > 0) {
      player.combo += 1;
      player.lines += lineCount;
      player.score += base * level;
      if (player.combo > 0) player.score += 50 * player.combo * level;
    } else {
      player.combo = -1;
      player.score += base * level;
    }

    if (difficult) player.backToBack = true;
    else if (lineCount > 0) player.backToBack = false;

    if (lineCount > 0 && isPerfectClear()) {
      const perfectClearBonus = [0, 800, 1200, 1800, 2000][lineCount] || 800;
      player.score += perfectClearBonus * level;
    }

    refreshLevelFromLines();
    updateSpeed();
  }

  function isPerfectClear() {
    return arena.every(row => row.every(cell => !hasCell(cell)));
  }

  function refreshLevelFromLines() {
    player.level = speedIncreaseEnabled ? Math.floor(player.lines / 10) + 1 : 1;
  }

  function updateSpeed() {
    dropInterval = speedIncreaseEnabled ? Math.max(90, BASE_DROP_INTERVAL - (player.level - 1) * 55) : BASE_DROP_INTERVAL;
  }

  function playerReset() {
    player.matrix = player.nextMatrix;
    player.type = player.nextType;
    player.pieceId = player.nextPieceId || pieceIdCounter++;
    const next = nextFromBag();
    player.nextMatrix = next.matrix;
    player.nextType = next.type;
    player.nextPieceId = pieceIdCounter++;
    player.lastMoveWasRotate = false;
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    if (collide(arena, player)) endGame();
  }

  function triggerImpact(type) {
    const className = type === "big" ? "impact-big" : "impact-small";
    animateElement(gameBoard, className, type === "big" ? 260 : 180);
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

  function drawMatrix(matrix, offset, drawingContext = context, canvasElement = canvas, cols = COLS, fallbackPieceId = null) {
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
    nextContext.fillStyle = getComputedStyle(document.body).backgroundColor;
    nextContext.fillRect(0, 0, NEXT_SIZE, NEXT_SIZE);
    drawGrid(nextContext, nextCanvas, NEXT_SIZE, NEXT_SIZE);
    if (!player.nextMatrix) return;
    const usedCells = [];
    player.nextMatrix.forEach((row, y) => row.forEach((value, x) => { if (hasCell(value)) usedCells.push({ x, y }); }));
    const minX = Math.min(...usedCells.map(cell => cell.x));
    const maxX = Math.max(...usedCells.map(cell => cell.x));
    const minY = Math.min(...usedCells.map(cell => cell.y));
    const maxY = Math.max(...usedCells.map(cell => cell.y));
    const offset = { x: Math.round((NEXT_SIZE - (maxX - minX + 1)) / 2 - minX), y: Math.round((NEXT_SIZE - (maxY - minY + 1)) / 2 - minY) };
    drawMatrix(player.nextMatrix, offset, nextContext, nextCanvas, NEXT_SIZE, player.nextPieceId);
  }

  function draw() {
    resizeCanvases();
    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, COLS, ROWS);
    drawGrid(context, canvas, COLS, ROWS);
    drawMatrix(arena, { x: 0, y: 0 });
    if (gameStarted && !gameOver && player.matrix) drawMatrix(player.matrix, player.pos, context, canvas, COLS, player.pieceId);
    drawNextPiece();
  }

  function updateStats() {
    scoreElement.innerText = player.score;
    levelElement.innerText = player.level;
    linesElement.innerText = player.lines;
  }

  function startGame() {
    arena.forEach(row => row.fill(null));
    bag = [];
    player.score = 0;
    player.level = 1;
    player.lines = 0;
    player.combo = -1;
    player.backToBack = false;
    player.matrix = null;
    const next = nextFromBag();
    player.nextMatrix = next.matrix;
    player.nextType = next.type;
    player.nextPieceId = pieceIdCounter++;
    gameStarted = true;
    gameOver = false;
    paused = false;
    dropCounter = 0;
    lastTime = 0;
    startScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseButton.innerText = "PAUSE";
    refreshLevelFromLines();
    updateSpeed();
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
    pauseScreen.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");
    pauseButton.innerText = "PAUSE";
    triggerImpact("big");
  }

  function pauseGame() {
    if (!gameStarted || gameOver) return;
    paused = true;
    pauseScreen.classList.remove("hidden");
    pauseButton.innerText = "RESUME";
  }

  function resumeGame() {
    if (!gameStarted || gameOver) return;
    paused = false;
    pauseScreen.classList.add("hidden");
    pauseButton.innerText = "PAUSE";
    lastTime = performance.now();
    animateElement(gameBoard, "resume-pop", 280);
  }

  function togglePause() {
    if (paused) resumeGame();
    else pauseGame();
  }

  function openSettingsModal() {
    settingsModal.classList.remove("hidden", "closing");
    settingsModal.setAttribute("aria-hidden", "false");
    pauseGame();
  }

  function closeSettingsModal() {
    if (settingsModal.classList.contains("hidden")) return;
    settingsModal.classList.add("closing");
  }

  function activateSettingsTab(tabId) {
    settingsTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tab === tabId));
    settingsPanels.forEach(panel => panel.classList.toggle("active", panel.id === tabId));
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
  updateSpeed();
  updateStats();
  draw();
  update();
}
