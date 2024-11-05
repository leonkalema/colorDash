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
      background: '#fff',
      grid: '#2c2e33',
      unrevealed: '#404349',
      points: '#22c55e',
      multiplier: '#3b82f6',
      trap: '#ef4444',
      bonus: '#8b5cf6',
      text: '#ffffff',
      highlight: '#fbbf24'
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
      if (gameOver || isBonus) return;
    
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
      if (gameOver || revealedTiles.has(`${row}-${col}`)) return;
    
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
          break;
        case 'multiplier':
          currentMultiplier = pointValue;
          break;
        case 'trap':
          currentScore += pointValue;
          break;
        case 'bonus':
          currentScore += pointValue;
          timeLeft += 10;
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
          
          ctx.fillStyle = revealedTiles.has(`${i}-${j}`) ? 
            colors[grid[i][j].type] : colors.unrevealed;
          
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
      
      animations = animations.filter(anim => !anim.done);
      animations.forEach(anim => {
        anim.update();
        anim.draw(ctx);
      });
      
      requestAnimationFrame(render);
    }
    
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
    
    <div class="min-h-screen bg-[#121212] text-black" bind:this={containerRef}>
      <div class="max-w-[400px] mx-auto px-4 py-8">
        <!-- Centered Game Name -->
        <h1 class="text-xl font-medium text-center mb-8">MindGrid</h1>
    
        <!-- Stats Row -->
        <div class="flex justify-center items-center gap-12 mb-8">
          <div>
            <span class="text-yellow-500">🏆</span>
            <span class="ml-2">High Score:</span>
            <span class="font-medium ml-1">{highScore}</span>
          </div>
          <div>
            <span class="ml-2">Score:</span>
            <span class="font-medium ml-1">{score}</span>
          </div>
        </div>
        <button
        class="content-center items-center h-12 bg-blue-500 text-white rounded-full font-medium"
        on:click={initializeGame}
      >
        Retry
      </button>
        <!-- Game Stats -->
        <div class="flex justify-center items-center gap-8 mb-6">
          <div>
            <span>Turns:</span>
            <span class="font-medium ml-1">{turnsLeft}</span>
          </div>
          <div>
            <span>Time:</span>
            <span class="font-medium ml-1">{timeLeft}s</span>
          </div>
        </div>
    
        <!-- Game Canvas -->
        

        <div class="canvas-container">
            <canvas
          bind:this={canvas}
          class=" items-center w-auto aspect-square rounded-2xl mb-8 bg-[#121212]"
          on:click={handleCanvasClick}
        />



    
          </div>
  
      </div>
    </div>
    
    <style>
      :global(body) {
        @apply bg-[#fff];
      }
    
      canvas {
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
      }

      .canvas-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 70vh; 
     }
    
      button:active {
        transform: scale(0.98);
      }

    </style>