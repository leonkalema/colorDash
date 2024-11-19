<script lang="ts">
    export let score: number;
    export let onClose: () => void;
    
    const shareMessage = `🎮 I just scored ${score} in Byggfeber! Can you beat my high score? 🏆\n\nPlay now at ${window.location.href} 🎯`;
    
    const shareOptions = [
      {
        name: 'WhatsApp',
        icon: '💬',
        action: () => {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
        }
      },
      {
        name: 'Twitter',
        icon: '🐦',
        action: () => {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank');
        }
      },
      {
        name: 'Copy Link',
        icon: '📋',
        action: async () => {
          await navigator.clipboard.writeText(shareMessage);
          onClose();
        }
      }
    ];
  </script>
  
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
      <h3 class="text-xl font-bold text-white mb-4">Share Your Score</h3>
      
      <div class="space-y-3">
        {#each shareOptions as option}
          <button
            class="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            on:click={option.action}
          >
            <span class="text-2xl">{option.icon}</span>
            <span>{option.name}</span>
          </button>
        {/each}
      </div>
      
      <button
        class="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors"
        on:click={onClose}
      >
        Cancel
      </button>
    </div>
  </div>