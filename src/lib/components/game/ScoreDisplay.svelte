<script>
    import { fly, scale, fade } from 'svelte/transition';
    import { elasticOut, bounceOut } from 'svelte/easing';
    import { gameStore, currentDifficultySettings } from '$lib/stores/gameStore';
  </script>
  
  <div class="score-container">
    {#if $gameStore.showSuccess}
      <div class="success-alert"
           in:scale={{ duration: 300, easing: bounceOut }}
           out:fade={{ duration: 200 }}>
        <span class="success-text" in:fly={{ y: 20, delay: 50 }}>
          +{$currentDifficultySettings.scoreMultiplier} Points!
        </span>
      </div>
    {/if}
  
    <div class="score" 
         in:fly={{ y: 20, duration: 700, delay: 900 }}>
      <span class="current">Score: {$gameStore.score}</span>
      <span class="best">Best: {$gameStore.highScores[$gameStore.currentDifficulty]}</span>
    </div>
  </div>
  
  <style>
    .score-container {
      text-align: center;
      margin: 20px 0;
    }
  
    .success-alert {
      background: #10b981;
      color: white;
      text-align: center;
      padding: 8px;
      border-radius: 8px;
      margin-bottom: 10px;
      font-weight: bold;
    }
  
    .score {
      display: flex;
      justify-content: center;
      gap: 20px;
      font-size: 24px;
      font-weight: bold;
    }
  
    .current {
      color: #1f2937;
    }
  
    .best {
      color: #6b7280;
    }
  </style>