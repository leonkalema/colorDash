<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import GameCanvas from '$lib/components/byggfeber/GameCanvas.svelte';
    import GameControls from '$lib/components/byggfeber/GameControls.svelte';
    import TouchControls from '$lib/components/byggfeber/TouchControls.svelte';
    import { createShape, updateGameState, moveShape, rotateShape } from '$lib/utils/byygfeber/gameLogic';
    import type { GameState } from '$lib/types';
  
    let gameState: GameState = {
      score: 0,
      gameOver: false,
      currentShape: null,
      fallenBlocks: []
    };
  
    let highScore = 0;
    let gameLoop: number;
    let lastTime = 0;
    let isMobile = false;
    const FPS = 60;
    const frameTime = 1000 / FPS;
  
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
  
    // Handle page visibility changes
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
        // Check if device is mobile
        isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        // Only add keyboard events on desktop
        if (!isMobile) {
          window.addEventListener('keydown', handleKeydown);
        }
        
        // Handle page visibility
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
  
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="text-center w-full max-w-lg mx-auto">
      <h1 class="text-4xl font-bold text-white mb-4 md:mb-8">Byggfeber</h1>
      <div class="text-white mb-4">
        <p class="text-xl">Score: {gameState.score}</p>
        <p class="text-xl">High Score: {highScore}</p>
      </div>
      
      <!-- Game container with fixed aspect ratio -->
      <div class="relative w-full aspect-[10/16] max-h-[70vh] mb-4">
        <GameCanvas {gameState} />
      </div>
      
      <!-- Controls -->
      {#if !isMobile}
        <GameControls {gameState} onRestart={startGame} />
      {:else}
        <button
          class="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors mb-4"
          on:click={startGame}
        >
          {gameState.gameOver ? 'Play Again' : 'New Game'}
        </button>
        <TouchControls 
          onMove={handleMove}
          onRotate={handleRotate}
        />
      {/if}
    </div>
  </div>
  
  <style>
    /* Prevent scrolling on mobile devices */
    :global(body) {
      overflow: hidden;
      position: fixed;
      width: 100%;
      height: 100%;
    }
    
    /* Prevent text selection */
    :global(*) {
      user-select: none;
      -webkit-user-select: none;
    }
  </style>