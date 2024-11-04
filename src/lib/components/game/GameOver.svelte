<script>

    import { gameStore } from '$lib/stores/gameStore';
    import { scale, fly, fade } from 'svelte/transition';
    import { elasticOut } from 'svelte/easing';
  
    function handleChangeDifficulty() {
      gameStore.toggleDifficultySelect(true);
    }
  
    function handleRetry() {
      gameStore.startGame();
    }
  </script>
  
  {#if $gameStore.isGameOver}
    <div class="game-over-container" 
         in:scale={{ duration: 400, easing: elasticOut }}>
      <div class="stats"
           in:fly={{ y: 20, duration: 500 }}>
        <h2 class="title">Game Over!</h2>
        <div class="score-details">
          <p class="final-score">Final Score: {$gameStore.score}</p>
          <p class="high-score">Best Score: {$gameStore.highScores[$gameStore.currentDifficulty]}</p>
        </div>
      </div>
  
      <div class="actions">
        <button 
          on:click={handleChangeDifficulty}
          class="change-difficulty"
          in:scale={{ delay: 200, duration: 400, easing: elasticOut }}>
          Change Difficulty
        </button>
        <button 
          on:click={handleRetry}
          class="retry"
          in:scale={{ delay: 300, duration: 400, easing: elasticOut }}>
          Try Again
        </button>
      </div>
    </div>
  {/if}
  
  <style>
    .game-over-container {
      text-align: center;
    }
  
    .stats {
      background: #ef4444;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
  
    .title {
      font-size: 1.8em;
      font-weight: bold;
      margin-bottom: 10px;
    }
  
    .score-details {
      font-size: 1.2em;
    }
  
    .final-score {
      font-size: 1.4em;
      font-weight: bold;
      margin-bottom: 5px;
    }
  
    .high-score {
      opacity: 0.9;
    }
  
    .actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
  
    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
  
    .change-difficulty {
      background: #6b7280;
      color: white;
    }
  
    .change-difficulty:hover {
      background: #4b5563;
    }
  
    .retry {
      background: #3b82f6;
      color: white;
    }
  
    .retry:hover {
      background: #2563eb;
    }
  </style>