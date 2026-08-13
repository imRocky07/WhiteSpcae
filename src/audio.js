/* ==========================================================================
   WhiteSpace — Local MP3 Audio Engine
   ========================================================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;

    // Local high-definition MP3 files provided by the user
    this.sounds = {
      rain: {
        active: false,
        volume: 0.5,
        audioEl: null,
        gainNode: null,
        url: '/sounds/rain.mp3'
      },
      brown: {
        active: false,
        volume: 0.4,
        audioEl: null,
        gainNode: null,
        url: '/sounds/ocean.mp3'
      },
      binaural: { // Forest Nature
        active: false,
        volume: 0.4,
        audioEl: null,
        gainNode: null,
        url: '/sounds/foest.mp3' // Matches foest.mp3 / forest.mp3
      },
      white: { // Cozy Cafe
        active: false,
        volume: 0.3,
        audioEl: null,
        gainNode: null,
        url: '/sounds/cafe.mp3'
      }
    };
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound(soundId) {
    this.initContext();
    const sound = this.sounds[soundId];
    if (!sound) return false;

    if (sound.active) {
      this.stopSound(soundId);
    } else {
      this.playSound(soundId);
    }

    return sound.active;
  }

  playSound(soundId) {
    const sound = this.sounds[soundId];
    if (!sound) return;

    sound.active = true;

    if (!sound.audioEl) {
      sound.audioEl = new Audio();
      sound.audioEl.loop = true;
      sound.audioEl.src = sound.url;

      try {
        const source = this.ctx.createMediaElementSource(sound.audioEl);
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(sound.volume, this.ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        sound.gainNode = gainNode;
      } catch (e) {
        sound.audioEl.volume = sound.volume;
      }
    }

    if (sound.gainNode) {
      sound.gainNode.gain.setTargetAtTime(sound.volume, this.ctx.currentTime, 0.05);
    } else {
      sound.audioEl.volume = sound.volume;
    }

    sound.audioEl.play().catch(err => {
      console.warn(`Error playing local sound ${soundId}:`, err);
    });
  }

  stopSound(soundId) {
    const sound = this.sounds[soundId];
    if (!sound) return;

    sound.active = false;
    if (sound.audioEl) {
      sound.audioEl.pause();
    }
    if (sound.gainNode) {
      sound.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  setVolume(soundId, volume) {
    const sound = this.sounds[soundId];
    if (!sound) return;

    sound.volume = Math.max(0, Math.min(1, volume));
    if (sound.active) {
      if (sound.gainNode && this.ctx) {
        sound.gainNode.gain.setTargetAtTime(sound.volume, this.ctx.currentTime, 0.05);
      } else if (sound.audioEl) {
        sound.audioEl.volume = sound.volume;
      }
    }
  }

  setMasterMute(muteState) {
    this.initContext();
    this.isMuted = muteState;
    if (this.masterGain) {
      const targetGain = this.isMuted ? 0 : 1.0;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- Gentle Session End Chime ---
  playChime() {
    this.initContext();
    if (this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc2.frequency.setValueAtTime(659.25, now);

    chimeGain.gain.setValueAtTime(0.01, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc1.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.5);
    osc2.stop(now + 2.5);
  }
}

export const audioEngine = new AudioEngine();
