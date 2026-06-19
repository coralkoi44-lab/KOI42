export function initTetris() {
  const gameBoard = document.getElementById("gameBoard");
  const gameSection = document.getElementById("gameSection");
  const startScreen = document.getElementById("startScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const beginButton = document.getElementById("beginButton");
  const playAgainButton = document.getElementById("playAgainButton");
  const restartButton = document.getElementById("restartButton");
  const controlsButton = document.getElementById("controlsButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const controlsModal = document.getElementById("controlsModal");
  const closeControlsButton = document.getElementById("closeControlsButton");
  const canvas = document.getElementById("tetris");
  const nextCanvas = document.getElementById("nextPiece");
  const scoreElement = document.getElementById("score");

  const context = canvas.getContext("2d");
  const nextContext = nextCanvas.getContext("2d");
  const COLS = 12;
  const ROWS = 20;
  const NEXT_SIZE = 6;
  const BORDER_WIDTH = 3;
  const FILL_OVERLAP = 0.03;
  const PIECES = "TJLOSZI";

  const arena = createMatrix(COLS, ROWS);
  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    nextMatrix: null,
    score: 0,
    pieceId: 0,
    nextPieceId: 1
  };

  let gameStarted = false;
  let gameOver = false;
  let dropCounter = 0;
  let dropInterval = 700;
  let lastTime = 0;
  let lineClearAnimation = null;
  let pieceIdCounter = 1;

  controlsButton.addEventListener("click", () => controlsModal.classList.remove("hidden"));
  closeControlsButton.addEventListener("click", () => controlsModal.classList.add("hidden"));
  beginButton.addEventListener("click", startGame);
  playAgainButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", restartGame);

  fullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await gameSection.requestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen failed:", error);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.innerText = document.fullscreenElement ? "EXIT FULLSCREEN" : "FULLSCREEN";
    requestAnimationFrame(draw);
  });

  window.addEventListener("resize", draw);
  document.addEventListener("keydown", handleKeydown);

  function createMatrix(width, height) {
    return Array.from({ length: height }, () => new Array(width).fill(null));
  }

  function createPiece(type) {
    const pieces = {
      T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      O: [[2, 2], [2, 2]],
      L: [[0, 3, 0], [0, 3, 0], [0, 3, 3]],
      J: [[0, 4, 0], [0, 4, 0], [4, 4, 0]],
      I: [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]],
      S: [[0, 6, 6], [6, 6, 0], [0, 0, 0]],
      Z: [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
    };

    return pieces[type];
  }

  function randomPiece() {
    return createPiece(PIECES[Math.floor(Math.random() * PIECES.length)]);
  }

  function resizeCanvas(canvasElement, drawingContext, cols, rows) {
    const pixelRatio = window.devicePixelRatio || 1;
    const rect = canvasElement.getBoundingClientRect();

    canvasElement.width = Math.round(rect.width * pixelRatio);
    canvasElement.height = Math.round(rect.height * pixelRatio);
    drawingContext.setTransform(canvasElement.width / cols, 0, 0, canvasElement.height / rows, 0, 0);
  }

  function resizeCanvases() {
    resizeCanvas(canvas, context, COLS, ROWS);
    resizeCanvas(nextCanvas, nextContext, NEXT_SIZE, NEXT_SIZE);
  }

  function hasCell(cell) {
    return cell !== null && cell !== 0;
  }

  function collide(arena, player) {
    return player.matrix.some((row, y) => row.some((value, x) => (
      value !== 0 && hasCell(arena[y + player.pos.y]?.[x + player.pos.x])
    )));
  }

  function merge(arena, player) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          arena[y + player.pos.y][x + player.pos.x] = {
            type: value,
            pieceId: player.pieceId
          };
        }
      });
    });
  }

  function rotate(matrix, direction) {
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < y; x++) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
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

      if (offset > player.matrix[0].length) {
        rotate(player.matrix, -direction);
        player.pos.x = startX;
        return;
      }
    }
  }

  function playerMove(direction) {
    if (!canMove()) return;

    player.pos.x += direction;
    if (collide(arena, player)) player.pos.x -= direction;
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

  function playerHardDrop() {
    if (!canMove()) return;

    while (!collide(arena, player)) player.pos.y++;
    player.pos.y--;
    lockPiece("small");
    dropCounter = 0;
  }

  function canMove() {
    return gameStarted && !gameOver && !lineClearAnimation;
  }

  function lockPiece(impactType) {
    merge(arena, player);
    if (impactType) triggerImpact(impactType);

    const clearedLines = findFullLines();
    if (clearedLines.length > 0) finishLineClear(clearedLines);
    else {
      playerReset();
      updateScore();
    }
  }

  function findFullLines() {
    const lines = [];

    for (let y = arena.length - 1; y >= 0; y--) {
      if (arena[y].every(hasCell)) lines.push(y);
    }

    return lines;
  }

  function finishLineClear(lines) {
    const clearedSet = new Set(lines);
    const remainingRows = arena.filter((row, y) => !clearedSet.has(y));
    const newArena = [
      ...createMatrix(COLS, arena.length - remainingRows.length),
      ...remainingRows
    ];

    arena.forEach((row, y) => row.splice(0, row.length, ...newArena[y]));

    let rowCount = 1;
    lines.forEach(() => {
      player.score += rowCount * 10;
      rowCount *= 2;
    });

    lineClearAnimation = null;
    triggerImpact("big");
    playerReset();
    updateScore();
  }

  function playerReset() {
    player.matrix = player.nextMatrix || randomPiece();
    player.pieceId = player.nextPieceId || pieceIdCounter++;
    player.nextMatrix = randomPiece();
    player.nextPieceId = pieceIdCounter++;
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);

    if (collide(arena, player)) endGame();
  }

  function triggerImpact(type) {
    const className = type === "big" ? "impact-big" : "impact-small";

    gameBoard.classList.remove("impact-big", "impact-small");
    void gameBoard.offsetWidth;
    gameBoard.classList.add(className);

    setTimeout(() => gameBoard.classList.remove(className), type === "big" ? 260 : 180);
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
        if (hasCell(cell)) {
          drawingContext.fillRect(
            x + offset.x - FILL_OVERLAP,
            y + offset.y - FILL_OVERLAP,
            1 + FILL_OVERLAP * 2,
            1 + FILL_OVERLAP * 2
          );
        }
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
        const hasSamePieceNeighbor = (neighborX, neighborY) => (
          cellPieceId(matrix[neighborY]?.[neighborX], fallbackPieceId) === currentPieceId
        );

        const left = x + offset.x;
        const top = y + offset.y;
        const right = left + 1;
        const bottom = top + 1;

        if (!hasSamePieceNeighbor(x, y - 1)) {
          drawingContext.fillRect(left - halfWidth, top - halfWidth, 1 + width, width);
        }

        if (!hasSamePieceNeighbor(x + 1, y)) {
          drawingContext.fillRect(right - halfWidth, top - halfWidth, width, 1 + width);
        }

        if (!hasSamePieceNeighbor(x, y + 1)) {
          drawingContext.fillRect(left - halfWidth, bottom - halfWidth, 1 + width, width);
        }

        if (!hasSamePieceNeighbor(x - 1, y)) {
          drawingContext.fillRect(left - halfWidth, top - halfWidth, width, 1 + width);
        }
      });
    });
  }

  function drawNextPiece() {
    nextContext.fillStyle = getComputedStyle(document.body).backgroundColor;
    nextContext.fillRect(0, 0, NEXT_SIZE, NEXT_SIZE);
    drawGrid(nextContext, nextCanvas, NEXT_SIZE, NEXT_SIZE);

    if (!player.nextMatrix) return;

    const usedCells = [];
    player.nextMatrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (hasCell(value)) usedCells.push({ x, y });
      });
    });

    const minX = Math.min(...usedCells.map(cell => cell.x));
    const maxX = Math.max(...usedCells.map(cell => cell.x));
    const minY = Math.min(...usedCells.map(cell => cell.y));
    const maxY = Math.max(...usedCells.map(cell => cell.y));

    const offset = {
      x: Math.round((NEXT_SIZE - (maxX - minX + 1)) / 2 - minX),
      y: Math.round((NEXT_SIZE - (maxY - minY + 1)) / 2 - minY)
    };

    drawMatrix(player.nextMatrix, offset, nextContext, nextCanvas, NEXT_SIZE, player.nextPieceId);
  }

  function draw() {
    resizeCanvases();

    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, COLS, ROWS);

    drawGrid(context, canvas, COLS, ROWS);
    drawMatrix(arena, { x: 0, y: 0 });

    if (canMove()) drawMatrix(player.matrix, player.pos, context, canvas, COLS, player.pieceId);

    drawNextPiece();
  }

  function updateScore() {
    scoreElement.innerText = player.score;
  }

  function startGame() {
    arena.forEach(row => row.fill(null));
    player.score = 0;
    player.matrix = null;
    player.nextMatrix = randomPiece();
    player.nextPieceId = pieceIdCounter++;

    gameStarted = true;
    gameOver = false;
    lineClearAnimation = null;
    dropCounter = 0;
    lastTime = 0;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    updateScore();
    playerReset();
    draw();
  }

  function restartGame() {
    startGame();
  }

  function endGame() {
    gameOver = true;
    gameStarted = false;
    gameOverScreen.classList.remove("hidden");
    triggerImpact("big");
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

    if (event.key === "Escape") controlsModal.classList.add("hidden");
    if (event.key === "ArrowLeft" || event.code === "KeyA") playerMove(-1);
    if (event.key === "ArrowRight" || event.code === "KeyD") playerMove(1);
    if (event.key === "ArrowDown" || event.code === "KeyS") playerDrop(true);
    if (event.key === "ArrowUp" || event.code === "KeyW") playerRotate(1);
    if (event.code === "Space") playerHardDrop();
    if (event.key.toLowerCase() === "r" && gameStarted) restartGame();
  }

  resizeCanvases();
  draw();
  update();
}
