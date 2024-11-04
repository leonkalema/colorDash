class AudioManager {
    constructor() {
      this.context = null;
      this.isInitialized = false;
      this.gainNode = null;
      this.volume = 1.0;
      this.sounds = {
        success: null,
        fail: null,
        gameOver: null,
        start: null,
        click: null
      };
    }
  
    async init() {
      if (this.isInitialized) return;
      
      try {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
        this.gainNode.gain.value = this.volume;
        
        await this.context.resume();
        this.createSounds();
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    }
  
    createSounds() {
      this.sounds.success = () => this.playTone(587.33, 0.3, 0.2); // D5
      this.sounds.fail = () => this.playFrequencySwoop(196.00, 146.83, 0.2, 0.2); // G3 to D3
      this.sounds.gameOver = () => this.playFrequencySwoop(440, 220, 0.5, 0.2); // A4 to A3
      this.sounds.start = () => this.playTone(523.25, 0.2, 0.2); // C5
      this.sounds.click = () => this.playTone(880, 0.05, 0.1); // A5
    }
  
    playTone(frequency, duration, volume = 0.2) {
      if (!this.isInitialized || !this.context) return;
  
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.gainNode);
      
      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * this.volume, this.context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(this.context.currentTime + duration);
    }
  
    playFrequencySwoop(startFreq, endFreq, duration, volume = 0.2) {
      if (!this.isInitialized || !this.context) return;
  
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.gainNode);
      
      oscillator.frequency.setValueAtTime(startFreq, this.context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.context.currentTime + duration);
      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * this.volume, this.context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(this.context.currentTime + duration);
    }
  
    playSound(soundName) {
      if (!this.isInitialized || !this.sounds[soundName]) return;
      
      try {
        if (this.context.state === 'suspended') {
          this.context.resume().then(() => {
            this.sounds[soundName]();
          });
        } else {
          this.sounds[soundName]();
        }
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  
    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
      if (this.gainNode) {
        this.gainNode.gain.value = this.volume;
      }
    }
  
    getVolume() {
      return this.volume;
    }
  
    suspend() {
      if (this.context) {
        this.context.suspend();
      }
    }
  
    resume() {
      if (this.context) {
        this.context.resume();
      }
    }
  
    cleanup() {
      if (this.context) {
        this.context.close();
        this.isInitialized = false;
      }
    }
  }
  
  export const audioManager = new AudioManager();