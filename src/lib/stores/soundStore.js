import { writable } from 'svelte/store';
import { audioManager } from '$lib/utils/audio';

function createSoundStore() {
  const { subscribe, set, update } = writable({
    isEnabled: true,
    volume: 1.0,
    lastVolume: 1.0 // Store last volume when muting
  });

  return {
    subscribe,
    toggleSound: () => update(state => {
      const newState = { ...state, isEnabled: !state.isEnabled };
      if (newState.isEnabled) {
        audioManager.resume();
        audioManager.setVolume(state.lastVolume);
      } else {
        audioManager.suspend();
      }
      return newState;
    }),
    setVolume: (volume) => update(state => {
      const newVolume = Math.max(0, Math.min(1, volume));
      audioManager.setVolume(newVolume);
      return {
        ...state,
        volume: newVolume,
        lastVolume: newVolume
      };
    }),
    mute: () => update(state => {
      audioManager.suspend();
      return {
        ...state,
        isEnabled: false,
        lastVolume: state.volume,
        volume: 0
      };
    }),
    unmute: () => update(state => {
      audioManager.resume();
      audioManager.setVolume(state.lastVolume);
      return {
        ...state,
        isEnabled: true,
        volume: state.lastVolume
      };
    })
  };
}

export const soundStore = createSoundStore();