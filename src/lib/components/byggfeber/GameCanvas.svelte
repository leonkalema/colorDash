<script lang="ts">
  import { onMount } from 'svelte';
  import type { GameState } from '../../types';
  import { GAME_WIDTH, GAME_HEIGHT } from '../../types';
  import { drawGame } from '../../utils/byygfeber/renderer';

  export let gameState: GameState;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
  });

  $: if (ctx && gameState) {
    drawGame(ctx, gameState);
  }
</script>

<canvas
  bind:this={canvas}
  class="border-4 border-purple-500 rounded-lg shadow-lg bg-gray-100"
  style="touch-action: none;"
/>