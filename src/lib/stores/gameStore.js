import { writable, derived } from 'svelte/store';
import { difficulties } from '../config/difficulties';
import { createTiles } from '../utils/canvas';
import { TARGET_COLOR } from '../constants/gameConstants';

function createGameStore() {
  const initialState = {
    score: 0,
    highScores: {
      easy: 0,
      medium: 0,
      hard: 0
    },
    lives: difficulties.medium.lives,
    gameSpeed: difficulties.medium.initialSpeed,
    isGameOver: false,
    showSuccess: false,
    tiles: [],
    isStarting: true,
    showStartScreen: true,
    showDifficultySelect: false,
    currentDifficulty: 'medium'
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    // Score management
    updateScore: (points) => update(state => ({
      ...state,
      score: state.score + points,
      highScores: {
        ...state.highScores,
        [state.currentDifficulty]: Math.max(
          state.highScores[state.currentDifficulty],
          state.score + points
        )
      }
    })),

    // Lives management
    loseLife: () => update(state => ({
      ...state,
      lives: state.lives - 1
    })),

    // Difficulty management
    setDifficulty: (difficulty) => update(state => ({
      ...state,
      currentDifficulty: difficulty,
      showDifficultySelect: false,
      lives: difficulties[difficulty].lives,
      gameSpeed: difficulties[difficulty].initialSpeed
    })),

    // Tiles management
    updateTiles: () => update(state => ({
      ...state,
      tiles: createTiles(TARGET_COLOR, difficulties[state.currentDifficulty])
    })),

    // Game speed management
    updateGameSpeed: (newSpeed) => update(state => ({
      ...state,
      gameSpeed: newSpeed
    })),

    // Success message management
    showSuccessMessage: () => {
      update(state => ({ ...state, showSuccess: true }));
      setTimeout(() => {
        update(state => ({ ...state, showSuccess: false }));
      }, 500);
    },

    // Game state management
    startGame: () => update(state => ({
      ...state,
      score: 0,
      lives: difficulties[state.currentDifficulty].lives,
      gameSpeed: difficulties[state.currentDifficulty].initialSpeed,
      isGameOver: false,
      isStarting: true,
      showStartScreen: false,
      tiles: createTiles(TARGET_COLOR, difficulties[state.currentDifficulty])
    })),

    endGame: () => update(state => ({
      ...state,
      isGameOver: true
    })),

    // UI state management
    toggleDifficultySelect: (show) => update(state => ({
      ...state,
      showDifficultySelect: show
    })),

    hideStartScreen: () => update(state => ({
      ...state,
      showStartScreen: false
    })),

    // Timer management
    setStarting: (isStarting) => update(state => ({
      ...state,
      isStarting
    })),

    // Reset functionality
    reset: () => set(initialState)
  };
}

export const gameStore = createGameStore();

// Derived store for current difficulty settings
export const currentDifficultySettings = derived(
  gameStore,
  $gameStore => difficulties[$gameStore.currentDifficulty]
);

// Derived store for game status
export const gameStatus = derived(
  gameStore,
  $gameStore => ({
    isPlaying: !$gameStore.isGameOver && !$gameStore.showStartScreen && !$gameStore.isStarting,
    canStart: !$gameStore.isGameOver && !$gameStore.isStarting,
    isPaused: false
  })
);