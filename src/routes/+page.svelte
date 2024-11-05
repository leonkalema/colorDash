<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade, fly, scale, slide } from 'svelte/transition';
    import { elasticOut, bounceOut } from 'svelte/easing';
  
    // Audio Context and Sound Management
    let audioContext;
    let sounds = {
      success: null,
      fail: null,
      gameOver: null,
      start: null,
      click: null
    };
    let isSoundEnabled = true;
  
    // Game State
    let score = 0;
    let highScores = {
      easy: 0,
      medium: 0,
      hard: 0
    };
    let lives;
    let gameSpeed;
    let isGameOver = false;
    let showSuccess = false;
    let tiles = [];
    let isStarting = true;
    let showDifficultySelect = false;
    let currentDifficulty = 'easy';
  
    // Canvas Setup
    let canvas;
    let ctx;
    const gridSize = 3;
    const tileSize = 100;
    const gap = 10;
    const canvasSize = gridSize * tileSize + (gridSize - 1) * gap;
    const targetColor = '#ef4444';
    let interval;
  
    // Difficulty Settings
    const difficulties = {
      easy: {
        name: 'Easy',
        initialSpeed: 2000,
        speedReduction: 5,
        minSpeed: 300,
        lives: 5,
        scoreMultiplier: 1,
        similarColors: false
      },
      medium: {
        name: 'Medium',
        initialSpeed: 1000,
        speedReduction: 50,
        minSpeed: 300,
        lives: 3,
        scoreMultiplier: 2,
        similarColors: false
      },
      hard: {
        name: 'Hard',
        initialSpeed: 800,
        speedReduction: 75,
        minSpeed: 200,
        lives: 2,
        scoreMultiplier: 3,
        similarColors: true
      }
    };
  
    // Sound Functions
    async function initSounds() {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      sounds.success = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(587.33, audioContext.currentTime);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.3);
      };
  
      sounds.fail = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(196.00, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(146.83, audioContext.currentTime + 0.2);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.2);
      };
  
      sounds.gameOver = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(440, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.5);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.5);
      };
  
      sounds.start = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(523.25, audioContext.currentTime);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.2);
      };
  
      sounds.click = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(880, audioContext.currentTime);
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.05);
      };
    }
  
    function playSound(soundName) {
      if (audioContext && sounds[soundName] && isSoundEnabled) {
        try {
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          sounds[soundName]();
        } catch (error) {
          console.error('Error playing sound:', error);
        }
      }
    }
  
    function toggleSound() {
      isSoundEnabled = !isSoundEnabled;
      if (!isSoundEnabled && audioContext) {
        audioContext.suspend();
      } else if (isSoundEnabled && audioContext) {
        audioContext.resume();
      }
    }
  
    // Game Functions
    function getDistractorColor() {
      if (difficulties[currentDifficulty].similarColors) {
        const baseColor = parseInt(targetColor.slice(1), 16);
        const variation = Math.floor(Math.random() * 40) - 20;
        const r = ((baseColor >> 16) + variation) & 0xFF;
        const g = ((baseColor >> 8) & 0xFF) + Math.floor(variation/2);
        const b = (baseColor & 0xFF) + Math.floor(variation/2);
        return `rgb(${r}, ${g}, ${b})`;
      }
      return '#94a3b8';
    }
  
    function createTiles() {
      return Array.from({ length: gridSize * gridSize }, () => ({
        color: Math.random() > 0.5 ? targetColor : getDistractorColor(),
        isFlipping: false
      }));
    }
  
    function drawTiles() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvasSize, canvasSize);
  
      tiles.forEach((tile, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = col * (tileSize + gap);
        const y = row * (tileSize + gap);
  
        ctx.beginPath();
        ctx.roundRect(x, y, tileSize, tileSize, 8);
        ctx.fillStyle = tile.color;
        ctx.fill();
  
        const gradient = ctx.createLinearGradient(x, y, x, y + tileSize);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();
      });
    }
  
    function handleCanvasClick(event) {
      if (isGameOver || showDifficultySelect) return;
  
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const col = Math.floor(x / (tileSize + gap));
      const row = Math.floor(y / (tileSize + gap));
      
      if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
        const index = row * gridSize + col;
        handleTileClick(index);
      }
    }
  
    function handleTileClick(index) {
      if (isGameOver) return;
  
      playSound('click');
      tiles[index].isFlipping = true;
      tiles = [...tiles];
  
      if (tiles[index].color === targetColor) {
        playSound('success');
        const points = difficulties[currentDifficulty].scoreMultiplier;
        score += points;
        highScores[currentDifficulty] = Math.max(highScores[currentDifficulty], score);
        showSuccess = true;
        setTimeout(() => showSuccess = false, 500);
        changeTiles();
      } else {
        playSound('fail');
        lives--;
        if (lives <= 0) {
          playSound('gameOver');
          endGame();
        }
      }
    }
  
    function setDifficulty(difficulty) {
      currentDifficulty = difficulty;
      showDifficultySelect = false;
      startGame();
    }
  
    function changeTiles() {
      tiles = createTiles();
      drawTiles();
      const { minSpeed, speedReduction } = difficulties[currentDifficulty];
      gameSpeed = Math.max(minSpeed, gameSpeed - speedReduction);
      resetInterval();
    }
  
    function resetInterval() {
      clearInterval(interval);
      interval = setInterval(changeTiles, gameSpeed);
    }
  
    function startGame() {
      playSound('start');
      const difficulty = difficulties[currentDifficulty];
      isStarting = true;
      score = 0;
      lives = difficulty.lives;
      gameSpeed = difficulty.initialSpeed;
      isGameOver = false;
      tiles = createTiles();
      drawTiles();
      resetInterval();
      setTimeout(() => {
        isStarting = false;
      }, 1000);
    }
  
    function endGame() {
      isGameOver = true;
      clearInterval(interval);
    }
  
    onMount(async () => {
      await initSounds();
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      ctx = canvas.getContext('2d');
      startGame();
    });
  
    onDestroy(() => {
      clearInterval(interval);
      if (audioContext) {
        audioContext.close();
      }
    });
  
    $: if (tiles.length) drawTiles();
  </script>
  
  <div class="game-container" 
       in:fly={{ y: 20, duration: 700, delay: 0 }} 
       out:fly={{ y: -20, duration: 500 }}>
    
    {#if isStarting}
      <div class="overlay" transition:fade={{ duration: 1000 }}>
        <div class="start-message" in:scale={{ duration: 500, easing: elasticOut }}>
          {difficulties[currentDifficulty].name} Mode
        </div>
      </div>
    {/if}
  
    {#if showDifficultySelect}
      <div class="overlay" transition:fade={{ duration: 300 }}>
        <div class="difficulty-select" in:scale={{ duration: 400, easing: elasticOut }}>
          <h2>Select Difficulty</h2>
          <div class="difficulty-buttons">
            {#each Object.entries(difficulties) as [key, diff]}
              <button 
                class="difficulty-btn {currentDifficulty === key ? 'active' : ''}"
                on:click={() => setDifficulty(key)}
                in:fly={{ y: 20, duration: 300, delay: 200 }}>
                <span class="diff-name">{diff.name}</span>
                <span class="high-score">Best: {highScores[key]}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  
    <div class="header" 
         in:fly={{ y: -20, duration: 700, delay: 200 }}>
      <div class="title-row">
        <h1>Color Dash</h1>
        <button 
          class="difficulty-label"
          on:click={() => showDifficultySelect = true}>
          {difficulties[currentDifficulty].name}
        </button>
        <button 
    class="sound-toggle"
    on:click={toggleSound}
    title={isSoundEnabled ? "Mute Sound" : "Unmute Sound"}
    in:fly={{ x: 20, duration: 700, delay: 700 }}>
    {isSoundEnabled ? '🔊' : '🔇'}
  </button>
      </div>
      <div class="stats">
        <div class="stat" in:fly={{ x: -20, duration: 700, delay: 400 }}>
          🏆 High Score: {highScores[currentDifficulty]}
        </div>
        <div class="stat" in:fly={{ y: -20, duration: 700, delay: 500 }}>
          ⚡ Speed: {Math.floor(1000/gameSpeed * 100)}%
        </div>
        <div class="stat" in:fly={{ x: 20, duration: 700, delay: 600 }}>
          {#each Array(difficulties[currentDifficulty].lives) as _, i}
            <span class="heart" in:scale={{ duration: 400, delay: 700 + i * 100 }}>
              {i < lives ? '❤️' : '🤍'}
            </span>
          {/each}
        </div>
      </div>
    </div>
  
    {#if showSuccess}
      <div class="success-alert"
           in:scale={{ duration: 300, easing: bounceOut }}
           out:fade={{ duration: 200 }}>
        <span class="success-text" in:slide={{ delay: 50 }}>
          +{difficulties[currentDifficulty].scoreMultiplier} Points!
        </span>
      </div>
    {/if}
  
    <canvas
      bind:this={canvas}
      on:click={handleCanvasClick}
      class:game-over={isGameOver}
      in:scale={{ duration: 700, delay: 800, easing: elasticOut }}
    ></canvas>
  
    <div class="score" 
         in:fly={{ y: 20, duration: 700, delay: 900 }}>
      Score: {score}
    </div>
  
    {#if isGameOver}
      <div class="game-over-container" 
           in:scale={{ duration: 400, easing: elasticOut }}>
        <div class="game-over-message"
             in:fly={{ y: 20, duration: 500 }}>
          Game Over! Final Score: {score}
        </div>
        <div class="game-over-buttons">
          <button 
            on:click={() => showDifficultySelect = true}
            class="change-difficulty"
            in:scale={{ delay: 200, duration: 400, easing: elasticOut }}>
            Change Difficulty
          </button>
          <button 
            on:click={startGame}
            class="play-again"
            in:scale={{ delay: 300, duration: 400, easing: elasticOut }}>
            Retry
          </button>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    /* Previous styles remain */
    .game-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      position: relative;
    }
  
    .title-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
  
    .difficulty-label {
      background: #3b82f6;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 14px;
      cursor: pointer;
      border: none;
    }
  
    .difficulty-select {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
  
    .difficulty-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 15px;
    }
  
    .difficulty-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background: #f3f4f6;
      transition: all 0.3s ease;
    }
  
    .difficulty-btn:hover {
      background: #e5e7eb;
    }
  
    .difficulty-btn.active {
      background: #3b82f6;
      color: white;
    }
  
    .game-over-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
  
    .change-difficulty {
      background: #6b7280;
    }
  
    .change-difficulty:hover {
      background: #4b5563;
    }
  
    /* Rest of the previous styles */
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
  
    h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  
    .stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 14px;
    }
  
    .stat {
      background: #f3f4f6;
      padding: 8px 12px;
      border-radius: 20px;
    }
  
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      border-radius: 12px;
    }
  
    .start-message {
      color: white;
      font-size: 2em;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }
  
    .game-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .header {
    text-align: center;
    margin-bottom: 20px;
  }

  h1 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .stat {
    background: #f3f4f6;
    padding: 8px 12px;
    border-radius: 20px;
  }

  .heart {
    margin-left: 2px;
  }

  canvas {
    display: block;
    margin: 0 auto;
    border-radius: 8px;
    cursor: pointer;
    transition: opacity 0.3s ease;
  }

  canvas.game-over {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .score {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin: 20px 0;
  }

  .success-alert {
    background: #10b981;
    color: white;
    text-align: center;
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 10px;
    animation: pop 0.3s ease;
  }

  .game-over-container {
    text-align: center;
  }

  .game-over-message {
    background: #ef4444;
    color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background: #2563eb;
  }

  @keyframes pop {
    0% { transform: scale(0.95); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .sound-toggle {
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: background-color 0.3s ease;
    z-index: 10;
  }

  .sound-toggle:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  </style>