<script>
    import { onMount } from 'svelte';
    import { fly, fade, scale } from 'svelte/transition';
    import { elasticOut } from 'svelte/easing';
    import { gameStore, currentDifficultySettings, gameStatus } from '$lib/stores/gameStore';
    import { audioManager } from '$lib/utils/audio';
    import Canvas from '$lib/components/game/Canvas.svelte';
    import GameHeader from '$lib/components/game/GameHeader.svelte';
    import DifficultySelector from '$lib/components/game/DifficultySelector.svelte';
    import StartOverlay from '$lib/components/game/StartOverlay.svelte';
    import ScoreDisplay from '$lib/components/game/ScoreDisplay.svelte';
    import GameOver from '$lib/components/game/GameOver.svelte';
  
    // Handle keyboard events for game controls
    function handleKeydown(event) {
      if ($gameStore.isGameOver || $gameStore.showStartScreen) return;
      
      switch(event.key) {
        case 'r':
        case 'R':
          if ($gameStore.isGameOver) gameStore.startGame();
          break;
        case 'Escape':
          if ($gameStore.showDifficultySelect) {
            gameStore.toggleDifficultySelect(false);
          }
          break;
      }
    }
  
    onMount(() => {
      window.addEventListener('keydown', handleKeydown);
      return () => {
        window.removeEventListener('keydown', handleKeydown);
        audioManager.cleanup();
      };
    });
  </script>
  
  <svelte:head>
    <title>Color Dash Game</title>
  </svelte:head>
  
  <div 
    class="min-h-screen bg-gray-100 flex items-center justify-center p-4"
    on:keydown={handleKeydown}
  >
    <div 
      class="game-container" 
      in:fly={{ y: 20, duration: 700, delay: 0 }} 
      out:fly={{ y: -20, duration: 500 }}
    >
      {#if $gameStore.showStartScreen}
        <div 
          class="start-screen" 
          in:scale={{ duration: 500, easing: elasticOut }}
        >
          <div class="content">
            <h1>Color Dash</h1>
            <p>Test your reflexes! Click the matching colored tiles.</p>
            <div class="features">
              <div class="feature">🎯 Multiple difficulty levels</div>
              <div class="feature">🏆 High score tracking</div>
              <div class="feature">🎵 Sound effects</div>
            </div>
            <button 
              on:click={async () => {
                await audioManager.init();
                gameStore.startGame();
                audioManager.playSound('start');
              }}
            >
              Start Game
            </button>
          </div>
        </div>
      {:else}
        {#if $gameStore.isStarting}
          <StartOverlay />
        {/if}
  
        <GameHeader />
  
        {#if $gameStore.showSuccess}
          <div 
            class="success-alert"
            in:scale={{ duration: 300, easing: elasticOut }}
            out:fade={{ duration: 200 }}
          >
            <span 
              class="success-text" 
              in:fly={{ y: 20, delay: 50 }}
            >
              +{$currentDifficultySettings.scoreMultiplier} Points!
            </span>
          </div>
        {/if}
  
        <Canvas />
        <ScoreDisplay />
        
        {#if $gameStore.isGameOver}
          <GameOver />
        {/if}
  
        {#if $gameStore.showDifficultySelect}
          <DifficultySelector />
        {/if}
      {/if}
    </div>
  </div>
  
  <style>
    :global(body) {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
                   'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  
    .game-container {
      max-width: 400px;
      width: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
                  0 2px 4px -2px rgb(0 0 0 / 0.1);
      position: relative;
      overflow: hidden;
      padding: 20px;
    }
  
    .start-screen {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      border-radius: 12px;
    }
  
    .content {
      text-align: center;
      padding: 2rem;
      color: white;
    }
  
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #3b82f6;
      font-weight: bold;
    }
  
    p {
      margin-bottom: 2rem;
      font-size: 1.2rem;
      opacity: 0.9;
      line-height: 1.5;
    }
  
    .features {
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  
    .feature {
      font-size: 1.1rem;
      opacity: 0.8;
    }
  
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
  
    button:hover {
      background: #2563eb;
      transform: scale(1.05);
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
  
    @media (max-width: 480px) {
      .game-container {
        margin: 0;
        border-radius: 0;
        min-height: 100vh;
      }
  
      h1 {
        font-size: 2rem;
      }
  
      p {
        font-size: 1rem;
      }
  
      .feature {
        font-size: 1rem;
      }
  
      button {
        font-size: 1.1rem;
        padding: 0.8rem 1.6rem;
      }
    }
  
    @keyframes pop {
      0% { transform: scale(0.95); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  </style>