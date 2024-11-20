<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    
    let originalOverflow: string;
    let originalPosition: string;
  
    onMount(() => {
      if (browser) {
        originalOverflow = document.body.style.overflow;
        originalPosition = document.body.style.position;
      }
    });
    
    onDestroy(() => {
      if (browser) {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      }
    });
  </script>
  
  <slot />
  
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