<script lang="ts">
    export let onMove: (direction: 'left' | 'right' | 'down') => void;
    export let onRotate: () => void;
    
    let touchStartX = 0;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 30;
  
    function handleTouchStart(event: TouchEvent) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }
  
    function handleTouchMove(event: TouchEvent) {
      event.preventDefault();
    }
  
    function handleButtonTouch(action: 'left' | 'right' | 'down' | 'rotate') {
      return (event: TouchEvent) => {
        event.preventDefault();
        if (action === 'rotate') {
          onRotate();
        } else {
          onMove(action);
        }
      }
    }
  </script>
  
  <div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-sm">
    <div class="max-w-lg mx-auto flex justify-between items-center gap-4">
      <!-- D-Pad -->
      <div class="grid grid-cols-3 gap-2">
        <div></div>
        <button
          class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center active:bg-gray-600 touch-none"
          on:touchstart={handleButtonTouch('rotate')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.9 3.2L21 8v5h-5l2.4-2.4A7 7 0 1 0 20 12"/>
          </svg>
        </button>
        <div></div>
        <button
          class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center active:bg-gray-600 touch-none"
          on:touchstart={handleButtonTouch('left')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button
          class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center active:bg-gray-600 touch-none"
          on:touchstart={handleButtonTouch('down')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        <button
          class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center active:bg-gray-600 touch-none"
          on:touchstart={handleButtonTouch('right')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  
  <style>
    /* Prevent double-tap zoom on iOS */
    button {
      touch-action: manipulation;
    }
    
    /* Prevent scroll when touching buttons */
    .touch-none {
      touch-action: none;
    }
  </style>