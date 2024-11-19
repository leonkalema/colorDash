import type { GameState } from '../../types';
import { GAME_WIDTH, GAME_HEIGHT, BLOCK_SIZE } from '../../types';

const sponsorMessages = [
  'sponsored by www.learnatventures.com',
  'learn more at learnatventures.com',
  'built with learnatventures.com'
];

let currentMessageIndex = 0;
let lastMessageChange = 0;
const MESSAGE_CHANGE_INTERVAL = 5000;

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
  
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
  if (timestamp - lastMessageChange > MESSAGE_CHANGE_INTERVAL) {
    currentMessageIndex = (currentMessageIndex + 1) % sponsorMessages.length;
    lastMessageChange = timestamp;
  }

  const message = sponsorMessages[currentMessageIndex];
  
  ctx.save();
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.textAlign = 'center';
  
  const x = GAME_WIDTH / 2;
  const y = GAME_HEIGHT / 2;
  
  for (let i = -2; i <= 2; i++) {
    const offsetY = y + (i * 100);
    ctx.save();
    ctx.translate(x, offsetY);
    ctx.rotate(-Math.PI / 8);
    ctx.fillText(message, 0, 0);
    ctx.restore();
  }
  
  ctx.restore();
}

export function drawGame(ctx: CanvasRenderingContext2D, gameState: GameState): void {
  const timestamp = performance.now();
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  for (let x = 0; x < GAME_WIDTH; x += BLOCK_SIZE) {
    for (let y = 0; y < GAME_HEIGHT; y += BLOCK_SIZE) {
      ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
    }
  }
  
  drawSponsorMessage(ctx, timestamp);
  
  gameState.fallenBlocks.forEach(block => {
    drawBlock(ctx, block.x, block.y, block.color);
  });
  
  if (gameState.currentShape) {
    gameState.currentShape.blocks.forEach(block => {
      drawBlock(ctx, block.x, block.y, block.color);
    });
  }
  
  const scoreText = `Score: ${gameState.score}`;
  ctx.font = 'bold 24px Arial';
  const scoreWidth = ctx.measureText(scoreText).width;
  const padding = 10;
  const scoreX = GAME_WIDTH - scoreWidth - padding;
  const scoreY = padding + 24;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(
    scoreX - padding,
    padding,
    scoreWidth + padding * 2,
    24 + padding
  );

  ctx.fillStyle = '#FFD700';
  ctx.fillText(scoreText, scoreX, scoreY);
  
  if (gameState.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25);

    // Draw restart button
    const buttonWidth = 160;
    const buttonHeight = 50;
    const buttonX = GAME_WIDTH / 2 - buttonWidth / 2;
    const buttonY = GAME_HEIGHT / 2 + 60;
    
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('New Game', GAME_WIDTH / 2, buttonY + 32);
  }
}