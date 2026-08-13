/* ==========================================================================
   WhiteSpace — Focus Music Engine (Synth Leak Fix & Improved Channel Names)
   ========================================================================== */

export class MusicEngine {
  constructor(audioContext) {
    this.ctx = audioContext || null;
    this.isPlaying = false;
    this.currentChannelIndex = 0;
    this.currentTrackIndex = 0;
    this.volume = 0.5;

    // Track playlists fetched from Audius API per channel
    this.channelTracks = {};
    
    // Audio stream element
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.volume = this.volume;

    // Auto advance to next song when current song ends
    this.audioElement.addEventListener('ended', () => {
      this.nextSong();
    });

    // Procedural Lo-Fi Synth state
    this.synthGain = null;
    this.synthInterval = null;
    this.isSynthActive = false;

    // Cleaned & Improved Focus Music Channels
    this.channels = [
      {
        id: 'procedural-lofi',
        name: 'Lo-Fi Chill Synthesizer',
        sub: 'Warm Ambient Chords (Offline)',
        icon: '🎹',
        type: 'synth'
      },
      {
        id: 'lofi-beats',
        name: 'Lo-Fi Focus Radio',
        sub: '24/7 Chill Hop & Beats',
        icon: '🎧',
        type: 'audius',
        query: 'lofi beats'
      },
      {
        id: 'japanese-lofi',
        name: 'Japanese Garden Lo-Fi',
        sub: 'Koto, Bamboo & Chill Beats',
        icon: '🍵',
        type: 'audius',
        query: 'japanese lofi'
      },
      {
        id: 'jazzhop-cafe',
        name: 'Coffee Shop Jazz Hop',
        sub: 'Acoustic Guitar & Vintage Vinyl',
        icon: '☕',
        type: 'audius',
        query: 'jazzhop'
      },
      {
        id: 'rainy-lofi',
        name: 'Rainy Day Lo-Fi',
        sub: 'Soft Rain & Mellow Beats',
        icon: '☔',
        type: 'audius',
        query: 'rain lofi'
      },
      {
        id: 'piano-focus',
        name: 'Minimalist Piano',
        sub: 'Gentle Solo Piano & Focus',
        icon: '🎼',
        type: 'audius',
        query: 'piano focus'
      },
      {
        id: 'synthwave-chill',
        name: 'Midnight Cyberpunk',
        sub: 'Neon Synthwave & Retrowave',
        icon: '🌆',
        type: 'audius',
        query: 'synthwave chill'
      },
      {
        id: 'space-ambient',
        name: 'Deep Space Ambient',
        sub: 'Cosmic Drones & Floating Pads',
        icon: '🌌',
        type: 'audius',
        query: 'space ambient'
      }
    ];

    // Preload default channel tracks
    this.preloadChannel(1);
  }

  setContext(ctx) {
    this.ctx = ctx;
  }

  getCurrentChannel() {
    return this.channels[this.currentChannelIndex];
  }

  getCurrentTrackInfo() {
    const channel = this.getCurrentChannel();
    if (channel.type === 'synth') {
      return {
        title: channel.name,
        artist: channel.sub,
        icon: channel.icon
      };
    }

    const playlist = this.channelTracks[channel.id] || [];
    const track = playlist[this.currentTrackIndex];
    if (track) {
      return {
        title: track.title,
        artist: track.user ? track.user.name : channel.sub,
        icon: channel.icon
      };
    }

    return {
      title: channel.name,
      artist: channel.sub,
      icon: channel.icon
    };
  }

  async fetchAudiusTracks(query) {
    try {
      const res = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=WhiteSpace`);
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        return data.data.filter(t => t.id);
      }
    } catch (e) {
      console.warn("Audius API fetch error:", e);
    }
    return [];
  }

  async preloadChannel(index) {
    const channel = this.channels[index];
    if (channel && channel.type === 'audius' && !this.channelTracks[channel.id]) {
      const tracks = await this.fetchAudiusTracks(channel.query);
      this.channelTracks[channel.id] = tracks;
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.audioElement.volume = this.volume;
    if (this.synthGain && this.ctx) {
      this.synthGain.gain.setTargetAtTime(this.volume * 0.4, this.ctx.currentTime, 0.05);
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  async play() {
    const channel = this.getCurrentChannel();
    this.isPlaying = true;

    // ALWAYS stop synth completely when playing any channel
    this.stopSynth();

    if (channel.type === 'audius') {
      let playlist = this.channelTracks[channel.id];
      if (!playlist || playlist.length === 0) {
        playlist = await this.fetchAudiusTracks(channel.query);
        this.channelTracks[channel.id] = playlist;
      }

      if (playlist && playlist.length > 0) {
        const track = playlist[this.currentTrackIndex % playlist.length];
        const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=WhiteSpace`;
        this.audioElement.src = streamUrl;
        this.audioElement.play().catch(err => {
          console.warn("Stream playback error:", err);
        });
      }
    } else if (channel.type === 'synth') {
      this.audioElement.pause();
      this.startSynth();
    }
  }

  pause() {
    this.isPlaying = false;
    this.audioElement.pause();
    this.stopSynth();
  }

  nextSong() {
    const channel = this.getCurrentChannel();
    if (channel.type === 'audius') {
      const playlist = this.channelTracks[channel.id] || [];
      if (playlist.length > 0) {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % playlist.length;
      }
    } else {
      this.currentChannelIndex = (this.currentChannelIndex + 1) % this.channels.length;
    }

    if (this.isPlaying) {
      this.play();
    }
    return this.getCurrentTrackInfo();
  }

  prevSong() {
    const channel = this.getCurrentChannel();
    if (channel.type === 'audius') {
      const playlist = this.channelTracks[channel.id] || [];
      if (playlist.length > 0) {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + playlist.length) % playlist.length;
      }
    } else {
      this.currentChannelIndex = (this.currentChannelIndex - 1 + this.channels.length) % this.channels.length;
    }

    if (this.isPlaying) {
      this.play();
    }
    return this.getCurrentTrackInfo();
  }

  async selectChannel(index) {
    if (index >= 0 && index < this.channels.length) {
      const wasPlaying = this.isPlaying;
      this.pause();
      this.currentChannelIndex = index;
      this.currentTrackIndex = 0;
      await this.preloadChannel(index);
      if (wasPlaying) {
        this.play();
      }
      return this.getCurrentTrackInfo();
    }
  }

  // --- Procedural Warm Lo-Fi Chord Synthesizer ---
  startSynth() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopSynth();
    this.isSynthActive = true;

    this.synthGain = this.ctx.createGain();
    this.synthGain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.synthGain.connect(filter);
    filter.connect(this.ctx.destination);

    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [196.00, 246.94, 293.66, 349.23]  // G7
    ];

    let chordIdx = 0;
    const playChordStep = () => {
      if (!this.isSynthActive || !this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.08 + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

        osc.connect(noteGain);
        noteGain.connect(this.synthGain);

        osc.start(now + i * 0.08);
        osc.stop(now + 3.5);
      });
    };

    playChordStep();
    this.synthInterval = setInterval(playChordStep, 3600);
  }

  stopSynth() {
    this.isSynthActive = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthGain) {
      try {
        this.synthGain.gain.setValueAtTime(0, this.ctx ? this.ctx.currentTime : 0);
        this.synthGain.disconnect();
      } catch (e) {}
      this.synthGain = null;
    }
  }
}
