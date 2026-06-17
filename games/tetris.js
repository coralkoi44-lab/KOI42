export function initTetris() {
  const aestheticButton = document.getElementById("aestheticButton");
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

  context.scale(20, 20);
  nextContext.scale(20, 20);

  const arena = createMatrix(12, 20);

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

  aestheticButton.addEventListener("click", () => {
    document.body.classList.toggle("aesthetic-mode");
  });

  controlsButton.addEventListener("click", () => {
    controlsModal.classList.remove("hidden");
  });

  closeControlsButton.addEventListener("click", () => {
    controlsModal.classList.add("hidden");
  });

  fullscreenButton.addEventListener("click", async () => {
    if (!document.fullscreenElement) {
      await gameSection.requestFullscreen();
      fullscreenButton.innerText = "EXIT FULLSCREEN";
    } else {
      await document.exitFullscreen();
      fullscreenButton.innerText = "FULLSCREEN";
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.innerText = document.fullscreenElement
      ? "EXIT FULLSCREEN"
      : "FULLSCREEN";
  });

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
      let full = true;

      for (let x = 0; x < arena[y].length; x++) {
        if (arena[y][x] === 0) {
          full = false;
          break;
        }
      }

      if (full) {
        lines.push(y);
      }
    }

    return lines;
  }

  function startLineClearAnimation(lines) {
    lineClearAnimation = {
      lines,
      startTime: performance.now(),
      duration: 360
    };
  }

  function finishLineClear(lines) {
    lines
      .sort((a, b) => b - a)
      .forEach(y => {
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
      });

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
      Math.floor(arena[0].length / 2) -
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

  function drawMatrix(matrix, offset, drawingContext = context) {
    if (!matrix) return;

    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawingContext.fillStyle = getComputedStyle(document.body).color;
          drawingContext.fillRect(x + offset.x, y + offset.y, 1, 1);
        }
      });
    });
  }

  function drawGrid() {
    context.strokeStyle = getComputedStyle(document.body).color;
    context.lineWidth = 0.03;

    for (let x = 0; x < 12; x++) {
      for (let y = 0; y < 20; y++) {
        context.strokeRect(x, y, 1, 1);
      }
    }
  }

  function drawNextPiece() {
    nextContext.fillStyle = getComputedStyle(document.body).backgroundColor;
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    nextContext.strokeStyle = getComputedStyle(document.body).color;
    nextContext.lineWidth = 0.03;

    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 6; y++) {
        nextContext.strokeRect(x, y, 1, 1);
      }
    }

    if (!player.nextMatrix) return;

    const matrix = player.nextMatrix;
    const offset = {
      x: Math.floor((6 - matrix[0].length) / 2),
      y: Math.floor((6 - matrix.length) / 2)
    };

    drawMatrix(matrix, offset, nextContext);
  }

  function drawAnimatedArena() {
    if (!lineClearAnimation) {
      drawMatrix(arena, { x: 0, y: 0 });
      return;
    }

    const now = performance.now();
    const elapsed = now - lineClearAnimation.startTime;
    const progress = Math.min(elapsed / lineClearAnimation.duration, 1);
    const fallOffset = easeIn(progress);

    const clearLines = lineClearAnimation.lines;

    arena.forEach((row, y) => {
      if (clearLines.includes(y)) {
        if (progress < 0.55) {
          context.globalAlpha = 1 - progress * 1.8;
          drawMatrix([row], { x: 0, y });
          context.globalAlpha = 1;
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

  function easeIn(t) {
    return t * t * t;
  }

  function draw() {
    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
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

  draw();
  update();
}
