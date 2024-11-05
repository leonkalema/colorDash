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
    let highScore = 0;
    let gameOver = false;
    let hexPositions = [];
    let animations = [];
    
    // Colors for tiles
    const colors = {
      1: '#00E5A0',    // Bright mint
      2: '#4287f5',    // Bright blue
      4: '#ffa500',    // Bright orange
      8: '#9D5BED',    // Bright purple
      16: '#ff4444',   // Bright red
      32: '#ff69b4',   // Bright pink
      64: '#4834d4',   // Deep indigo
      128: '#2ecc71',  // Emerald
      256: '#e056fd',  // Bright violet
      512: '#eb4d4b',  // Crimson
      1024: '#f0932b', // Orange
      2048: '#6c5ce7'  // Purple
    };
  
    // Initialize game
    onMount(() => {
      const savedHighScore = localStorage.getItem('hexamerge-highscore');
      if (savedHighScore) {
        highScore = parseInt(savedHighScore);
      }
      initializeCanvas();
      resetGame();
    });
  
    function resetGame() {
      grid = Array(gridSize * gridSize).fill(null);
      score = 0;
      gameOver = false;
      animations = [];
      addRandomTile();
      addRandomTile();
      draw();
    }
  
    function initializeCanvas() {
      const padding = hexSize * 2;
      canvas.width = (gridSize * hexSize * 1.8) + (padding * 2);
      canvas.height = (gridSize * hexSize * 2) + (padding * 2);
      ctx = canvas.getContext('2d');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }
  
    function getHexPosition(row, col) {
      const padding = hexSize * 2;
      const x = padding + col * hexSize * 1.73;
      const y = padding + row * hexSize * 1.5 + (col % 2) * hexSize * 0.75;
      return { x, y };
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
  
    function getNeighbors(index) {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const neighbors = [];
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1]];
      
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
  </script>
  
  <main>
    <div class="game-container">
      <header>
        <h1>HexaMerge</h1>
        <div class="game-info">
          <div class="scores">
            <div class="score">Score: {score}</div>
            <div class="high-score">Best: {highScore}</div>
          </div>
          <button class="link-button" on:click={() => showInstructions = !showInstructions}>
            How to Play
          </button>
          <button class="new-game-button" on:click={resetGame}>
            New Game
          </button>
        </div>
      </header>
  
      {#if showInstructions}
        <div class="instructions" transition:slide>
          <ul>
            <li>🎯 Click empty spaces to place new tiles</li>
            <li>🔄 Adjacent tiles with the same number merge</li>
            <li>⬆️ When tiles merge, they combine into a tile with double the value</li>
            <li>🎮 Try to create higher numbers and prevent the grid from filling up</li>
            <li>🏆 Aim for high scores and try to reach 2048!</li>
          </ul>
        </div>
      {/if}
  
      <canvas
        bind:this={canvas}
        on:click={handleClick}
      ></canvas>
    </div>
  </main>
  
  <style>
    :global(body) {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f7;
    }
  
    .game-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
  
    header {
      margin-bottom: 20px;
    }
  
    h1 {
      margin: 0;
      padding: 0;
      font-size: 28px;
      font-weight: bold;
      text-align: center;
      color: #333;
    }
  
    .game-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 15px;
    }
  
    .scores {
      display: flex;
      gap: 15px;
    }
  
    .score {
      font-size: 18px;
      font-weight: 500;
      color: #007AFF;
    }
  
    .high-score {
      font-size: 18px;
      font-weight: 500;
      color: #FF9500;
    }
  
    .link-button {
      background: none;
      border: none;
      color: #007AFF;
      padding: 6px 12px;
      font: inherit;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
  
    .link-button:hover {
      background: #f0f0f0;
      border-radius: 6px;
    }
  
    .new-game-button {
      background: #007AFF;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font: inherit;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  
    .new-game-button:hover {
      background: #0056b3;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
  
    .instructions {
      background: #f8f9fa;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
  
    .instructions ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
  
    .instructions li {
      margin-bottom: 10px;
      font-size: 15px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  
    .instructions li:last-child {
      margin-bottom: 0;
    }
  
    canvas {
      width: 100%;
      touch-action: none;
      display: block;
    }
  </style>