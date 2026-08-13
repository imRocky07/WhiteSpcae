/* ==========================================================================
   WhiteSpace — Timer Engine
   ========================================================================== */

export class TimerEngine {
  constructor(options = {}) {
    this.durations = {
      pomodoro: options.pomodoro || 25,
      shortBreak: options.shortBreak || 5,
      longBreak: options.longBreak || 15
    };

    this.currentMode = 'pomodoro';
    this.timeLeftSeconds = this.durations[this.currentMode] * 60;
    this.totalDurationSeconds = this.timeLeftSeconds;
    
    this.isRunning = false;
    this.timerId = null;

    // Reset stats to 0 on explicit request and load
    this.stats = this.resetStats();

    // Callbacks
    this.onTick = options.onTick || null;
    this.onFinish = options.onFinish || null;
    this.onModeChange = options.onModeChange || null;
  }

  resetStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const newStats = {
      lastDate: todayStr,
      sessionsToday: 0,
      minutesToday: 0,
      streak: 1
    };
    localStorage.setItem('whitespace_stats', JSON.stringify(newStats));
    return newStats;
  }

  saveStats() {
    localStorage.setItem('whitespace_stats', JSON.stringify(this.stats));
  }

  setMode(mode) {
    if (!this.durations[mode]) return;
    this.pause();
    this.currentMode = mode;
    this.totalDurationSeconds = this.durations[mode] * 60;
    this.timeLeftSeconds = this.totalDurationSeconds;

    if (this.onModeChange) this.onModeChange(this.currentMode, this.timeLeftSeconds);
    if (this.onTick) this.onTick(this.timeLeftSeconds, this.getProgress());
    this.updateBrowserTitle();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);

    if (this.onTick) this.onTick(this.timeLeftSeconds, this.getProgress());
    this.updateBrowserTitle();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.updateBrowserTitle();
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  reset() {
    this.pause();
    this.timeLeftSeconds = this.totalDurationSeconds;
    if (this.onTick) this.onTick(this.timeLeftSeconds, this.getProgress());
    this.updateBrowserTitle();
  }

  skip() {
    // Skip mode without counting Pomodoro or adding focus minutes
    this.pause();
    const nextMode = (this.currentMode === 'pomodoro') ? 'shortBreak' : 'pomodoro';
    this.setMode(nextMode);
  }

  tick() {
    if (this.timeLeftSeconds > 0) {
      this.timeLeftSeconds--;
      if (this.onTick) this.onTick(this.timeLeftSeconds, this.getProgress());
      this.updateBrowserTitle();
    } else {
      // FULL COMPLETION REACHED (00:00)
      this.pause();
      this.handleFullCompletion();
    }
  }

  handleFullCompletion() {
    // Only count pomodoro and add focus minutes when timer reaches 00:00 naturally!
    if (this.currentMode === 'pomodoro') {
      const minutesFocused = this.durations.pomodoro;
      this.stats.sessionsToday += 1;
      this.stats.minutesToday += minutesFocused;
      this.saveStats();
    }

    if (this.onFinish) {
      this.onFinish(this.currentMode);
    }
  }

  getProgress() {
    if (this.totalDurationSeconds === 0) return 0;
    return (this.totalDurationSeconds - this.timeLeftSeconds) / this.totalDurationSeconds;
  }

  getFormattedTime() {
    const mins = Math.floor(this.timeLeftSeconds / 60);
    const secs = this.timeLeftSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateBrowserTitle() {
    const formatted = this.getFormattedTime();
    const modeLabel = this.currentMode === 'pomodoro' ? 'Focus' : 'Break';
    const status = this.isRunning ? '▶' : '⏸';
    document.title = `${status} ${formatted} - ${modeLabel} | WhiteSpace`;
  }

  updateDurations(newDurations) {
    this.durations = { ...this.durations, ...newDurations };
    this.setMode(this.currentMode);
  }
}
