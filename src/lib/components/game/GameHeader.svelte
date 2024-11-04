<script>
    import { fly, scale } from 'svelte/transition';
    import { gameStore, currentDifficultySettings } from '$lib/stores/gameStore';
    import SoundToggle from './SoundToggle.svelte';
  
    function showDifficultySelect() {
      gameStore.toggleDifficultySelect(true);
    }
  </script>
  
  <div class="header" in:fly={{ y: -20, duration: 700, delay: 200 }}>
    <div class="title-row">
      <h1>Color Tiles</h1>
      <button 
        class="difficulty-label"
        on:click={showDifficultySelect}>
        {$currentDifficultySettings.name}
      </button>
      <SoundToggle />
    </div>
    
    <div class="stats">
      <div class="stat" in:fly={{ x: -20, duration: 700, delay: 400 }}>
        🏆 High Score: {$gameStore.highScores[$gameStore.currentDifficulty]}
      </div>
      <div class="stat" in:fly={{ y: -20, duration: 700, delay: 500 }}>
        ⚡ Speed: {Math.floor(1000/$gameStore.gameSpeed * 100)}%
      </div>
      <div class="stat" in:fly={{ x: 20, duration: 700, delay: 600 }}>
        {#each Array($currentDifficultySettings.lives) as _, i}
          <span class="heart" in:scale={{ duration: 400, delay: 700 + i * 100 }}>
            {i < $gameStore.lives ? '❤️' : '🤍'}
          </span>
        {/each}
      </div>
    </div>
  </div>
  
  <style>
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
  
    .title-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
  
    h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
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
  
    .difficulty-label:hover {
      background: #2563eb;
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
      display: flex;
      align-items: center;
      gap: 4px;
    }
  
    .heart {
      margin-left: 2px;
      transition: transform 0.3s ease;
    }
  
    .heart:hover {
      transform: scale(1.2);
    }
  </style>