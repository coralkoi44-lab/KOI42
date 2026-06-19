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
  const context = canvas.getContext("2d");

  const nextCanvas = document.getElementById("nextPiece");
  const nextContext = nextCanvas.getContext("2d");

  const scoreElement = document.getElementById("score");

  const COLS = 12;
  const ROWS = 20;
  const NEXT_SIZE = 6;
  const CANVAS_BORDER_WIDTH = 3;
  const BLOCK_FILL_OVERLAP = 0.03;

  const namedPiecePalettes = {
    bee: ["#FF9A3B", "#FF9029", "#FFA24B", "#FF7A1A", "#FFB35F", "#F28432", "#FF8A00"],
    "anti-bee": ["#FF9A3B", "#FF9029", "#FFA24B", "#FF7A1A", "#FFB35F", "#F28432", "#FF8A00"],
    heather: ["#FF94D4", "#FFBEE5", "#FFA0DC", "#FF7FCB", "#FFD2EE", "#F48AC8", "#FF66BE"],
    "anti-heather": ["#FF94D4", "#FFBEE5", "#FFA0DC", "#FF7FCB", "#FFD2EE", "#F48AC8", "#FF66BE"]
  };

  const arena = createMatrix(COLS, ROWS);

  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    nextMatrix: null,
    score: 0
  };

  let gameStarted = false;
  let gameOver = false;
  let dropCounter = 0;
  let dropInterval = 700;
  let lastTime = 0;
  let lineClearAnimation = null;

  controlsButton.addEventListener("click", () => {
    controlsModal.classList.remove("hidden");
  });

  closeControlsButton.addEventListener("click", () => {
    controlsModal.classList.add("hidden");
  });

  fullscreenButton.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await gameSection.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen failed:", error);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.innerText = document.fullscreenElement
      ? "EXIT FULLSCREEN"
      : "FULLSCREEN";

    requestAnimationFrame(() => {
      resizeCanvases();
      draw();
    });
  });

  window.addEventListener("resize", () => {
    resizeCanvases();
    draw();
  });

  function resizeCanvases() {
    const pixelRatio = window.devicePixelRatio || 1;

    const gameRect = canvas.getBoundingClientRect();
    canvas.width = Math.round(gameRect.width * pixelRatio);
    canvas.height = Math.round(gameRect.height * pixelRatio);
    context.setTransform(canvas.width / COLS, 0, 0, canvas.height / ROWS, 0, 0);

    const nextRect = nextCanvas.getBoundingClientRect();
    nextCanvas.width = Math.round(nextRect.width * pixelRatio);
    nextCanvas.height = Math.round(nextRect.height * pixelRatio);
    nextContext.setTransform(
      nextCanvas.width / NEXT_SIZE,
      0,
      0,
      nextCanvas.height / NEXT_SIZE,
      0,
      0
    );
  }

  function createMatrix(width, height) {
    const matrix = [];

    while (height--) {
      matrix.push(new Array(width).fill(0));
    }

    return matrix;
  }

  function createPiece(type) {
    if (type === "T") return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
    if (type === "O") return [[2, 2], [2, 2]];
    if (type === "L") return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
    if (type === "J") return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
    if (type === "I") return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
    if (type === "S") return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    if (type === "Z") return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
  }

  function randomPiece() {
    const pieces = "TJLOSZI";
    return createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
  }

  function collide(arena, player) {
    const matrix = player.matrix;
    const offset = player.pos;

    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (
          matrix[y][x] !== 0 &&
          (arena[y + offset.y] && arena[y + offset.y][x + offset.x]) !== 0
        ) {
          return true;
        }
      }
    }

    return false;
  }

  function merge(arena, player) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          arena[y + player.pos.y][x + player.pos.x] = value;
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

    if (direction > 0) {
      matrix.forEach(row => row.reverse());
    } else {
      matrix.reverse();
    }
  }

  function playerRotate(direction) {
    if (!gameStarted || gameOver || lineClearAnimation) return;

    const position = player.pos.x;
    let offset = 1;

    rotate(player.matrix, direction);

    while (collide(arena, player)) {
      player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));

      if (offset > player.matrix[0].length) {
        rotate(player.matrix, -direction);
        player.pos.x = position;
        return;
      }
    }
  }

  function playerMove(direction) {
    if (!gameStarted || gameOver || lineClearAnimation) return;

    player.pos.x += direction;

    if (collide(arena, player)) {
      player.pos.x -= direction;
    }
  }

  function playerDrop(isManual = false) {
    if (!gameStarted || gameOver || lineClearAnimation) return;

    player.pos.y++;

    if (collide(arena, player)) {
      player.pos.y--;
      lockPiece(isManual ? "small" : null);
    }

    dropCounter = 0;
  }

  function playerHardDrop() {
    if (!gameStarted || gameOver || lineClearAnimation) return;

    while (!collide(arena, player)) {
      player.pos.y++;
    }

    player.pos.y--;
    lockPiece("small");
    dropCounter = 0;
  }

  function lockPiece(impactType) {
    merge(arena, player);

    if (impactType) {
      triggerImpact(impactType);
    }

    const clearedLines = findFullLines();

    if (clearedLines.length > 0) {
      startLineClearAnimation(clearedLines);
    } else {
      playerReset();
      updateScore();
    }
  }

  function findFullLines() {
    const lines = [];

    for (let y = arena.length - 1; y >= 0; y--) {
      if (arena[y].every(cell => cell !== 0)) {
        lines.push(y);
      }
    }

    return lines;
  }

  function startLineClearAnimation(lines) {
    finishLineClear(lines);
  }

  function finishLineClear(lines) {
    const clearedSet = new Set(lines);
    const remainingRows = arena.filter((row, y) => !clearedSet.has(y));
    const emptyRowsNeeded = arena.length - remainingRows.length;

    const newArena = [
      ...createMatrix(COLS, emptyRowsNeeded),
      ...remainingRows
    ];

    for (let y = 0; y < arena.length; y++) {
      arena[y] = newArena[y];
    }

    let rowCount = 1;

    for (let i = 0; i < lines.length; i++) {
      player.score += rowCount * 10;
      rowCount *= 2;
    }

    lineClearAnimation = null;
    triggerImpact("big");
    playerReset();
    updateScore();
  }

  function playerReset() {
    if (!player.nextMatrix) {
      player.nextMatrix = randomPiece();
    }

    player.matrix = player.nextMatrix;
    player.nextMatrix = randomPiece();

    player.pos.y = 0;
    player.pos.x =
      Math.floor(COLS / 2) -
      Math.floor(player.matrix[0].length / 2);

    drawNextPiece();

    if (collide(arena, player)) {
      endGame();
    }
  }

  function triggerImpact(type) {
    const className = type === "big" ? "impact-big" : "impact-small";

    gameBoard.classList.remove("impact-big", "impact-small");
    void gameBoard.offsetWidth;
    gameBoard.classList.add(className);

    setTimeout(() => {
      gameBoard.classList.remove(className);
    }, type === "big" ? 260 : 180);
  }

  function getPieceColor(value) {
    const palette = getSevenColorPalette();
    return palette[(value - 1) % palette.length];
  }

  function getSevenColorPalette() {
    const themeName = document.body.dataset.theme || "bee";

    if (namedPiecePalettes[themeName]) {
      return namedPiecePalettes[themeName];
    }

    return generateCustomPaletteFromTextColor();
  }

  function generateCustomPaletteFromTextColor() {
    const textColor = parseColor(getComputedStyle(document.body).color);
    const base = rgbToHsl(textColor);
    const minLightness = base.l > 0.5 ? 0.24 : 0.38;
    const maxLightness = base.l > 0.5 ? 0.88 : 0.72;
    const saturation = clamp(base.s < 0.18 ? 0.58 : base.s + 0.12, 0.38, 0.95);

    const variants = [
      { h: 0, s: 0.08, l: 0 },
      { h: 18, s: 0.14, l: -0.16 },
      { h: -18, s: 0.1, l: 0.13 },
      { h: 42, s: 0.04, l: -0.28 },
      { h: -42, s: 0.16, l: 0.24 },
      { h: 74, s: -0.08, l: -0.08 },
      { h: -74, s: 0.2, l: 0.06 }
    ];

    return variants.map((variant) => {
      const h = wrapHue(base.h + variant.h);
      const s = clamp(saturation + variant.s, 0.32, 0.98);
      const l = clamp(base.l + variant.l, minLightness, maxLightness);
      return formatRgb(hslToRgb({ h, s, l }));
    });
  }

  function parseColor(color) {
    const normalized = color.trim();

    if (normalized.startsWith("#")) {
      const hex = normalized.slice(1);
      const fullHex = hex.length === 3
        ? hex.split("").map(char => char + char).join("")
        : hex;

      return {
        r: parseInt(fullHex.slice(0, 2), 16),
        g: parseInt(fullHex.slice(2, 4), 16),
        b: parseInt(fullHex.slice(4, 6), 16)
      };
    }

    const channels = normalized.match(/\d+(?:\.\d+)?/g)?.map(Number) || [255, 255, 255];

    return {
      r: channels[0],
      g: channels[1],
      b: channels[2]
    };
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      if (max === g) h = (b - r) / d + 2;
      if (max === b) h = (r - g) / d + 4;

      h *= 60;
    }

    return { h, s, l };
  }

  function hslToRgb({ h, s, l }) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  function formatRgb(color) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function wrapHue(hue) {
    return ((hue % 360) + 360) % 360;
  }

  function getLineColor() {
    return getComputedStyle(document.body).color;
  }

  function getGridLineWidth(drawingCanvas, cols) {
    const rect = drawingCanvas.getBoundingClientRect();
    const cellWidth = rect.width / cols;
    return CANVAS_BORDER_WIDTH / cellWidth;
  }

  function drawMatrix(matrix, offset, drawingContext = context, drawingCanvas = canvas, cols = COLS) {
    if (!matrix) return;

    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawingContext.fillStyle = getPieceColor(value);
          drawingContext.fillRect(
            x + offset.x - BLOCK_FILL_OVERLAP,
            y + offset.y - BLOCK_FILL_OVERLAP,
            1 + BLOCK_FILL_OVERLAP * 2,
            1 + BLOCK_FILL_OVERLAP * 2
          );
        }
      });
    });

    drawPieceOutlines(matrix, offset, drawingContext, drawingCanvas, cols);
  }

  function drawPieceOutlines(matrix, offset, drawingContext = context, drawingCanvas = canvas, cols = COLS) {
    drawingContext.strokeStyle = getLineColor();
    drawingContext.lineWidth = getGridLineWidth(drawingCanvas, cols);
    drawingContext.lineCap = "square";
    drawingContext.lineJoin = "miter";
    drawingContext.beginPath();

    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value === 0) return;

        const drawEdge = (neighborX, neighborY) => {
          const neighborRow = matrix[neighborY];
          const neighborValue = neighborRow ? neighborRow[neighborX] : 0;
          return neighborValue !== value;
        };

        const left = x + offset.x;
        const top = y + offset.y;
        const right = left + 1;
        const bottom = top + 1;

        if (drawEdge(x, y - 1)) {
          drawingContext.moveTo(left, top);
          drawingContext.lineTo(right, top);
        }

        if (drawEdge(x + 1, y)) {
          drawingContext.moveTo(right, top);
          drawingContext.lineTo(right, bottom);
        }

        if (drawEdge(x, y + 1)) {
          drawingContext.moveTo(right, bottom);
          drawingContext.lineTo(left, bottom);
        }

        if (drawEdge(x - 1, y)) {
          drawingContext.moveTo(left, bottom);
          drawingContext.lineTo(left, top);
        }
      });
    });

    drawingContext.stroke();
  }

  function drawGrid(drawingContext, drawingCanvas, cols, rows) {
    drawingContext.strokeStyle = getLineColor();
    drawingContext.lineWidth = getGridLineWidth(drawingCanvas, cols);
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

  function drawNextPiece() {
    nextContext.fillStyle = getComputedStyle(document.body).backgroundColor;
    nextContext.fillRect(0, 0, NEXT_SIZE, NEXT_SIZE);
    drawGrid(nextContext, nextCanvas, NEXT_SIZE, NEXT_SIZE);

    if (!player.nextMatrix) return;

    const matrix = player.nextMatrix;
    const usedCells = [];

    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          usedCells.push({ x, y });
        }
      });
    });

    const minX = Math.min(...usedCells.map(cell => cell.x));
    const maxX = Math.max(...usedCells.map(cell => cell.x));
    const minY = Math.min(...usedCells.map(cell => cell.y));
    const maxY = Math.max(...usedCells.map(cell => cell.y));

    const pieceWidth = maxX - minX + 1;
    const pieceHeight = maxY - minY + 1;

    const offset = {
      x: Math.round((NEXT_SIZE - pieceWidth) / 2 - minX),
      y: Math.round((NEXT_SIZE - pieceHeight) / 2 - minY)
    };

    drawMatrix(matrix, offset, nextContext, nextCanvas, NEXT_SIZE);
  }

  function drawAnimatedArena() {
    if (!lineClearAnimation) {
      drawMatrix(arena, { x: 0, y: 0 });
      return;
    }

    const now = performance.now();
    const elapsed = now - lineClearAnimation.startTime;
    const progress = Math.min(elapsed / lineClearAnimation.duration, 1);
    const fallOffset = easeOut(progress);
    const clearLines = lineClearAnimation.lines;

    arena.forEach((row, y) => {
      if (clearLines.includes(y)) {
        if (progress < 0.2) {
          context.fillStyle = getLineColor();
          context.fillRect(0, y, COLS, 1);
        }

        return;
      }

      const linesBelow = clearLines.filter(lineY => lineY > y).length;
      const animatedY = y + linesBelow * fallOffset;

      drawMatrix([row], { x: 0, y: animatedY });
    });

    if (progress >= 1) {
      finishLineClear(clearLines);
    }
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function draw() {
    resizeCanvases();

    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, COLS, ROWS);

    drawGrid(context, canvas, COLS, ROWS);
    drawAnimatedArena();

    if (gameStarted && !gameOver && !lineClearAnimation) {
      drawMatrix(player.matrix, player.pos);
    }

    drawNextPiece();
  }

  function updateScore() {
    scoreElement.innerText = player.score;
  }

  function startGame() {
    arena.forEach(row => row.fill(0));

    player.score = 0;
    player.matrix = null;
    player.nextMatrix = randomPiece();

    updateScore();

    gameStarted = true;
    gameOver = false;
    lineClearAnimation = null;
    dropCounter = 0;
    lastTime = 0;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

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

    if (gameStarted && !gameOver && !lineClearAnimation) {
      dropCounter += deltaTime;

      if (dropCounter > dropInterval) {
        playerDrop(false);
      }
    }

    draw();
    requestAnimationFrame(update);
  }

  document.addEventListener("keydown", event => {
    const gameKeys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowDown",
      "ArrowUp",
      "Space",
      "KeyA",
      "KeyD",
      "KeyS",
      "KeyW"
    ];

    if (gameStarted && gameKeys.includes(event.code)) {
      event.preventDefault();
    }

    if (event.key === "Escape") {
      controlsModal.classList.add("hidden");
    }

    if (event.key === "ArrowLeft" || event.code === "KeyA") {
      playerMove(-1);
    }

    if (event.key === "ArrowRight" || event.code === "KeyD") {
      playerMove(1);
    }

    if (event.key === "ArrowDown" || event.code === "KeyS") {
      playerDrop(true);
    }

    if (event.key === "ArrowUp" || event.code === "KeyW") {
      playerRotate(1);
    }

    if (event.code === "Space") {
      event.preventDefault();
      playerHardDrop();
    }

    if (event.key.toLowerCase() === "r" && gameStarted) {
      restartGame();
    }
  });

  beginButton.addEventListener("click", startGame);
  playAgainButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", restartGame);

  resizeCanvases();
  draw();
  update();
}
