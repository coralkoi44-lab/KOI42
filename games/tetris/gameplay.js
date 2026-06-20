import { COLS, ROWS } from "./constants.js";
import { hasCell, refillBag, createPiece, rotateMatrix } from "./pieces.js";
import { calculateLevel, calculateDropInterval } from "./scoring.js";

export function canMove(state) {
  return state.gameStarted && !state.gameOver && !state.paused && state.player.matrix;
}

export function nextFromBag(state) {
  if (state.bag.length === 0) state.bag = refillBag();
  const type = state.bag.pop();
  return { type, matrix: createPiece(type) };
}

export function collide(arena, player) {
  if (!player.matrix) return false;
  return player.matrix.some((row, y) =>
    row.some((value, x) => {
      if (value === 0) return false;
      const arenaX = x + player.pos.x;
      const arenaY = y + player.pos.y;
      if (arenaX < 0 || arenaX >= COLS || arenaY >= ROWS) return true;
      if (arenaY < 0) return false;
      return hasCell(arena[arenaY]?.[arenaX]);
    })
  );
}

export function merge(arena, player) {
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

export function playerMove(arena, player, direction, state) {
  if (!canMove(state)) return false;
  player.pos.x += direction;
  if (collide(arena, player)) {
    player.pos.x -= direction;
    return false;
  }
  player.lastAction = "move";
  return true;
}

export function playerDrop(arena, player, state, isManual = false) {
  if (!canMove(state)) return false;
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    return "lock";
  }
  if (isManual) {
    player.lastAction = "drop";
  }
  state.dropCounter = 0;
  return true;
}

export function playerRotate(arena, player, state, direction) {
  if (!canMove(state)) return false;
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
      return true;
    }
  }

  player.pos.y = startY - 1;
  for (const offsetX of kicks) {
    player.pos.x = startX + offsetX;
    if (!collide(arena, player)) {
      player.lastAction = "rotate";
      return true;
    }
  }

  player.matrix = startMatrix;
  player.rotation = startRotation;
  player.pos.x = startX;
  player.pos.y = startY;
  return false;
}

export function getTSpinType(arena, player) {
  if (player.type !== "T" || player.lastAction !== "rotate") return null;

  const centerX = player.pos.x + 1;
  const centerY = player.pos.y + 1;
  const corners = [
    [centerX - 1, centerY - 1],
    [centerX + 1, centerY - 1],
    [centerX - 1, centerY + 1],
    [centerX + 1, centerY + 1]
  ];

  const isBlockedCorner = ([x, y]) => {
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y < 0) return false;
    return hasCell(arena[y]?.[x]);
  };

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

export function findFullLines(arena) {
  const lines = [];
  for (let y = arena.length - 1; y >= 0; y--) {
    if (arena[y].every(hasCell)) lines.push(y);
  }
  return lines;
}

export function isPerfectClear(arena) {
  return arena.every((row) => row.every((cell) => !hasCell(cell)));
}

export function refreshLevelAndSpeed(state, speedIncreaseEnabled) {
  state.player.level = calculateLevel(state.player.lines, speedIncreaseEnabled);
}

export function getDropInterval(state, speedIncreaseEnabled) {
  return calculateDropInterval(state.player.level, speedIncreaseEnabled);
}
