<script>
    import { fade, scale } from 'svelte/transition';
    import { elasticOut } from 'svelte/easing';
    import { gameStore, currentDifficultySettings } from '$lib/stores/gameStore';
  
    // Hide overlay after 1.5 seconds
    if ($gameStore.isStarting) {
      setTimeout(() => {
        gameStore.setStarting(false);
      }, 1500);
    }
  </script>
  
  {#if $gameStore.isStarting}
    <div class="overlay" transition:fade={{ duration: 1000 }}>
      <div class="content" in:scale={{ duration: 500, easing: elasticOut }}>
        <h2 class="mode">{$currentDifficultySettings.name} Mode</h2>
        <div class="details">
          <p>Lives: {$currentDifficultySettings.lives}</p>
          <p>Score ×{$currentDifficultySettings.scoreMultiplier}</p>
        </div>
        <div class="message">Get Ready!</div>
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
  
    .content {
      text-align: center;
      color: white;
    }
  
    .mode {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 0.5em;
    }
  
    .details {
      font-size: 1.2em;
      opacity: 0.9;
      margin-bottom: 1em;
    }
  
    .message {
      font-size: 2em;
      font-weight: bold;
      color: #fbbf24;
    }
  </style>