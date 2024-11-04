<script>
    import { onMount, onDestroy } from 'svelte';
    import { scale } from 'svelte/transition';
    import { elasticOut } from 'svelte/easing';
    import { gameStore, currentDifficultySettings } from '$lib/stores/gameStore';
    import { audioManager } from '$lib/utils/audio';
    import { drawTile, getClickedTileIndex } from '$lib/utils/canvas';
    import { CANVAS_SIZE, TARGET_COLOR } from '$lib/constants/gameConstants';
    
    let canvas;
    let ctx;
    let interval;
  
    function handleClick(event) {
      if ($gameStore.isGameOver || $gameStore.showDifficultySelect) return;
  
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const index = getClickedTileIndex(x, y);
      if (index !== -1) {
        handleTileClick(index);
      }
    }
  
    function handleTileClick(index) {
      if ($gameStore.isGameOver) return;
  
      audioManager.playSound('click');
      
      const currentTile = $gameStore.tiles[index];
  
      if (currentTile.color === TARGET_COLOR) {
        audioManager.playSound('success');
        gameStore.updateScore($currentDifficultySettings.scoreMultiplier);
        gameStore.showSuccessMessage();
        changeTiles();
      } else {
        audioManager.playSound('fail');
        gameStore.loseLife();
        if ($gameStore.lives <= 0) {
          audioManager.playSound('gameOver');
          gameStore.endGame();
        }
      }
    }
  
    function changeTiles() {
      gameStore.updateTiles();
      drawTiles();
      const { minSpeed, speedReduction } = $currentDifficultySettings;
      gameStore.updateGameSpeed(Math.max(minSpeed, $gameStore.gameSpeed - speedReduction));
      resetInterval();
    }
  
    function resetInterval() {
      clearInterval(interval);
      interval = setInterval(changeTiles, $gameStore.gameSpeed);
    }
  
    function drawTiles() {
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      $gameStore.tiles.forEach((tile, i) => drawTile(ctx, tile, i));
    }
  
    onMount(() => {
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      ctx = canvas.getContext('2d');
      drawTiles();
      resetInterval();
    });
  
    onDestroy(() => {
      clearInterval(interval);
    });
  
    $: if ($gameStore.tiles.length) drawTiles();
  </script>
  
  <canvas
    bind:this={canvas}
    on:click={handleClick}
    class:game-over={$gameStore.isGameOver}
    in:scale={{ duration: 700, delay: 800, easing: elasticOut }}
  />
  
  <style>
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
  </style>