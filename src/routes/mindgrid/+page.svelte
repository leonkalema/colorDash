<script>
    import { onMount } from 'svelte';

let canvas;
let ctx;
let containerWidth;
let containerHeight;
let tileSize;
let gridOffset;

// Resize observer
let containerRef;

// Game state
let grid = [];
let score = 0;
let turnsLeft = 20;
let timeLeft = 60; // 60 seconds per game
let currentMultiplier = 1;
let gameOver = false;
let hintCount = 3;
let message = '';
let isBonus = false;
let tutorial = true;
let timer;
let revealedTiles = new Set();
let animations = [];
let highScore = 0;

// Emojis for tiles
const tileEmojis = {
  points: ['💎', '⭐', '🌟', '🎯', '🎪'],
  multiplier: ['✨', '🌈'],
  trap: ['💣', '⚡', '🌋'],
  bonus: ['🎲', '🎱', '🎮']
};

// Points configuration
const tileValues = {
  points: [50, 100, 150, 200, 250],
  multiplier: [2, 3],
  trap: [-100, -75, -50],
  bonus: [300]
};

// Colors with modern palette
const colors = {
  background: '#1a1b1e',
  grid: '#2c2e33',
  unrevealed: '#404349',
  points: '#22c55e',
  multiplier: '#3b82f6',
  trap: '#ef4444',
  bonus: '#8b5cf6',
  text: '#ffffff',
  highlight: '#fbbf24'
};

// Tutorial steps
const tutorialSteps = [
  {
    title: "Welcome to MindGrid! 🎮",
    text: "Reveal tiles to collect points and beat your high score!",
    position: "center"
  },
  {
    title: "Tile Types",
    text: "💎 Points | ✨ Multipliers | 💣 Traps | 🎲 Bonus",
    position: "top"
  },
  {
    title: "Time & Turns ⏱️",
    text: "You have 60 seconds and 20 turns. Use them wisely!",
    position: "top-right"
  }
];

// Animation class with improved effects
class TileAnimation {
  constructor(x, y, emoji, value, type) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.value = value;
    this.type = type;
    this.scale = 0;
    this.alpha = 1;
    this.rotation = 0;
    this.done = false;
  }

  update() {
    if (this.scale < 1) {
      this.scale += 0.15;
      this.rotation += 0.2;
    } else if (this.alpha > 0) {
      this.alpha -= 0.03;
    } else {
      this.done = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x + tileSize/2, this.y + tileSize/2);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.rotation);
    
    // Draw background glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, tileSize/2);
    gradient.addColorStop(0, colors[this.type] + '80');
    gradient.addColorStop(1, colors[this.type] + '00');
    ctx.fillStyle = gradient;
    ctx.fillRect(-tileSize/2, -tileSize/2, tileSize, tileSize);
    
    // Draw emoji
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${tileSize/2}px Arial`;
    ctx.fillText(this.emoji, 0, 0);
    
    // Draw value
    ctx.font = `${tileSize/4}px Arial`;
    ctx.fillText(this.value, 0, tileSize/4);
    
    ctx.restore();
  }
}

function initializeGame() {
  calculateDimensions();
  grid = [];
  score = 0;
  turnsLeft = 20;
  timeLeft = 60;
  currentMultiplier = 1;
  gameOver = false;
  hintCount = 3;
  message = 'Match emojis to score points!';
  revealedTiles = new Set();
  animations = [];
  
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  // Generate grid
  for (let i = 0; i < 6; i++) {
    const row = [];
    for (let j = 0; j < 6; j++) {
      row.push(generateTile());
    }
    grid.push(row);
  }
  
  requestAnimationFrame(render);
}

function generateTile() {
  const types = Object.keys(tileEmojis);
  const type = types[Math.floor(Math.random() * types.length)];
  const emojis = tileEmojis[type];
  const values = tileValues[type];
  const emojiIndex = Math.floor(Math.random() * emojis.length);
  
  return {
    type,
    emoji: emojis[emojiIndex],
    value: values[emojiIndex] || 0 // Ensure value is always a number
  };
}

function calculateDimensions() {
  if (!containerRef) return;
  
  const rect = containerRef.getBoundingClientRect();
  containerWidth = rect.width;
  containerHeight = window.innerHeight * 0.7;
  
  // Calculate responsive tile size
  tileSize = Math.min(
    (containerWidth - 40) / 6,
    (containerHeight - 40) / 6
  );
  
  gridOffset = {
    x: (containerWidth - (tileSize * 6)) / 2,
    y: (containerHeight - (tileSize * 6)) / 2
  };
  
  if (canvas) {
    canvas.width = containerWidth;
    canvas.height = containerHeight;
  }
}

function handleCanvasClick(event) {
  if (gameOver || isBonus) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Convert click to grid coordinates
  const col = Math.floor((x - gridOffset.x) / tileSize);
  const row = Math.floor((y - gridOffset.y) / tileSize);
  
  if (row >= 0 && row < 6 && col >= 0 && col < 6) {
    handleTileClick(row, col);
  }
}

function handleTileClick(row, col) {
  if (gameOver || revealedTiles.has(`${row}-${col}`)) return;

  const tile = grid[row][col];
  revealedTiles.add(`${row}-${col}`);
  
  // Add reveal animation
  animations.push(new TileAnimation(
    col * tileSize + gridOffset.x,
    row * tileSize + gridOffset.y,
    tile.emoji,
    tile.value,
    tile.type
  ));
  
  // Convert score to number explicitly to prevent NaN
  let currentScore = Number(score) || 0;
  let pointValue = Number(tile.value) || 0;
  
  // Handle tile effects
  switch (tile.type) {
    case 'points':
      currentScore += pointValue * currentMultiplier;
      message = `${tile.emoji} +${pointValue * currentMultiplier} points!`;
      break;
    case 'multiplier':
      currentMultiplier = pointValue;
      message = `${tile.emoji} ${pointValue}x multiplier active!`;
      break;
    case 'trap':
      currentScore += pointValue;
      message = `${tile.emoji} ${pointValue} points!`;
      break;
    case 'bonus':
      currentScore += pointValue;
      timeLeft += 10;
      message = `${tile.emoji} Bonus! +${pointValue} points and +10 seconds!`;
      break;
  }
  
  // Update score with the new value
  score = currentScore;

  // Update high score
  highScore = Math.max(Number(highScore), score);
  localStorage.setItem('mindgrid-highscore', highScore.toString());

  turnsLeft--;
  if (turnsLeft <= 0) {
    endGame();
  }
}

function endGame() {
  gameOver = true;
  clearInterval(timer);
  message = `Game Over! Score: ${score}`;
}

function render() {
  if (!ctx) return;
  
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, containerWidth, containerHeight);
  
  // Draw grid
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      const x = j * tileSize + gridOffset.x;
      const y = i * tileSize + gridOffset.y;
      
      // Draw tile
      ctx.fillStyle = revealedTiles.has(`${i}-${j}`) ? 
        colors[grid[i][j].type] : colors.unrevealed;
      
      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(x, y, tileSize - 4, tileSize - 4, 10);
      ctx.fill();
      
      // Draw revealed tile
      if (revealedTiles.has(`${i}-${j}`)) {
        const tile = grid[i][j];
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${tileSize/2}px Arial`;
        ctx.fillText(tile.emoji, x + tileSize/2, y + tileSize/2);
      }
    }
  }
  
  // Update and draw animations
  animations = animations.filter(anim => !anim.done);
  animations.forEach(anim => {
    anim.update();
    anim.draw(ctx);
  });
  
  // Draw UI
  drawUI();
  
  requestAnimationFrame(render);
}

function drawUI() {
  // Header
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Score: ${score}`, containerWidth/4, 30);
  ctx.fillText(`High Score: ${highScore}`, containerWidth * 3/4, 30);
  
  // Game stats
  ctx.font = '20px Arial';
  ctx.fillText(`Turns: ${turnsLeft}`, containerWidth/4, 60);
  ctx.fillText(`Time: ${timeLeft}s`, containerWidth * 3/4, 60);
  
  // Multiplier
  if (currentMultiplier > 1) {
    ctx.fillStyle = colors.highlight;
    ctx.fillText(`${currentMultiplier}x Multiplier!`, containerWidth/2, 30);
  }
  
  // Message
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 18px Arial';
  ctx.fillText(message, containerWidth/2, containerHeight - 30);
}

// Initialize game on mount
onMount(() => {
  highScore = Number(localStorage.getItem('mindgrid-highscore')) || 0;
  ctx = canvas.getContext('2d');
  
  const resizeObserver = new ResizeObserver(() => {
    calculateDimensions();
  });
  resizeObserver.observe(containerRef);
  
  initializeGame();
  
  return () => {
    clearInterval(timer);
    resizeObserver.disconnect();
  };
});
  </script>
  
  <div class="min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-white" bind:this={containerRef}>
    <div class="max-w-[400px] mx-auto px-4 py-8">
      <!-- Centered Game Name -->
      <h1 class="text-xl font-medium text-center mb-8">Color Dash</h1>
  
      <!-- Stats Row -->
      <div class="flex justify-center gap-8 mb-8">
        <div class="flex items-center gap-2">
          <span class="text-yellow-500">🏆</span>
          <div class="text-sm">High Score: {highScore}</div>
        </div>
      </div>
  
      <!-- Game Canvas -->
      <canvas
        bind:this={canvas}
        class="w-full aspect-square rounded-2xl mb-8"
        on:click={handleCanvasClick}
      />
  
      <!-- Single Action Button -->
      <button
        class="w-full h-12 bg-[#4C6FFF] text-white rounded-full font-medium"
        on:click={initializeGame}
      >
        Retry
      </button>
    </div>
  </div>
  
  <style>
    :global(body) {
      @apply bg-white dark:bg-[#121212];
    }
  
    canvas {
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
    }
  
    button:active {
      transform: scale(0.98);
    }
  </style>