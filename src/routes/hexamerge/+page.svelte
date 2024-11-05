<script>
    import { onMount } from 'svelte';
    
    let canvas;
    let ctx;
    let hexSize = 35;
    let gridSize = 5;
    let grid = [];
    let score = 0;
    let highScore = 0;
    let gameOver = false;
    let hexPositions = [];
    let lastPlacedTile = null;
    
    const colors = {
      1: '#00E5A0',    // Bright mint
      2: '#4287f5',    // Bright blue
      4: '#ffa500',    // Bright orange
      8: '#9D5BED',    // Bright purple
      16: '#ff4444',   // Bright red
      32: '#ff69b4',   // Bright pink
      64: '#4834d4',   // Deep indigo
      128: '#2ecc71'   // Emerald
    };
    
    onMount(() => {
      const savedHighScore = localStorage.getItem('hexamerge-highscore');
      if (savedHighScore) {
        highScore = parseInt(savedHighScore);
      }
      initializeCanvas();
      resetGame();
    });
  
    function initializeCanvas() {
      const padding = hexSize * 2;
      canvas.width = (gridSize * hexSize * 1.8) + (padding * 2);
      canvas.height = (gridSize * hexSize * 2) + (padding * 2);
      ctx = canvas.getContext('2d');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }
  
    function resetGame() {
      grid = Array(gridSize * gridSize).fill(null);
      score = 0;
      gameOver = false;
      lastPlacedTile = null;
      addRandomTile();
      addRandomTile();
      draw();
    }
  
    function getEmptyCells() {
      return grid.reduce((acc, cell, idx) => 
        cell === null ? [...acc, idx] : acc, []);
    }
  
    function addRandomTile() {
      const emptyCells = getEmptyCells();
      if (emptyCells.length === 0) return false;
      
      const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newValue = Math.random() < 0.7 ? 1 : (Math.random() < 0.8 ? 2 : 3);
      grid[randomIndex] = newValue;
      return true;
    }
  
    function drawHex(x, y, size, value = null) {
      const a = (2 * Math.PI) / 6;
      
      // Draw shadow
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(
          x + (size + 2) * Math.cos(a * i - Math.PI/6),
          y + (size + 2) * Math.sin(a * i - Math.PI/6)
        );
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();
      ctx.restore();
  
      // Draw hex
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(
          x + size * Math.cos(a * i - Math.PI/6),
          y + size * Math.sin(a * i - Math.PI/6)
        );
      }
      ctx.closePath();
      
      if (value === null) {
        ctx.fillStyle = '#F3F4F6';
        ctx.strokeStyle = '#E5E7EB';
      } else {
        ctx.fillStyle = colors[2 ** (value - 1)] || '#9CA3AF';
        ctx.strokeStyle = '#FFFFFF';
      }
      
      ctx.fill();
      ctx.stroke();
      
      if (value !== null) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(2 ** (value - 1), x, y);
        ctx.shadowBlur = 0;
      }
    }
  
    function getHexPosition(row, col) {
      const padding = hexSize * 2;
      const x = padding + col * hexSize * 1.73;
      const y = padding + row * hexSize * 1.5 + (col % 2) * hexSize * 0.75;
      return { x, y };
    }
  
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hexPositions = [];
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const index = row * gridSize + col;
          const { x, y } = getHexPosition(row, col);
          drawHex(x, y, hexSize, grid[index]);
          hexPositions[index] = { x, y };
        }
      }
  
      if (gameOver) {
        drawGameOver();
      }
    }
  
    function drawGameOver() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 30px Arial';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
      ctx.font = '20px Arial';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    }
  
    function handleClick(event) {
      if (gameOver) {
        resetGame();
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const index = getClickedHex(x, y);
      
      if (index !== -1) {
        placeTile(index);
      }
    }
  
    function getClickedHex(x, y) {
      return hexPositions.findIndex((hex) => {
        const dx = x - hex.x;
        const dy = y - hex.y;
        return Math.sqrt(dx * dx + dy * dy) < hexSize;
      });
    }
  
    function placeTile(index) {
      // Can only place in empty cells
      if (grid[index] !== null) {
        highlightInvalidMove(index);
        return;
      }
      
      // Place new tile
      const newValue = Math.random() < 0.7 ? 1 : (Math.random() < 0.8 ? 2 : 3);
      grid[index] = newValue;
      lastPlacedTile = index;
      draw();
      
      // Try to merge after placement
      setTimeout(() => {
        if (!mergeTiles(index)) {
          // Only add new tile if no merges happened
          addRandomTile();
        }
        draw();
        checkGameOver();
      }, 150);
    }
  
    function highlightInvalidMove(index) {
      const { x, y } = hexPositions[index];
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      drawHex(x, y, hexSize);
      setTimeout(() => draw(), 200);
    }
  
    function getNeighbors(index) {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const neighbors = [];
      
      // Define possible neighbor offsets for hexagonal grid
      const directions = [
        [-1, 0], // up
        [1, 0],  // down
        [0, -1], // left
        [0, 1],  // right
        [-1, -1], // up-left
        [-1, 1]   // up-right
      ];
      
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;
        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
          neighbors.push(newRow * gridSize + newCol);
        }
      }
      
      return neighbors;
    }
  
    function mergeTiles(index) {
      const value = grid[index];
      const neighbors = getNeighbors(index);
      let merged = false;
      
      const tilesToMerge = neighbors.filter(n => grid[n] === value);
      
      if (tilesToMerge.length > 0) {
        const newValue = value + 1;
        grid[index] = newValue;
        score += newValue * (tilesToMerge.length + 1);
        
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('hexamerge-highscore', highScore.toString());
        }
        
        tilesToMerge.forEach(n => {
          grid[n] = null;
        });
        
        merged = true;
        draw();
        
        // Check for chain reactions
        setTimeout(() => {
          if (mergeTiles(index)) {
            addRandomTile();
          }
        }, 150);
      }
      
      return merged;
    }
  
    function checkGameOver() {
      const emptyCells = getEmptyCells();
      if (emptyCells.length === 0) {
        const canMerge = grid.some((value, index) => {
          if (value === null) return false;
          const neighbors = getNeighbors(index);
          return neighbors.some(n => grid[n] === value);
        });
        
        if (!canMerge) {
          gameOver = true;
          draw();
        }
      }
    }
  </script>
  
  <main class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-xl mx-auto bg-white p-4 rounded-lg shadow">
      <header class="mb-4">
        <h1 class="text-2xl font-bold text-center mb-2">HexaMerge</h1>
        <div class="flex justify-between items-center">
          <div class="text-lg font-semibold">Score: {score}</div>
          <div class="text-sm text-gray-600">Best: {highScore}</div>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            on:click={resetGame}
          >
            New Game
          </button>
        </div>
      </header>
  
      <div class="bg-yellow-50 p-4 rounded-lg mb-4 text-sm">
        <h2 class="font-bold mb-2">Rules:</h2>
        <ul class="space-y-1">
          <li>1️⃣ Tap any empty hexagon to place a new tile</li>
          <li>2️⃣ A new tile will appear automatically after each move</li>
          <li>3️⃣ Same numbers merge when adjacent</li>
          <li>4️⃣ Try to create higher numbers before the grid fills up!</li>
        </ul>
      </div>
  
      <canvas
        bind:this={canvas}
        on:click={handleClick}
        class="w-full"
      ></canvas>
    </div>
  </main>
  
  <style>
    :global(body) {
      margin: 0;
      padding: 0;
      background: #f5f5f7;
    }
  
    canvas {
      touch-action: none;
    }
  </style>
  