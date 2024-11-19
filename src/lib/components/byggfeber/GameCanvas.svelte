<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { GameState } from '../../types';
  import { GAME_WIDTH, GAME_HEIGHT } from '../../types';
  import { drawGame } from '../../utils/byygfeber/renderer';

  export let gameState: GameState;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let container: HTMLDivElement;
  let resizeObserver: ResizeObserver;

  function resizeCanvas() {
    if (!canvas || !container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Maintain game aspect ratio
    const gameAspectRatio = GAME_WIDTH / GAME_HEIGHT;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let width, height;
    if (containerAspectRatio > gameAspectRatio) {
      // Container is wider than game ratio
      height = containerHeight;
      width = height * gameAspectRatio;
    } else {
      // Container is taller than game ratio
      width = containerWidth;
      height = width / gameAspectRatio;
    }
    
    // Set canvas display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Set canvas resolution (internal size)
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Scale context to match display size
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
  }

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    resizeCanvas();
    
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  $: if (ctx && gameState) {
    drawGame(ctx, gameState);
  }
</script>

<div class="w-full h-full relative" bind:this={container}>
  <canvas
    bind:this={canvas}
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-purple-500 rounded-lg shadow-lg bg-gray-100"
    style="touch-action: none;"
  />
</div>