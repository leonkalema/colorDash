<script>
    import { onMount } from 'svelte';
    
    let canvas;
    let ctx;
    let containerWidth;
    let containerHeight;
    let tileSize;
    let gridOffset;
    let containerRef;
    
    // Game state
    let grid = [];
    let score = 0;
    let turnsLeft = 20;
    let timeLeft = 60;
    let currentMultiplier = 1;
    let gameOver = false;
    let gameStarted = false;
    let showTutorial = false;
    let hintCount = 3;
    let message = '';
    let isBonus = false;
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
      background: '#fff',
      grid: '#2c2e33',
      unrevealed: '#404349',
      points: '#22c55e',
      multiplier: '#3b82f6',
      trap: '#ef4444',
      bonus: '#8b5cf6',
      text: '#ffffff',
      highlight: '#fbbf24',
      disabled: '#e5e7eb'
    };
    
    // Animation class
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
    
    function startGame() {
        gameStarted = true;
        initializeGame();
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
      message = '';
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
        value: values[emojiIndex] || 0
      };
    }
    
    function calculateDimensions() {
      if (!containerRef) return;
      
      // Make canvas exactly square based on container width
      containerWidth = Math.min(400, containerRef.getBoundingClientRect().width - 32);
      containerHeight = containerWidth;
      
      // Calculate tile size for 6x6 grid
      tileSize = (containerWidth - 24) / 6;
      
      // Center grid in canvas
      gridOffset = {
        x: 12,
        y: 12
      };
      
      if (canvas) {
        canvas.width = containerWidth;
        canvas.height = containerHeight;
      }
    }
    
    function handleCanvasClick(event) {
      if (!gameStarted || gameOver || isBonus) return;
    
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const col = Math.floor((x - gridOffset.x) / tileSize);
      const row = Math.floor((y - gridOffset.y) / tileSize);
      
      if (row >= 0 && row < 6 && col >= 0 && col < 6) {
        handleTileClick(row, col);
      }
    }
    
    function handleTileClick(row, col) {
      if (!gameStarted || gameOver || revealedTiles.has(`${row}-${col}`)) return;
    
      const tile = grid[row][col];
      revealedTiles.add(`${row}-${col}`);
      
      animations.push(new TileAnimation(
        col * tileSize + gridOffset.x,
        row * tileSize + gridOffset.y,
        tile.emoji,
        tile.value,
        tile.type
      ));
      
      let currentScore = Number(score) || 0;
      let pointValue = Number(tile.value) || 0;
      
      switch (tile.type) {
        case 'points':
          currentScore += pointValue * currentMultiplier;
          message = `+${pointValue * currentMultiplier} points!`;
          break;
        case 'multiplier':
          currentMultiplier = pointValue;
          message = `${pointValue}x Multiplier!`;
          break;
        case 'trap':
          currentScore += pointValue;
          message = `${pointValue} points!`;
          break;
        case 'bonus':
          currentScore += pointValue;
          timeLeft += 10;
          message = `Bonus! +${pointValue} points and +10s`;
          break;
      }
      
      score = currentScore;
      highScore = Math.max(Number(highScore), score);
      localStorage.setItem('mindgrid-highscore', highScore.toString());
    
      turnsLeft--;
      if (turnsLeft <= 0) {
        endGame();
      }
    }
    
    function endGame() {
      gameOver = true;
      gameStarted = false;
      clearInterval(timer);
    }
    
    function render() {
      if (!ctx) return;
      
      // Clear with same background color as page
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, containerWidth, containerHeight);
      
      // Draw grid
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          const x = j * tileSize + gridOffset.x;
          const y = i * tileSize + gridOffset.y;
          
          // Handle different states
          let fillColor = colors.unrevealed;
          if (gameOver) {
            fillColor = colors.disabled;
          } else if (revealedTiles.has(`${i}-${j}`)) {
            fillColor = colors[grid[i][j].type];
          }
          
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.roundRect(x, y, tileSize - 4, tileSize - 4, 10);
          ctx.fill();
          
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
      
      // Draw animations
      animations = animations.filter(anim => !anim.done);
      animations.forEach(anim => {
        anim.update();
        anim.draw(ctx);
      });
      
      // Draw message if exists
      if (message && !gameOver) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, containerWidth/2, containerHeight - 20);
      }
      
      requestAnimationFrame(render);
    }
    
    onMount(() => {
      highScore = Number(localStorage.getItem('mindgrid-highscore')) || 0;
      ctx = canvas.getContext('2d');
      
      const resizeObserver = new ResizeObserver(() => {
        calculateDimensions();
      });
      resizeObserver.observe(containerRef);
      
      calculateDimensions();
    grid = [];
    for (let i = 0; i < 6; i++) {
        const row = [];
        for (let j = 0; j < 6; j++) {
            row.push(generateTile());
        }
        grid.push(row);
    }
    requestAnimationFrame(render);
    
    return () => {
        clearInterval(timer);
        resizeObserver.disconnect();
    };
    });
    </script>
    
    <div class="min-h-screen bg-white" bind:this={containerRef}>
        <div class="max-w-[400px] mx-auto px-4 pt-8">
            <!-- Game Header -->
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-2xl font-medium">MindGrid</h1>
                <button
                    class="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-sm font-medium transition-colors"
                    on:click={() => showTutorial = true}
                >
                    How to Play
                </button>
            </div>
    
            <!-- Game Stats -->
            <div class="flex justify-center gap-16 mb-6">
                <div class="text-center">
                    <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <span class="text-yellow-500 text-base">🏆</span>
                        <span>High Score</span>
                    </div>
                    <span class="text-xl font-medium">{highScore}</span>
                </div>
                <div class="text-center">
                    <div class="text-sm text-gray-600 mb-1">Score</div>
                    <span class="text-xl font-medium">{score}</span>
                </div>
            </div>
    
            <!-- Game Info -->
            <div class="flex justify-center gap-12 mb-6">
                <div class="text-center">
                    <div class="text-sm text-gray-600 mb-1">Turns</div>
                    <span class="text-lg font-medium">{turnsLeft}</span>
                </div>
                <div class="text-center">
                    <div class="text-sm text-gray-600 mb-1">Time</div>
                    <span class="text-lg font-medium {timeLeft <= 10 ? 'text-red-500' : ''}">{timeLeft}s</span>
                </div>
            </div>
    
            <!-- Game Canvas -->
            <div class="aspect-square w-full mb-8 relative">
                <canvas
                    bind:this={canvas}
                    class="w-full h-full rounded-2xl"
                    class:opacity-50={gameOver}
                    on:click={handleCanvasClick}
                />
                
                <!-- Start Game Overlay -->
                {#if !gameStarted && !gameOver}
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="bg-white/90 backdrop-blur-sm p-6 rounded-2xl text-center">
                        <h2 class="text-xl font-medium mb-4">Ready to Play?</h2>
                        <button
                            class="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
                            on:click={startGame}
                        >
                            Start Game
                        </button>
                    </div>
                </div>
                {/if}
    
                <!-- Game Over Overlay -->
                {#if gameOver}
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="bg-white/90 backdrop-blur-sm p-6 rounded-2xl text-center">
                        <h2 class="text-xl font-medium mb-2">Game Over!</h2>
                        <p class="text-gray-600 mb-4">Final Score: {score}</p>
                        {#if score > highScore}
                        <p class="text-yellow-500 font-medium mb-4">🏆 New High Score!</p>
                        {/if}
                        <button
                            class="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
                            on:click={startGame}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
                {/if}
            </div>
    
            <!-- Game Actions -->
            {#if gameStarted && !gameOver}
            <div class="mb-8">
                <button
                    class="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
                    on:click={startGame}
                >
                    New Game
                </button>
            </div>
            {/if}
        </div>
    </div>
    
    <!-- Tutorial Modal -->
    {#if showTutorial}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full relative">
            <!-- Close Button -->
            <button 
                class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                on:click={() => showTutorial = false}
            >
                ✕
            </button>
            
            <h2 class="text-xl font-medium mb-6">How to Play</h2>
            
            <div class="space-y-6 mb-6">
                <div>
                    <h3 class="font-medium mb-3">Tile Types:</h3>
                    <ul class="space-y-3">
                        <li class="flex items-center gap-3">
                            <span class="text-xl">💎</span>
                            <span class="text-sm text-gray-600">Points: Collect these to score</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="text-xl">✨</span>
                            <span class="text-sm text-gray-600">Multipliers: Boost your score</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="text-xl">💣</span>
                            <span class="text-sm text-gray-600">Traps: Avoid these!</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="text-xl">🎲</span>
                            <span class="text-sm text-gray-600">Bonus: Extra points & time</span>
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-medium mb-3">Rules:</h3>
                    <ul class="space-y-2 text-sm text-gray-600">
                        <li class="flex items-start gap-2">
                            <span class="block w-1 h-1 mt-1.5 rounded-full bg-gray-400"></span>
                            <span>You have 60 seconds and 20 turns</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="block w-1 h-1 mt-1.5 rounded-full bg-gray-400"></span>
                            <span>Click tiles to reveal them</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="block w-1 h-1 mt-1.5 rounded-full bg-gray-400"></span>
                            <span>Get multipliers before high-value tiles</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="block w-1 h-1 mt-1.5 rounded-full bg-gray-400"></span>
                            <span>Watch out for traps!</span>
                        </li>
                    </ul>
                </div>
            </div>
    
            <button
                class="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
                on:click={() => showTutorial = false}
            >
                Got it!
            </button>
        </div>
    </div>
    {/if}
      
      <style>
         :global(body) {
    @apply bg-white;
  }

  canvas {
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
  }

  button:active {
    transform: scale(0.98);
  }
      </style>