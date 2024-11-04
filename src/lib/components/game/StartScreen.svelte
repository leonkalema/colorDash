<script>
    import { scale } from 'svelte/transition';
    import { elasticOut } from 'svelte/easing';
    import { audioManager } from '$lib/utils/audio';
    import { gameStore } from '$lib/stores/gameStore';
  
    async function handleStart() {
      await audioManager.init();
      gameStore.startGame();
    }
  </script>
  
  <div class="start-screen" in:scale={{ duration: 500, easing: elasticOut }}>
    <div class="content">
      <h1>Color Tiles</h1>
      <p>Click the matching colored tiles</p>
      <button on:click={handleStart}>
        Start Game
      </button>
    </div>
  </div>
  
  <style>
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
      color: white;
    }
  
    h1 {
      font-size: 2.5em;
      margin-bottom: 0.5em;
      color: #3b82f6;
    }
  
    p {
      margin-bottom: 2em;
      font-size: 1.2em;
      opacity: 0.9;
    }
  
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 8px;
      font-size: 1.2em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
  
    button:hover {
      background: #2563eb;
      transform: scale(1.05);
    }
  </style>