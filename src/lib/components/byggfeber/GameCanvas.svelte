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
    
    // Get the container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate the game aspect ratio
    const gameAspectRatio = GAME_WIDTH / GAME_HEIGHT;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let width, height, scale;
    
    // Calculate the best fit while maintaining aspect ratio
    if (containerAspectRatio > gameAspectRatio) {
      // Container is wider than game ratio
      height = containerHeight;
      width = height * gameAspectRatio;
      scale = height / GAME_HEIGHT;
    } else {
      // Container is taller than game ratio
      width = containerWidth;
      height = width / gameAspectRatio;
      scale = width / GAME_WIDTH;
    }
    
    // Apply the calculated dimensions
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Maintain crisp pixels by using the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Configure the context
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }
  }

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    resizeCanvas();
    
    // Use ResizeObserver for smoother handling of size changes
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    
    // Also listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeCanvas, 100); // Small delay to ensure new dimensions are available
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