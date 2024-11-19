import type { GameState } from '../../types';
import { GAME_WIDTH, GAME_HEIGHT, BLOCK_SIZE } from '../../types';

// Sponsorship messages configuration
const sponsorMessages = [
  'sponsored by www.learnatventures.com',
  'learn more at learnatventures.com',
  'built with learnatventures.com'
];

let currentMessageIndex = 0;
let lastMessageChange = 0;
const MESSAGE_CHANGE_INTERVAL = 5000; // Change message every 5 seconds

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

function drawSponsorMessage(ctx: CanvasRenderingContext2D, timestamp: number) {
  // Change message periodically
  if (timestamp - lastMessageChange > MESSAGE_CHANGE_INTERVAL) {
    currentMessageIndex = (currentMessageIndex + 1) % sponsorMessages.length;
    lastMessageChange = timestamp;
  }

  const message = sponsorMessages[currentMessageIndex];
  
  // Set up the text style
  ctx.save();
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'; // Very subtle transparency
  ctx.textAlign = 'center';
  
  // Calculate position (in the middle of the playing field)
  const x = GAME_WIDTH / 2;
  const y = GAME_HEIGHT / 2;
  
  // Create diagonal repeating pattern
  for (let i = -2; i <= 2; i++) {
    const offsetY = y + (i * 100);
    // Add slight rotation for diagonal effect
    ctx.save();
    ctx.translate(x, offsetY);
    ctx.rotate(-Math.PI / 8); // Rotate text slightly
    ctx.fillText(message, 0, 0);
    ctx.restore();
  }
  
  ctx.restore();
}

export function drawGame(ctx: CanvasRenderingContext2D, gameState: GameState): void {
  const timestamp = performance.now();
  
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
  
  // Draw sponsor message in background
  drawSponsorMessage(ctx, timestamp);
  
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
  const scoreText = `Score: ${gameState.score}`;
  ctx.font = 'bold 24px Arial';
  const scoreWidth = ctx.measureText(scoreText).width;
  const padding = 10;
  const scoreX = GAME_WIDTH - scoreWidth - padding;
  const scoreY = padding + 24;

  // Draw score background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(
    scoreX - padding,
    padding,
    scoreWidth + padding * 2,
    24 + padding
  );

  // Draw score text
  ctx.fillStyle = '#FFD700';
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