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

  aestheticButton.addEventListener("click", () => {
    document.body.classList.toggle("aesthetic-mode");
  });

  controlsButton.addEventListener("click", () => {
    controlsModal.classList.remove("hidden");
  });

  closeControlsButton.addEventListener("click", () => {
    controlsModal.classList.add("hidden");
  });

  fullscreenButton.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      gameSection.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  const canvas = document.getElementById("tetris");
  const context = canvas.getContext("2d");
  const scoreElement = document.getElementById("score");

  context.scale(20, 20);

  const arena = createMatrix(12, 20);

  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0
  };

  let gameStarted = false;
  let gameOver = false;
  let dropCounter = 0;
  let dropInterval = 700;
  let lastTime = 0;

  function createMatrix(width, height) {
    const matrix = [];

    while (height--) {
      matrix.push(new Array(width).fill(0));
    }

    return matrix;
  }

  function createPiece(type) {
    if (type === "T") {
      return [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ];
    }

    if (type === "O") {
      return [
        [2, 2],
        [2, 2]
      ];
    }

    if (type === "L") {
      return [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3]
      ];
    }

    if (type === "J") {
      return [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0]
      ];
    }

    if (type === "I") {
      return [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0]
      ];
    }

    if (type === "S") {
      return [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0]
      ];
    }

    if (type === "Z") {
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
      ];
    }
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
    if (!gameStarted || gameOver) return;

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
    if (!gameStarted || gameOver) return;

    player.pos.x += direction;

    if (collide(arena, player)) {
      player.pos.x -= direction;
    }
  }

  function lockPiece(impactType) {
    merge(arena, player);

    if (impactType) {
      triggerImpact(impactType);
    }

    playerReset();

    const clearedLines = arenaSweep();

    if (clearedLines > 0) {
      triggerImpact("big");
    }

    updateScore();
  }

  function playerDrop(isManual = false) {
    if (!gameStarted || gameOver) return;

    player.pos.y++;

    if (collide(arena, player)) {
      player.pos.y--;
      lockPiece(isManual ? "small" : null);
    }

    dropCounter = 0;
  }

  function playerHardDrop() {
    if (!gameStarted || gameOver) return;

    while (!collide(arena, player)) {
      player.pos.y++;
    }

    player.pos.y--;
    lockPiece("small");
    dropCounter = 0;
  }

  function playerReset() {
    const pieces = "TJLOSZI";

    player.matrix = createPiece(
      pieces[Math.floor(Math.random() * pieces.length)]
    );

    player.pos.y = 0;
    player.pos.x =
      Math.floor(arena[0].length / 2) -
      Math.floor(player.matrix[0].length / 2);

    if (collide(arena, player)) {
      endGame();
    }
  }

  function arenaSweep() {
    let rowCount = 1;
    let clearedLines = 0;

    outer: for (let y = arena.length - 1; y >= 0; y--) {
      for (let x = 0; x < arena[y].length; x++) {
        if (arena[y][x] === 0) {
          continue outer;
        }
      }

      const row = arena.splice(y, 1)[0].fill(0);
      arena.unshift(row);
      y++;

      clearedLines++;
      player.score += rowCount * 10;
      rowCount *= 2;
    }

    return clearedLines;
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

  function drawMatrix(matrix, offset) {
    if (!matrix) return;

    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          context.fillStyle = getComputedStyle(document.body).color;
          context.fillRect(x + offset.x, y + offset.y, 1, 1);
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

  function draw() {
    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawMatrix(arena, { x: 0, y: 0 });

    if (gameStarted && !gameOver) {
      drawMatrix(player.matrix, player.pos);
    }
  }

  function updateScore() {
    scoreElement.innerText = player.score;
  }

  function startGame() {
    arena.forEach(row => row.fill(0));

    player.score = 0;
    updateScore();

    gameStarted = true;
    gameOver = false;
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

    if (gameStarted && !gameOver) {
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
      "Space"
    ];

    if (gameStarted && gameKeys.includes(event.code)) {
      event.preventDefault();
    }

    if (event.key === "Escape") {
      controlsModal.classList.add("hidden");
    }

    if (event.key === "ArrowLeft") {
      playerMove(-1);
    }

    if (event.key === "ArrowRight") {
      playerMove(1);
    }

    if (event.key === "ArrowDown") {
      playerDrop(true);
    }

    if (event.key === "ArrowUp") {
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
