import type { GameState } from '../../types';
import { GAME_WIDTH, GAME_HEIGHT, BLOCK_SIZE } from '../../types';

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
  
  // Add 3D effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + BLOCK_SIZE, y);
  ctx.lineTo(x + BLOCK_SIZE - 4, y + 4);
  ctx.lineTo(x + 4, y + 4);
  ctx.closePath();
  ctx.fill();
}

export function drawGame(ctx: CanvasRenderingContext2D, gameState: GameState): void {
  // Clear canvas with a darker background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  
  // Draw background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  for (let x = 0; x < GAME_WIDTH; x += BLOCK_SIZE) {
    for (let y = 0; y < GAME_HEIGHT; y += BLOCK_SIZE) {
      ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
    }
  }
  
  // Draw fallen blocks
  gameState.fallenBlocks.forEach(block => {
    drawBlock(ctx, block.x, block.y, block.color);
  });
  
  // Draw current shape
  if (gameState.currentShape) {
    gameState.currentShape.blocks.forEach(block => {
      drawBlock(ctx, block.x, block.y, block.color);
    });
  }
  
  // Draw score with better visibility
  // Semi-transparent background for score
  const scoreText = `Score: ${gameState.score}`;
  ctx.font = 'bold 24px Arial';
  const scoreWidth = ctx.measureText(scoreText).width;
  const padding = 10;
  const scoreX = GAME_WIDTH - scoreWidth - padding;
  const scoreY = padding + 24; // Font size + padding

  // Draw score background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(
    scoreX - padding,
    padding,
    scoreWidth + padding * 2,
    24 + padding
  );

  // Draw score text with glow effect
  ctx.fillStyle = '#FFD700'; // Golden color
  ctx.fillText(scoreText, scoreX, scoreY);
  
  // Game over overlay
  if (gameState.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
  }
}