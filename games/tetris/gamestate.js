export function createGameState(cols, rows) {
  return {
    arena: createMatrix(cols, rows),
    player: {
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
    },
    gameStarted: false,
    gameOver: false,
    paused: false,
    dropCounter: 0,
    lastTime: 0,
    pieceIdCounter: 1,
    bag: [],
    speedIncreaseEnabled: false
  };
}

export function createMatrix(width, height) {
  return Array.from({ length: height }, () => new Array(width).fill(null));
}

export function resetGame(state, cols, rows, speedIncreaseEnabled) {
  state.arena.forEach((row) => row.fill(null));
  state.player.score = 0;
  state.player.level = 1;
  state.player.lines = 0;
  state.player.combo = -1;
  state.player.backToBack = false;
  state.player.matrix = null;
  state.player.lastAction = null;
  state.gameStarted = false;
  state.gameOver = false;
  state.paused = false;
  state.dropCounter = 0;
  state.lastTime = 0;
  state.bag = [];
  state.speedIncreaseEnabled = speedIncreaseEnabled;
}
