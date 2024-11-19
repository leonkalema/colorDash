export interface Block {
  x: number;
  y: number;
  color: string;
}

export interface Shape {
  blocks: Block[];
  rotation: number;
}

export interface GameState {
  score: number;
  gameOver: boolean;
  currentShape: Shape | null;
  fallenBlocks: Block[];
}

export const COLORS = [
  '#FF3B30', // Red
  '#34C759', // Green
  '#007AFF', // Blue
  '#FFD60A', // Yellow
  '#FF9500', // Orange
  '#5856D6', // Purple
  '#FF2D55'  // Pink
];

export const BLOCK_SIZE = 30;
export const GAME_WIDTH = 300;
export const GAME_HEIGHT = 600;
export const FALL_SPEED = 1;
export const MOVE_SPEED = 30;

export const SHAPES = [
  // I shape
  [[1, 1, 1, 1]],
  // L shape
  [[1, 0], [1, 0], [1, 1]],
  // J shape
  [[0, 1], [0, 1], [1, 1]],
  // O shape
  [[1, 1], [1, 1]],
  // T shape
  [[1, 1, 1], [0, 1, 0]],
  // S shape
  [[0, 1, 1], [1, 1, 0]],
  // Z shape
  [[1, 1, 0], [0, 1, 1]]
];