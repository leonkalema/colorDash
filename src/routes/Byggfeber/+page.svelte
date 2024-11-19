<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import GameCanvas from '$lib/components/byggfeber/GameCanvas.svelte';
    import GameControls from '$lib/components/byggfeber/GameControls.svelte';
    import TouchControls from '$lib/components/byggfeber/TouchControls.svelte';
    import ShareDialog from '$lib/components/byggfeber/ShareDialog.svelte';
    import { createShape, updateGameState, moveShape, rotateShape } from '$lib/utils/byygfeber/gameLogic';
    import type { GameState } from '$lib/types';
  
    let gameState: GameState = {
      score: 0,
      gameOver: false,
      currentShape: null,
      fallenBlocks: []
    };
  
    let showShareDialog = false;
    let highScore = 0;
    let gameLoop: number;
    let lastTime = 0;
    let isMobile = false;
    const FPS = 60;
    const frameTime = 1000 / FPS;
  
    function handleShare() {
      showShareDialog = true;
    }

    function handleCloseShare() {
      showShareDialog = false;
    }

    function saveGameState() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tetrisGameState', JSON.stringify(gameState));
        if (gameState.score > highScore) {
          highScore = gameState.score;
          localStorage.setItem('tetrisHighScore', highScore.toString());
        }
      }
    }
  
    function loadGameState(): GameState | null {
      if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem('tetrisGameState');
        const savedHighScore = localStorage.getItem('tetrisHighScore');
        
        if (savedHighScore) {
          highScore = parseInt(savedHighScore);
        }
        
        if (savedState) {
          try {
            return JSON.parse(savedState);
          } catch (e) {
            console.error('Error loading saved game state:', e);
          }
        }
      }
      return null;
    }
  
    function handleKeydown(event: KeyboardEvent) {
      if (!gameState.currentShape || gameState.gameOver) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          gameState.currentShape = moveShape(gameState.currentShape, 'left', gameState.fallenBlocks);
          break;
        case 'ArrowRight':
          gameState.currentShape = moveShape(gameState.currentShape, 'right', gameState.fallenBlocks);
          break;
        case 'ArrowDown':
          updateGameState(gameState);
          break;
        case 'ArrowUp':
        case ' ':
          gameState.currentShape = rotateShape(gameState.currentShape);
          break;
      }
      gameState = { ...gameState };
      saveGameState();
    }
  
    function handleMove(direction: 'left' | 'right' | 'down') {
      if (!gameState.currentShape || gameState.gameOver) return;
      
      if (direction === 'down') {
        updateGameState(gameState);
      } else {
        gameState.currentShape = moveShape(gameState.currentShape, direction, gameState.fallenBlocks);
      }
      gameState = { ...gameState };
      saveGameState();
    }
  
    function handleRotate() {
      if (!gameState.currentShape || gameState.gameOver) return;
      gameState.currentShape = rotateShape(gameState.currentShape);
      gameState = { ...gameState };
      saveGameState();
    }
  
    function update(timestamp: number) {
      if (timestamp - lastTime >= frameTime) {
        updateGameState(gameState);
        gameState = { ...gameState };
        saveGameState();
        lastTime = timestamp;
      }
      gameLoop = requestAnimationFrame(update);
    }
    
    function startGame() {
      if (gameState.score > highScore) {
        highScore = gameState.score;
        localStorage.setItem('tetrisHighScore', highScore.toString());
      }
  
      gameState = {
        score: 0,
        gameOver: false,
        currentShape: createShape(),
        fallenBlocks: []
      };
      
      if (gameLoop) {
        cancelAnimationFrame(gameLoop);
      }
      lastTime = 0;
      gameLoop = requestAnimationFrame(update);
      saveGameState();
    }
  
    function handleVisibilityChange() {
      if (document.hidden && gameLoop) {
        cancelAnimationFrame(gameLoop);
      } else {
        lastTime = 0;
        gameLoop = requestAnimationFrame(update);
      }
    }
    
    onMount(() => {
      if (typeof window !== 'undefined') {
        isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        if (!isMobile) {
          window.addEventListener('keydown', handleKeydown);
        }
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        const savedState = loadGameState();
        if (savedState && !savedState.gameOver) {
          gameState = savedState;
        } else {
          startGame();
        }
        
        gameLoop = requestAnimationFrame(update);
      }
    });
    
    onDestroy(() => {
      if (typeof window !== 'undefined') {
        if (!isMobile) {
          window.removeEventListener('keydown', handleKeydown);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (gameLoop) {
          cancelAnimationFrame(gameLoop);
        }
        saveGameState();
      }
    });
</script>
  
<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Byggfeber - Tetris Game</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 flex flex-col">
  <div class="w-full py-1 flex-none">
    <h3 class="text-2xl font-bold text-white text-center">Byggfeber</h3>
    <div class="text-white text-center mt-2 flex items-center justify-center gap-3">
      <p class="text-xl">High Score: {highScore}</p>
      {#if highScore > 0}
        <button
          class="inline-flex items-center gap-2 px-3 py-1 bg-purple-500 hover:bg-purple-600 rounded-full text-sm font-medium transition-colors"
          on:click={handleShare}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Share
        </button>
      {/if}
    </div>
  </div>

  <div class="flex-1 flex items-center justify-center px-2 pb-32 mt-[-100px]">
    <div class="w-full max-w-sm">
      <GameCanvas {gameState} />
    </div>
  </div>

  {#if !isMobile}
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-900">
      <div class="max-w-lg mx-auto">
        <GameControls {gameState} onRestart={startGame} />
      </div>
    </div>
  {:else}
    <div class="fixed bottom-0 left-0 right-0 flex flex-col items-center bg-gray-900/80 backdrop-blur-sm pb-6">
      {#if gameState.gameOver}
        <button
          class="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors my-4"
          on:click={startGame}
        >
          Play Again
        </button>
      {/if}
      <TouchControls 
        onMove={handleMove}
        onRotate={handleRotate}
      />
    </div>
  {/if}

  {#if showShareDialog}
    <ShareDialog 
      score={highScore} 
      onClose={handleCloseShare}
    />
  {/if}
</div>

<style>
  :global(body) {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
    -webkit-overflow-scrolling: touch;
  }
  
  :global(*) {
    user-select: none;
    -webkit-user-select: none;
  }

  :global(html, body) {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }
</style>