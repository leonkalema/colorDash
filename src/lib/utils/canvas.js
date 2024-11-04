import { GRID_SIZE, TILE_SIZE, GAP } from '../constants/gameConstants';
import { getDistractorColor } from './colors';

export function drawTile(ctx, tile, index) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const x = col * (TILE_SIZE + GAP);
  const y = row * (TILE_SIZE + GAP);

  // Draw base tile
  ctx.beginPath();
  ctx.roundRect(x, y, TILE_SIZE, TILE_SIZE, 8);
  ctx.fillStyle = tile.color;
  ctx.fill();

  // Add gradient overlay
  const gradient = ctx.createLinearGradient(x, y, x, y + TILE_SIZE);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fill();
}

export function createTiles(targetColor, difficulty) {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({
    color: Math.random() > 0.5 ? targetColor : getDistractorColor(targetColor, difficulty),
    isFlipping: false
  }));
}

export function getClickedTileIndex(x, y) {
  const col = Math.floor(x / (TILE_SIZE + GAP));
  const row = Math.floor(y / (TILE_SIZE + GAP));
  
  if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
    return row * GRID_SIZE + col;
  }
  return -1;
}