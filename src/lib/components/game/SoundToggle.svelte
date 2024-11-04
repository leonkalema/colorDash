<script>
    import { fly } from 'svelte/transition';
    import { writable } from 'svelte/store';
    import { audioManager } from '$lib/utils/audio';
  
    const isSoundEnabled = writable(true);
  
    function toggleSound() {
      $isSoundEnabled = !$isSoundEnabled;
      if (!$isSoundEnabled) {
        audioManager.suspend();
      } else {
        audioManager.resume();
      }
    }
  </script>
  
  <button 
    class="sound-toggle"
    on:click={toggleSound}
    title={$isSoundEnabled ? "Mute Sound" : "Unmute Sound"}
    in:fly={{ x: 20, duration: 700, delay: 700 }}>
    {$isSoundEnabled ? '🔊' : '🔇'}
  </button>
  
  <style>
    .sound-toggle {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.3s ease;
    }
  
    .sound-toggle:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  </style>