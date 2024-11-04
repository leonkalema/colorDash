<script>
    import { fade, scale, fly } from 'svelte/transition';
    import { elasticOut } from 'svelte/easing';
    import { gameStore } from '$lib/stores/gameStore';
    import { difficulties } from '$lib/config/difficulties';
    import { audioManager } from '$lib/utils/audio';
  
    function setDifficulty(difficulty) {
      audioManager.playSound('click');
      gameStore.setDifficulty(difficulty);
      gameStore.startGame();
    }
  </script>
  
  {#if $gameStore.showDifficultySelect}
    <div class="overlay" transition:fade={{ duration: 300 }}>
      <div class="difficulty-select" in:scale={{ duration: 400, easing: elasticOut }}>
        <h2>Select Difficulty</h2>
        <div class="difficulty-buttons">
          {#each Object.entries(difficulties) as [key, diff]}
            <button 
              class="difficulty-btn {$gameStore.currentDifficulty === key ? 'active' : ''}"
              on:click={() => setDifficulty(key)}
              in:fly={{ y: 20, duration: 300, delay: 200 }}>
              <span class="diff-name">{diff.name}</span>
              <div class="diff-details">
                <span class="high-score">Best: {$gameStore.highScores[key]}</span>
                <span class="multiplier">×{diff.scoreMultiplier}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}
  
  <style>
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
  
    .difficulty-select {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      min-width: 280px;
    }
  
    h2 {
      font-size: 1.5em;
      margin-bottom: 1em;
    }
  
    .difficulty-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
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
  
    .diff-details {
      display: flex;
      gap: 10px;
      font-size: 0.9em;
    }
  
    .multiplier {
      opacity: 0.8;
    }
  </style>