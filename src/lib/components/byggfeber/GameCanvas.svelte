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

  function handleCanvasClick(event: MouseEvent) {
    if (!gameState.gameOver || !canvas) return;
    
    // Get canvas bounds
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position relative to canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale coordinates to match canvas internal resolution
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    // Button dimensions (match renderer.ts)
    const buttonWidth = 160;
    const buttonHeight = 50;
    const buttonX = GAME_WIDTH / 2 - buttonWidth / 2;
    const buttonY = GAME_HEIGHT / 2 + 60;
    
    // Check if click is within button bounds
    if (
      canvasX >= buttonX &&
      canvasX <= buttonX + buttonWidth &&
      canvasY >= buttonY &&
      canvasY <= buttonY + buttonHeight
    ) {
      window.location.reload();
    }
  }

  function resizeCanvas() {
    if (!canvas || !container) return;
    
    const availableHeight = window.innerHeight - 300;
    const availableWidth = container.clientWidth;
    
    const targetRatio = 2/3;
    const currentRatio = availableWidth / availableHeight;
    
    let width, height;
    if (currentRatio > targetRatio) {
      height = Math.min(availableHeight, 600);
      width = height * targetRatio;
    } else {
      width = Math.min(availableWidth, 400); 
      height = width / targetRatio;
    }
    
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
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
    on:click={handleCanvasClick}
  />
</div>