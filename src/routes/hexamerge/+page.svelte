<script>
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
  
    let showInstructions = false;
    
    let canvas;
    let ctx;
    let hexSize = 35;
    let gridSize = 5;
    let grid = [];
    let score = 0;
    let gameOver = false;
    let hexPositions = [];
    
    const colors = {
      1: '#00E5A0',
      2: '#60A5FA',
      4: '#FFB100',
      8: '#A78BFA',
      16: '#FF6B6B',
      32: '#F472B6',
      64: '#818CF8',
      128: '#4ADE80'
    };
    
    function initializeCanvas() {
      const padding = hexSize * 2;
      canvas.width = (gridSize * hexSize * 1.8) + (padding * 2);
      canvas.height = (gridSize * hexSize * 2) + (padding * 2);
      ctx = canvas.getContext('2d');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }
    
    function drawHex(x, y, size, value = null) {
      const a = (2 * Math.PI) / 6;
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
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(2 ** (value - 1), x, y);
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
    
    function getClickedHex(x, y) {
      return hexPositions.findIndex((hex) => {
        const dx = x - hex.x;
        const dy = y - hex.y;
        return Math.sqrt(dx * dx + dy * dy) < hexSize;
      });
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
      if (index !== -1 && grid[index] === null) {
        placeTile(index);
      }
    }
    
    function resetGame() {
      grid = Array(gridSize * gridSize).fill(null);
      score = 0;
      gameOver = false;
      addRandomTile();
      addRandomTile();
      draw();
    }
    
    function getNeighbors(index) {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const neighbors = [];
      
      // Offset for even/odd columns
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
        
        tilesToMerge.forEach(n => {
          grid[n] = null;
        });
        
        merged = true;
        draw();
        
        setTimeout(() => {
          if (mergeTiles(index)) {
            addRandomTile();
          }
        }, 150);
      }
      
      return merged;
    }
    
    function addRandomTile() {
      const emptyCells = grid.reduce((acc, cell, idx) => 
        cell === null ? [...acc, idx] : acc, []);
      
      if (emptyCells.length === 0) return;
      
      const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newValue = Math.random() < 0.7 ? 1 : (Math.random() < 0.8 ? 2 : 3);
      grid[randomIndex] = newValue;
      draw();
      checkGameOver();
    }
    
    function placeTile(index) {
      if (gameOver || grid[index] !== null) return;
      
      grid[index] = Math.random() < 0.7 ? 1 : (Math.random() < 0.8 ? 2 : 3);
      draw();
      
      setTimeout(() => {
        if (!mergeTiles(index)) {
          addRandomTile();
        }
      }, 150);
    }
    
    function checkGameOver() {
      const emptyCells = grid.filter(cell => cell === null);
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
    
    onMount(() => {
      initializeCanvas();
      resetGame();
    });
  </script>
  
 <main class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-xl mx-auto bg-white p-4">
      <!-- Header Section -->
      <h1 class="text-2xl font-bold text-center mb-4"> HexaMerge </h1>
      
      <!-- Score and Controls Row -->
      <div class="flex justify-between items-center mb-4">
        <div class="font-semibold">Score: {score}</div>
        
        <button
          class="text-blue-600 hover:text-blue-800 px-2 py-1"
          on:click={() => showInstructions = !showInstructions}
        >
          {showInstructions ? 'Hide Instructions' : 'How to Play'}
        </button>
        
        <button
          class="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          on:click={resetGame}
        >
          New Game
        </button>
      </div>
  
      <!-- Instructions (Collapsible) -->
      {#if showInstructions}
        <div class="mb-4 bg-gray-50 p-3 rounded" transition:slide>
          <ul class="space-y-1 text-sm text-gray-700">
            <li>• Click empty spaces to place new tiles</li>
            <li>• Adjacent tiles with the same number merge</li>
            <li>• When tiles merge, they combine into a tile with double the value</li>
            <li>• Try to create higher numbers and prevent the grid from filling up</li>
          </ul>
        </div>
      {/if}
  
      <!-- Game Canvas -->
      <canvas
        bind:this={canvas}
        on:click={handleClick}
        class="w-full"
      ></canvas>
    </div>
  </main>
  
  <style>
    canvas {
      touch-action: none;
    }
    
    :global(body) {
      margin: 0;
      padding: 0;
      background: #F3F4F6;
    }
  
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
  </style>