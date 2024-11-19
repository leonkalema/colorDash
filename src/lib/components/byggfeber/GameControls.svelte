<script lang="ts">
  import type { GameState } from '../types';

  export let gameState: GameState;
  export let onRestart: () => void;
</script>

<div class="mt-4 space-y-4">
  <div class="text-white text-xl">
    Score: {gameState.score}
  </div>
  {#if gameState.gameOver}
    <button
      class="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      on:click={onRestart}
    >
      Play Again
    </button>
  {/if}
  <div class="text-gray-300 text-sm space-y-1">
    <div>← → to move</div>
    <div>↑ or Space to rotate</div>
    <div>↓ to speed up</div>
  </div>
</div>