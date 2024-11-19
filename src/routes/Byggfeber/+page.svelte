<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import GameCanvas from '$lib/components/byggfeber/GameCanvas.svelte';
  import GameControls from '$lib/components/byggfeber/GameControls.svelte';
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
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeydown);
      
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
      window.removeEventListener('keydown', handleKeydown);
      if (gameLoop) {
        cancelAnimationFrame(gameLoop);
      }
      saveGameState();
    }
  });
</script>

<div class="min-h-screen bg-gray-900 flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-4xl font-bold text-white mb-8">Byggfeber</h1>
    <div class="text-white mb-4">
      <p class="text-xl">Score: {gameState.score}</p>
      <p class="text-xl">High Score: {highScore}</p>
    </div>
    <GameCanvas {gameState} />
    <GameControls {gameState} onRestart={startGame} />
  </div>
</div>
