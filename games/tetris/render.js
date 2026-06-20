import { BORDER_WIDTH, FILL_OVERLAP, COLS, ROWS, NEXT_SIZE } from "./constants.js";
import { hasCell } from "./pieces.js";

export function resizeCanvas(canvasElement, drawingContext, cols, rows) {
  if (!canvasElement || !drawingContext) return;
  const pixelRatio = window.devicePixelRatio || 1;
  const rect = canvasElement.getBoundingClientRect();
  canvasElement.width = Math.max(1, Math.round(rect.width * pixelRatio));
  canvasElement.height = Math.max(1, Math.round(rect.height * pixelRatio));
  drawingContext.setTransform(canvasElement.width / cols, 0, 0, canvasElement.height / rows, 0, 0);
}

export function lineWidth(canvasElement, cols) {
  return BORDER_WIDTH / (canvasElement.getBoundingClientRect().width / cols);
}

export function themeColor(property) {
  return getComputedStyle(document.body).getPropertyValue(property).trim();
}

export function drawGrid(drawingContext, canvasElement, cols, rows) {
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

export function cellPieceId(cell, fallbackPieceId) {
  if (!hasCell(cell)) return null;
  return typeof cell === "object" ? cell.pieceId : fallbackPieceId;
}

export function drawMatrix(matrix, offset, drawingContext, canvasElement, cols = COLS, fallbackPieceId = null) {
  if (!matrix || !drawingContext) return;
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

export function drawPieceOutlines(matrix, offset, drawingContext, canvasElement, cols, fallbackPieceId) {
  const width = lineWidth(canvasElement, cols);
  const halfWidth = width / 2;
  drawingContext.fillStyle = getComputedStyle(document.body).color;
  matrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!hasCell(cell)) return;
      const currentPieceId = cellPieceId(cell, fallbackPieceId);
      const hasSamePieceNeighbor = (neighborX, neighborY) =>
        cellPieceId(matrix[neighborY]?.[neighborX], fallbackPieceId) === currentPieceId;
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

export function drawNextPiece(nextMatrix, nextPieceId, dom) {
  if (!dom || !dom.nextContext || !dom.nextCanvas) return;
  dom.nextContext.fillStyle = getComputedStyle(document.body).backgroundColor;
  dom.nextContext.fillRect(0, 0, NEXT_SIZE, NEXT_SIZE);
  drawGrid(dom.nextContext, dom.nextCanvas, NEXT_SIZE, NEXT_SIZE);
  if (!nextMatrix) return;

  const usedCells = [];
  nextMatrix.forEach((row, y) => row.forEach((value, x) => { if (hasCell(value)) usedCells.push({ x, y }); }));
  if (usedCells.length === 0) return;

  const minX = Math.min(...usedCells.map((cell) => cell.x));
  const maxX = Math.max(...usedCells.map((cell) => cell.x));
  const minY = Math.min(...usedCells.map((cell) => cell.y));
  const maxY = Math.max(...usedCells.map((cell) => cell.y));
  const offset = {
    x: Math.round((NEXT_SIZE - (maxX - minX + 1)) / 2 - minX),
    y: Math.round((NEXT_SIZE - (maxY - minY + 1)) / 2 - minY)
  };
  drawMatrix(nextMatrix, offset, dom.nextContext, dom.nextCanvas, NEXT_SIZE, nextPieceId);
}

export function drawGame(state, dom) {
  if (!dom || !dom.context || !dom.canvas) return;
  resizeCanvas(dom.canvas, dom.context, COLS, ROWS);
  resizeCanvas(dom.nextCanvas, dom.nextContext, NEXT_SIZE, NEXT_SIZE);

  dom.context.fillStyle = getComputedStyle(document.body).backgroundColor;
  dom.context.fillRect(0, 0, COLS, ROWS);
  drawGrid(dom.context, dom.canvas, COLS, ROWS);
  drawMatrix(state.arena, { x: 0, y: 0 }, dom.context, dom.canvas, COLS);
  if (state.gameStarted && !state.gameOver && state.player.matrix) {
    drawMatrix(state.player.matrix, state.player.pos, dom.context, dom.canvas, COLS, state.player.pieceId);
  }
  drawNextPiece(state.player.nextMatrix, state.player.nextPieceId, dom);
}
