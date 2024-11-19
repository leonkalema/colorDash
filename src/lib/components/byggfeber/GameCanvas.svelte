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
    
    // Get available space (accounting for controls)
    const availableHeight = window.innerHeight - 300; // Reserve space for header and controls
    const availableWidth = container.clientWidth;
    
    // Target a mobile-friendly game size (2:3 aspect ratio)
    const targetRatio = 2/3;
    const currentRatio = availableWidth / availableHeight;
    
    let width, height;
    if (currentRatio > targetRatio) {
      // Screen is wider than target ratio
      height = Math.min(availableHeight, 600); // Cap max height
      width = height * targetRatio;
    } else {
      // Screen is taller than target ratio
      width = Math.min(availableWidth, 400); 
      height = width / targetRatio;
    }
    
    // Apply sizes while maintaining pixel ratio
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Set internal resolution
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
  }

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    resizeCanvas();
    
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeCanvas, 100);
    });
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

<div 
  class="w-full h-full relative flex items-center justify-center" 
  bind:this={container}
>
  <canvas
    bind:this={canvas}
    class="border-4 border-purple-500 rounded-lg shadow-lg bg-gray-100"
    style="touch-action: none;"
  />
</div>