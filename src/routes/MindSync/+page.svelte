<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    
    // Game settings
    const GRID_SIZE = 5;
    const TIME_PER_TURN = 30; // seconds
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
    
    // Game state
    let playerGrid = [];
    let targetGrid = [];
    let selectedCell = null;
    let animations = [];
    
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
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, 20 * (1 - progress), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    onMount(() => {
      initializeCanvas();
      const savedHighScore = localStorage.getItem('mindsync-highscore');
      if (savedHighScore) {
        highScore = parseInt(savedHighScore);
      }
      startNewGame();
    });
    
    function initializeCanvas() {
      const cellSize = Math.min(canvas.parentElement.clientWidth / (GRID_SIZE + 2), 60);
      canvas.width = cellSize * (GRID_SIZE + 2);
      canvas.height = cellSize * (GRID_SIZE * 2 + 1);
      ctx = canvas.getContext('2d');
    }
    
    function startNewGame() {
      playerGrid = createRandomGrid();
      targetGrid = createRandomGrid();
      score = 0;
      timeLeft = TIME_PER_TURN;
      gameOver = false;
      selectedCell = null;
      animations = [];
      
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          endGame();
        }
      }, 1000);
      
      draw();
    }
    
    function createRandomGrid() {
      return Array(GRID_SIZE * GRID_SIZE).fill(0).map(() => 
        COLORS[Math.floor(Math.random() * COLORS.length)]
      );
    }
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cellSize = canvas.width / (GRID_SIZE + 2);
      
      // Draw target grid
      drawGrid(targetGrid, cellSize, cellSize);
      
      // Draw separator
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(0, cellSize * (GRID_SIZE + 0.5), canvas.width, 2);
      
      // Draw player grid
      drawGrid(playerGrid, cellSize, cellSize * (GRID_SIZE + 1.5), true);
      
      // Draw animations
      animations = animations.filter(anim => !anim.isComplete());
      animations.forEach(anim => anim.draw(ctx));
      
      if (animations.length > 0) {
        requestAnimationFrame(draw);
      }
    }
    
    function drawGrid(grid, cellSize, startY, isPlayer = false) {
      const padding = cellSize;
      
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          const x = padding + j * cellSize;
          const y = startY + i * cellSize;
          const index = i * GRID_SIZE + j;
          
          // Draw cell background
          ctx.fillStyle = grid[index];
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.roundRect(x, y, cellSize - 2, cellSize - 2, 8);
          ctx.fill();
          ctx.stroke();
          
          // Draw selection highlight
          if (isPlayer && selectedCell === index) {
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 4;
            ctx.stroke();
          }
          
          // Draw match indicators
          if (isPlayer && grid[index] === targetGrid[index]) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();
          }
        }
      }
    }
    
    function handleClick(event) {
      if (gameOver) {
        startNewGame();
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cellSize = canvas.width / (GRID_SIZE + 2);
      
      // Check if click is in player grid
      if (y >= cellSize * (GRID_SIZE + 1.5)) {
        const gridX = Math.floor((x - cellSize) / cellSize);
        const gridY = Math.floor((y - cellSize * (GRID_SIZE + 1.5)) / cellSize);
        
        if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
          const index = gridY * GRID_SIZE + gridX;
          handleCellClick(index);
        }
      }
    }
    
    function handleCellClick(index) {
      if (selectedCell === null) {
        selectedCell = index;
      } else {
        // Swap colors
        const temp = playerGrid[selectedCell];
        playerGrid[selectedCell] = playerGrid[index];
        playerGrid[index] = temp;
        
        // Add swap animation
        const cellSize = canvas.width / (GRID_SIZE + 2);
        const x1 = cellSize + (selectedCell % GRID_SIZE) * cellSize;
        const y1 = cellSize * (GRID_SIZE + 1.5) + Math.floor(selectedCell / GRID_SIZE) * cellSize;
        animations.push(new Animation(x1, y1, 'match'));
        
        selectedCell = null;
        checkMatches();
      }
      draw();
    }
    
    function checkMatches() {
      let matches = 0;
      for (let i = 0; i < playerGrid.length; i++) {
        if (playerGrid[i] === targetGrid[i]) {
          matches++;
        }
      }
      
      if (matches === playerGrid.length) {
        score += Math.ceil(timeLeft * 10);
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('mindsync-highscore', highScore.toString());
        }
        nextLevel();
      }
    }
    
    function nextLevel() {
      targetGrid = createRandomGrid();
      timeLeft = Math.max(TIME_PER_TURN - Math.floor(score / 100), 10);
      draw();
    }
    
    function endGame() {
      gameOver = true;
      clearInterval(timer);
      
      // Draw game over screen
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = '18px Arial';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 40);
    }
  </script>
  
  <main class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-xl mx-auto">
      <header class="bg-white rounded-lg shadow-lg p-4 mb-4">
        <h1 class="text-2xl font-bold text-center mb-2">MindSync</h1>
        
        <div class="flex justify-between items-center">
          <div class="space-y-1">
            <div class="text-lg font-semibold">Score: {score}</div>
            <div class="text-sm text-gray-600">Best: {highScore}</div>
          </div>
          
          <div class="text-xl font-bold text-center">
            <div class={timeLeft <= 5 ? 'text-red-500' : ''}>
              {timeLeft}s
            </div>
          </div>
          
          <div class="space-x-2">
            <button
              class="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
              on:click={() => showInstructions = !showInstructions}
            >
              How to Play
            </button>
            <button
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              on:click={startNewGame}
            >
              New Game
            </button>
          </div>
        </div>
      </header>
  
      {#if showInstructions}
        <div class="bg-white rounded-lg shadow-lg p-4 mb-4" transition:slide>
          <h2 class="font-bold mb-2">How to Play:</h2>
          <ul class="space-y-2 text-sm text-gray-600">
            <li>🎯 Match your grid to the target pattern above</li>
            <li>🔄 Click two cells to swap their colors</li>
            <li>⏱️ Complete the pattern before time runs out</li>
            <li>⭐ Score more points by matching patterns quickly</li>
            <li>🏆 Each level gets progressively harder</li>
          </ul>
        </div>
      {/if}
  
      <div class="bg-white rounded-lg shadow-lg p-4">
        <canvas
          bind:this={canvas}
          on:click={handleClick}
          class="w-full"
        ></canvas>
      </div>
    </div>
  </main>
  
  <style>
    :global(body) {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  
    canvas {
      touch-action: none;
    }
  </style>