import type { Block, Shape, GameState } from '../../types';
import { BLOCK_SIZE, GAME_WIDTH, GAME_HEIGHT, COLORS, FALL_SPEED, SHAPES } from '../../types';

export function createShape(): Shape {
  const shapeIndex = Math.floor(Math.random() * SHAPES.length);
  const shapeMatrix = SHAPES[shapeIndex];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  
  const blocks: Block[] = [];
  const startX = Math.floor((GAME_WIDTH / BLOCK_SIZE - shapeMatrix[0].length) / 2) * BLOCK_SIZE;
  
  shapeMatrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 1) {
        blocks.push({
          x: startX + x * BLOCK_SIZE,
          y: y * BLOCK_SIZE,
          color
        });
      }
    });
  });
  
  return {
    blocks,
    rotation: 0
  };
}

export function rotateShape(shape: Shape): Shape {
  const center = shape.blocks[Math.floor(shape.blocks.length / 2)];
  const newBlocks = shape.blocks.map(block => {
    const relX = block.x - center.x;
    const relY = block.y - center.y;
    return {
      x: center.x - relY,
      y: center.y + relX,
      color: block.color
    };
  });

  // Check if rotation is valid
  if (newBlocks.every(block => 
    block.x >= 0 && 
    block.x + BLOCK_SIZE <= GAME_WIDTH && 
    block.y + BLOCK_SIZE <= GAME_HEIGHT &&
    !isColliding({ blocks: newBlocks, rotation: 0 }, [])
  )) {
    return {
      blocks: newBlocks,
      rotation: (shape.rotation + 90) % 360
    };
  }
  
  return shape;
}

function isColliding(shape: Shape, fallenBlocks: Block[]): boolean {
  return shape.blocks.some(block => 
    block.y + BLOCK_SIZE > GAME_HEIGHT ||
    block.x < 0 ||
    block.x + BLOCK_SIZE > GAME_WIDTH ||
    fallenBlocks.some(fallenBlock =>
      block.x < fallenBlock.x + BLOCK_SIZE &&
      block.x + BLOCK_SIZE > fallenBlock.x &&
      block.y < fallenBlock.y + BLOCK_SIZE &&
      block.y + BLOCK_SIZE > fallenBlock.y
    )
  );
}

export function moveShape(shape: Shape, direction: 'left' | 'right', fallenBlocks: Block[]): Shape {
  const move = direction === 'left' ? -BLOCK_SIZE : BLOCK_SIZE;
  const newBlocks = shape.blocks.map(block => ({
    ...block,
    x: block.x + move
  }));
  
  const newShape = { blocks: newBlocks, rotation: shape.rotation };
  return isColliding(newShape, fallenBlocks) ? shape : newShape;
}

export function checkCompletedRows(gameState: GameState): void {
  const rows = new Map<number, Block[]>();
  
  gameState.fallenBlocks.forEach(block => {
    const row = block.y;
    if (!rows.has(row)) {
      rows.set(row, []);
    }
    rows.get(row)!.push(block);
  });
  
  const completedRows: number[] = [];
  rows.forEach((blocks, row) => {
    if (blocks.length === GAME_WIDTH / BLOCK_SIZE) {
      completedRows.push(row);
      gameState.score += 100;
    }
  });
  
  if (completedRows.length > 0) {
    gameState.fallenBlocks = gameState.fallenBlocks.filter(
      block => !completedRows.includes(block.y)
    );
    
    gameState.fallenBlocks.forEach(block => {
      const rowsBelow = completedRows.filter(row => row > block.y).length;
      block.y += rowsBelow * BLOCK_SIZE;
    });
  }
}

export function updateGameState(gameState: GameState): void {
  if (!gameState.currentShape || gameState.gameOver) return;
  
  const newBlocks = gameState.currentShape.blocks.map(block => ({
    ...block,
    y: block.y + FALL_SPEED
  }));
  
  const newShape = { blocks: newBlocks, rotation: gameState.currentShape.rotation };
  
  if (isColliding(newShape, gameState.fallenBlocks)) {
    // Add current shape to fallen blocks
    gameState.fallenBlocks.push(...gameState.currentShape.blocks);
    
    // Check if game is over
    if (gameState.currentShape.blocks.some(block => block.y <= BLOCK_SIZE)) {
      gameState.gameOver = true;
      return;
    }
    
    // Create new shape
    gameState.currentShape = createShape();
    checkCompletedRows(gameState);
  } else {
    gameState.currentShape = newShape;
  }
}