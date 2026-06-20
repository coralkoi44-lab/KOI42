import { COLORS, PIECES } from "./constants.js";

export function createMatrix(width, height) {
  return Array.from({ length: height }, () => new Array(width).fill(null));
}

export function hasCell(cell) {
  return cell !== null && cell !== undefined && cell !== 0;
}

export function copyCell(cell) {
  return typeof cell === "object" && cell !== null ? { ...cell } : cell;
}

export function createPiece(type) {
  const pieces = {
    T: [[0, COLORS.T, 0], [COLORS.T, COLORS.T, COLORS.T], [0, 0, 0]],
    O: [[COLORS.O, COLORS.O], [COLORS.O, COLORS.O]],
    L: [[0, COLORS.L, 0], [0, COLORS.L, 0], [0, COLORS.L, COLORS.L]],
    J: [[0, COLORS.J, 0], [0, COLORS.J, 0], [COLORS.J, COLORS.J, 0]],
    I: [[0, 0, 0, 0], [COLORS.I, COLORS.I, COLORS.I, COLORS.I], [0, 0, 0, 0], [0, 0, 0, 0]],
    S: [[0, COLORS.S, COLORS.S], [COLORS.S, COLORS.S, 0], [0, 0, 0]],
    Z: [[COLORS.Z, COLORS.Z, 0], [0, COLORS.Z, COLORS.Z], [0, 0, 0]]
  };

  return pieces[type].map((row) => [...row]);
}

export function refillBag() {
  const bag = [...PIECES];

  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  return bag;
}

export function rotateMatrix(matrix, direction) {
  const rotated = matrix.map((row) => [...row]);

  for (let y = 0; y < rotated.length; y++) {
    for (let x = 0; x < y; x++) {
      [rotated[x][y], rotated[y][x]] = [rotated[y][x], rotated[x][y]];
    }
  }

  if (direction > 0) rotated.forEach((row) => row.reverse());
  else rotated.reverse();

  return rotated;
}
