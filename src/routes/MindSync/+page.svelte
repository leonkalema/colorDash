<script>
    import { onMount } from 'svelte';
    import { fade, slide, scale } from 'svelte/transition';
    
    const GRID_SIZE = 4;
    const TIME_PER_TURN = 30;
    const COLORS = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEEAD', // Yellow
      '#D4A5A5', // Pink
      '#9B59B6', // Purple
      '#3498DB'  // Dark Blue
    ];
    
    let canvas;
    let ctx;
    let score = 0;
    let highScore = 0;
    let timeLeft = TIME_PER_TURN;
    let timer;
    let gameOver = false;
    let showInstructions = false;
    let animationFrame;
    
    let playerGrid = [];
    let targetGrid = [];
    let selectedCell = null;
    let animations = [];
    let lastMatchCount = 0;
    
    class Animation {
      constructor(x, y, type, duration = 500) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.startTime = Date.now();
        this.duration = duration;
      }
      
      isComplete() {
        return Date.now() - this.startTime > this.duration;
      }
      
      draw(ctx) {
        const progress = (Date.now() - this.startTime) / this.duration;
        if (this.type === 'match') {
          // Enhanced match animation with ripple effect
          ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - progress)})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, 30 * progress, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * (1 - progress)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(this.x, this.y, 35 * progress, 0, Math.PI * 2);
          ctx.stroke();
        } else if (this.type === 'select') {
          // Selection animation
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - progress)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(this.x, this.y, 20 * (1 - progress), 0, Math.PI * 2);
          ctx.stroke();
        } else if (this.type === 'swap') {
          // Swap animation
          ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - progress)})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, 15 * (1 - progress), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    onMount(() => {
      loadHighScore();
      
      setTimeout(() => {
        initializeCanvas();
        startNewGame();
      }, 100);
  
      return () => {
        if (timer) clearInterval(timer);
        if (animationFrame) cancelAnimationFrame(animationFrame);
      };
    });

    function loadHighScore() {
      const savedHighScore = localStorage.getItem('mindsync-highscore');
      if (savedHighScore) {
        highScore = parseInt(savedHighScore);
      }
    }

    function saveHighScore() {
      localStorage.setItem('mindsync-highscore', highScore.toString());
    }
    
    function initializeCanvas() {
      if (!canvas) return;
      
      const maxWidth = Math.min(canvas.parentElement.clientWidth, 400);
      const playerCellSize = Math.min((maxWidth - 32) / (GRID_SIZE + 1), 50);
      const targetCellSize = playerCellSize * 0.6;
      
      canvas.width = playerCellSize * (GRID_SIZE + 1);
      canvas.height = targetCellSize * (GRID_SIZE + 1) + playerCellSize * (GRID_SIZE + 1);
      ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
    }
  
    function createRandomGrid() {
      const totalCells = GRID_SIZE * GRID_SIZE;
      const colorsNeeded = Math.min(COLORS.length, Math.ceil(totalCells / 2));
      
      let grid = [];
      for (let i = 0; i < colorsNeeded; i++) {
        const count = Math.floor(totalCells / colorsNeeded);
        grid = grid.concat(Array(count).fill(COLORS[i]));
      }
      
      while (grid.length < totalCells) {
        grid.push(COLORS[Math.floor(Math.random() * colorsNeeded)]);
      }
      
      for (let i = grid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [grid[i], grid[j]] = [grid[j], grid[i]];
      }
      
      return grid;
    }
  
    function createPlayerGrid(targetGrid) {
      let playerGrid = [...targetGrid];
      let attempts = 0;
      let matches;
      
      do {
        for (let i = playerGrid.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [playerGrid[i], playerGrid[j]] = [playerGrid[j], playerGrid[i]];
        }
        
        matches = 0;
        for (let i = 0; i < playerGrid.length; i++) {
          if (playerGrid[i] === targetGrid[i]) matches++;
        }
        attempts++;
      } while (matches > playerGrid.length / 3 && attempts < 10);
      
      return playerGrid;
    }

    function addCellAnimation(index, type) {
        const playerCellSize = canvas.width / (GRID_SIZE + 1);
        const targetCellSize = playerCellSize * 0.6;
        const x = playerCellSize * 0.5 + (index % GRID_SIZE) * playerCellSize;
        const y = targetCellSize * (GRID_SIZE + 1.2) + Math.floor(index / GRID_SIZE) * playerCellSize;
        animations.push(new Animation(x + playerCellSize/2, y + playerCellSize/2, type));
        
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(draw);
        }
    }
    
    function draw() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const playerCellSize = canvas.width / (GRID_SIZE + 1);
      const targetCellSize = playerCellSize * 0.6;
      
      const targetOffsetX = (canvas.width - (targetCellSize * GRID_SIZE)) / 2;
      
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Target Pattern:', canvas.width / 2, targetCellSize * 0.5);
      
      const currentMatches = countMatches();
      const totalCells = GRID_SIZE * GRID_SIZE;
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.fillText(`${currentMatches}/${totalCells} matched`, canvas.width / 2, targetCellSize * (GRID_SIZE + 0.8));
      
      drawGrid(targetGrid, targetCellSize, targetCellSize, false, targetOffsetX);
      
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(0, targetCellSize * (GRID_SIZE + 1), canvas.width, 2);
      
      drawGrid(playerGrid, playerCellSize, targetCellSize * (GRID_SIZE + 1.2), true);
      
      animations = animations.filter(anim => !anim.isComplete());
      animations.forEach(anim => anim.draw(ctx));
      
      if (animations.length > 0) {
        animationFrame = requestAnimationFrame(draw);
      } else {
        animationFrame = null;
      }
    }
  
    function drawGrid(grid, cellSize, startY, isPlayer = false, offsetX = cellSize * 0.5) {
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          const x = offsetX + j * cellSize;
          const y = startY + i * cellSize;
          const index = i * GRID_SIZE + j;
          
          ctx.fillStyle = grid[index];
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = isPlayer ? 2 : 1;
          
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, cellSize - 2, cellSize - 2, isPlayer ? 6 : 4);
          } else {
            ctx.rect(x, y, cellSize - 2, cellSize - 2);
          }
          ctx.fill();
          ctx.stroke();
          
          if (isPlayer && selectedCell === index) {
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 4;
            ctx.stroke();
          }
          
          if (isPlayer && grid[index] === targetGrid[index]) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = `${cellSize * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', x + cellSize/2, y + cellSize/2);
          }
        }
      }
    }
    
    function handleClick(event) {
      if (!ctx || gameOver) {
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      
      const playerCellSize = canvas.width / (GRID_SIZE + 1);
      const targetCellSize = playerCellSize * 0.6;
      const playerGridStartY = targetCellSize * (GRID_SIZE + 1.2);
      
      if (y >= playerGridStartY) {
        const gridX = Math.floor((x - playerCellSize * 0.5) / playerCellSize);
        const gridY = Math.floor((y - playerGridStartY) / playerCellSize);
        
        if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
          const index = gridY * GRID_SIZE + gridX;
          handleCellClick(index);
        }
      }
    }
    
    function handleCellClick(index) {
      if (selectedCell === null) {
        selectedCell = index;
        addCellAnimation(index, 'select');
      } else {
        const previousMatches = countMatches();
        
        [playerGrid[selectedCell], playerGrid[index]] = [playerGrid[index], playerGrid[selectedCell]];
        
        addCellAnimation(selectedCell, 'swap');
        addCellAnimation(index, 'swap');
        
        const newMatches = countMatches();
        if (newMatches > previousMatches) {
          score += (newMatches - previousMatches) * 5;
          for(let i = 0; i < playerGrid.length; i++) {
            if(playerGrid[i] === targetGrid[i] && i !== selectedCell && i !== index) {
              addCellAnimation(i, 'match');
            }
          }
        }
        
        selectedCell = null;
        playerGrid = [...playerGrid];
        checkForWin();
      }
      draw();
    }
    
    function countMatches() {
      let matches = 0;
      for (let i = 0; i < playerGrid.length; i++) {
        if (playerGrid[i] === targetGrid[i]) matches++;
      }
      return matches;
    }
    
    function checkForWin() {
      const matches = countMatches();
      if (matches === playerGrid.length) {
        score += Math.ceil(timeLeft * 10);
        if (score > highScore) {
          highScore = score;
          saveHighScore();
        }
        nextLevel();
      }
    }
    
    function startNewGame() {
      if (timer) clearInterval(timer);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      
      targetGrid = createRandomGrid();
      playerGrid = createPlayerGrid(targetGrid);
      score = 0;
      timeLeft = TIME_PER_TURN;
      gameOver = false;
      selectedCell = null;
      animations = [];
      lastMatchCount = 0;
      
      timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          endGame();
        }
      }, 1000);
      
      draw();
    }
    
    function nextLevel() {
      targetGrid = createRandomGrid();
      playerGrid = createPlayerGrid(targetGrid);
      timeLeft = Math.max(TIME_PER_TURN - Math.floor(score / 100), 10);
      lastMatchCount = 0;
      draw();
    }
    
    function endGame() {
      gameOver = true;
      if (timer) clearInterval(timer);
      
      if (score > highScore) {
        highScore = score;
        saveHighScore();
      }
    }
  
    let resizeTimer;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initializeCanvas();
        draw();
      }, 250);
    }
</script>

<main class="min-h-screen bg-gray-100 p-2">
    <div class="max-w-md mx-auto relative">
        <header class="bg-white rounded-lg shadow-sm p-3 mb-2">
            <h1 class="text-xl font-bold text-center mb-2">MindSync</h1>
            
            <div class="flex justify-between items-center text-sm">
                <div class="space-y-0.5">
                    <div class="font-semibold">Score: {score}</div>
                    <div class="text-gray-600">Best: {highScore}</div>
                </div>
                
                <div class="text-lg font-bold text-center">
                    <div class={timeLeft <= 5 ? 'text-red-500' : ''}>
                        {timeLeft}s
                    </div>
                </div>
                
                <div class="space-x-1">
                    <button
                    class="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    on:click={() => showInstructions = !showInstructions}
                >
                    Help
                </button>
                <button
                    class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    on:click={startNewGame}
                >
                    New
                </button>
            </div>
        </div>
    </header>

    {#if showInstructions}
        <div class="bg-white rounded-lg shadow-sm p-3 mb-2 text-sm" transition:slide>
            <h2 class="font-bold mb-1">How to Play:</h2>
            <ul class="space-y-1 text-gray-600">
                <li>🎯 Match your grid to the target above</li>
                <li>🔄 Tap two cells to swap colors</li>
                <li>⏱️ Complete before time runs out</li>
                <li>⭐ Score more by matching quickly</li>
            </ul>
        </div>
    {/if}

    <div class="bg-white rounded-lg shadow-sm p-3 relative">
        <canvas
            bind:this={canvas}
            on:click={handleClick}
            class="w-full"
        ></canvas>

        {#if gameOver}
            <div 
                class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80"
                transition:fade={{ duration: 300 }}
            >
                <div 
                    class="text-center text-white space-y-4"
                    transition:scale={{ duration: 300, delay: 300 }}
                >
                    <h2 class="text-3xl font-bold mb-4">Game Over!</h2>
                    <p class="text-xl">Final Score: {score}</p>
                    <p class="text-lg mb-6">High Score: {highScore}</p>
                    <button
                        class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transform hover:scale-105 transition-all duration-200 shadow-lg text-lg"
                        on:click={startNewGame}
                    >
                        Play Again
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
</main>

<svelte:window on:resize={handleResize}/>

<style>
:global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-tap-highlight-color: transparent;
}

canvas {
    touch-action: none;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.pulse {
    animation: pulse 2s infinite;
}

:global(.transition-all) {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.transform) {
    transform: translateZ(0);
}

:global(.hover\:scale-105:hover) {
    transform: scale(1.05);
}
</style>