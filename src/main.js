/* ==========================================================================
   WhiteSpace — Main Application Controller
   ========================================================================== */

import { TimerEngine } from './timer.js';
import { TaskManager } from './tasks.js';
import { audioEngine } from './audio.js';
import { MusicEngine } from './music.js';
import { AmbientVisualizer } from './visualizer.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Settings state
  const settings = loadSettings();

  // 2. Initialize Visualizer & Engines
  const visualizer = new AmbientVisualizer('bg-visualizer');
  const musicEngine = new MusicEngine();

  // 3. Initialize Task Manager
  const taskManager = new TaskManager({
    onTasksChange: (tasks) => renderTaskList(tasks),
    onActiveTaskChange: (activeTask) => updateActiveTaskPill(activeTask)
  });

  // 4. Initialize Timer Engine
  const timer = new TimerEngine({
    pomodoro: settings.pomodoro,
    shortBreak: settings.shortBreak,
    longBreak: settings.longBreak,
    onTick: (timeLeftSeconds, progress) => {
      updateTimerUI(timeLeftSeconds, progress);
    },
    onFinish: (completedMode) => {
      handleSessionFinish(completedMode);
    },
    onModeChange: (newMode) => {
      updateModeTabsUI(newMode);
    }
  });

  // 5. DOM References
  const elements = {
    timeDisplay: document.getElementById('time-display'),
    ringProgress: document.getElementById('ring-progress'),
    btnToggleTimer: document.getElementById('btn-toggle-timer'),
    btnPlayLabel: document.getElementById('btn-play-label'),
    iconPlay: document.querySelector('.icon-play'),
    iconPause: document.querySelector('.icon-pause'),
    btnReset: document.getElementById('btn-reset'),
    btnSkip: document.getElementById('btn-skip'),
    timerStateLabel: document.getElementById('timer-state-label'),
    
    // Stats
    statSessions: document.getElementById('stat-sessions'),
    statMinutes: document.getElementById('stat-minutes'),
    statStreak: document.getElementById('stat-streak'),
    
    // Mode tabs
    modeTabs: document.querySelectorAll('.mode-tab'),
    badgePomodoro: document.getElementById('badge-pomodoro'),
    badgeShortBreak: document.getElementById('badge-shortBreak'),
    badgeLongBreak: document.getElementById('badge-longBreak'),

    // Active Task Pill
    activeTaskPill: document.getElementById('active-task-pill'),
    activeTaskTitle: document.getElementById('active-task-title'),

    // Focus Music Player
    musicPlayerCard: document.querySelector('.music-player-card'),
    btnPlayMusic: document.getElementById('btn-play-music'),
    musicPlayLabel: document.getElementById('music-play-label'),
    musicPlayIcon: document.querySelector('.music-play-icon'),
    musicPauseIcon: document.querySelector('.music-pause-icon'),
    btnPrevMusic: document.getElementById('btn-prev-music'),
    btnNextMusic: document.getElementById('btn-next-music'),
    musicSelect: document.getElementById('music-channel-select'),
    musicSub: document.getElementById('music-channel-sub'),
    musicIcon: document.getElementById('music-icon'),
    musicVolSlider: document.getElementById('music-volume-slider'),

    // Zen Mode Mini Music Controller Widget
    zenMusicWidget: document.getElementById('zen-music-widget'),
    zenMusicIcon: document.getElementById('zen-music-icon'),
    zenMusicTitle: document.getElementById('zen-music-title'),
    btnZenPlayMusic: document.getElementById('btn-zen-play-music'),
    btnZenPrevMusic: document.getElementById('btn-zen-prev-music'),
    btnZenNextMusic: document.getElementById('btn-zen-next-music'),
    zenIconPlay: document.querySelector('.zen-icon-play'),
    zenIconPause: document.querySelector('.zen-icon-pause'),

    // Soundscape
    soundCards: document.querySelectorAll('.sound-card'),
    soundToggleBtns: document.querySelectorAll('.sound-toggle-btn'),
    volumeSliders: document.querySelectorAll('.volume-slider'),
    btnMasterMute: document.getElementById('btn-master-mute'),
    iconUnmuted: document.querySelector('.icon-unmuted'),
    iconMuted: document.querySelector('.icon-muted'),
    masterMuteLabel: document.getElementById('master-mute-label'),

    // Tasks
    addTaskForm: document.getElementById('add-task-form'),
    taskInput: document.getElementById('task-input'),
    taskEstInput: document.getElementById('task-est-input'),
    taskList: document.getElementById('task-list'),
    tasksRemainingBadge: document.getElementById('tasks-remaining-badge'),

    // Theme & Zen Mode
    themeBtns: document.querySelectorAll('.theme-btn'),
    btnZen: document.getElementById('btn-zen'),
    btnExitZen: document.getElementById('btn-exit-zen'),
    
    // Settings Modal
    btnSettings: document.getElementById('btn-settings'),
    modalSettings: document.getElementById('modal-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    settingsForm: document.getElementById('settings-form'),
    settingPomo: document.getElementById('setting-pomo'),
    settingShort: document.getElementById('setting-short'),
    settingLong: document.getElementById('setting-long'),
    settingAutoBreak: document.getElementById('setting-auto-break'),
    settingAutoPomo: document.getElementById('setting-auto-pomo'),
    settingChime: document.getElementById('setting-chime')
  };

  // --- Initial Setup ---
  applySavedTheme();
  updateStatsDisplay();
  updateModeBadges();
  renderTaskList(taskManager.tasks);
  updateActiveTaskPill(taskManager.getActiveTask());
  updateTimerUI(timer.timeLeftSeconds, 0);
  updateMusicUI(musicEngine.isPlaying, musicEngine.getCurrentTrackInfo());

  // --- Timer Controls & UI Updates ---
  function updateTimerUI(timeLeftSeconds, progress) {
    const formatted = timer.getFormattedTime();
    elements.timeDisplay.textContent = formatted;

    const circumference = 911;
    const offset = circumference * (1 - progress);
    elements.ringProgress.style.strokeDashoffset = offset;
  }

  function updatePlayButtonState(isRunning) {
    if (isRunning) {
      elements.iconPlay.classList.add('hidden');
      elements.iconPause.classList.remove('hidden');
      elements.btnPlayLabel.textContent = 'Pause Focus';
      elements.timerStateLabel.textContent = timer.currentMode === 'pomodoro' ? 'Focusing...' : 'Resting...';
    } else {
      elements.iconPlay.classList.remove('hidden');
      elements.iconPause.classList.add('hidden');
      elements.btnPlayLabel.textContent = timer.currentMode === 'pomodoro' ? 'Start Focus' : 'Start Break';
      elements.timerStateLabel.textContent = 'Paused';
    }
    visualizer.setTimerState(isRunning);
  }

  function updateModeTabsUI(currentMode) {
    elements.modeTabs.forEach(tab => {
      if (tab.dataset.mode === currentMode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    updatePlayButtonState(timer.isRunning);
  }

  function updateStatsDisplay() {
    elements.statSessions.textContent = timer.stats.sessionsToday;
    elements.statMinutes.textContent = `${timer.stats.minutesToday}m`;
    elements.statStreak.textContent = `${timer.stats.streak} 🔥`;
  }

  function updateModeBadges() {
    elements.badgePomodoro.textContent = `${timer.durations.pomodoro}m`;
    elements.badgeShortBreak.textContent = `${timer.durations.shortBreak}m`;
    elements.badgeLongBreak.textContent = `${timer.durations.longBreak}m`;
  }

  function handleSessionFinish(completedMode) {
    updatePlayButtonState(false);
    updateStatsDisplay();

    if (settings.chime) {
      audioEngine.playChime();
    }

    if (completedMode === 'pomodoro') {
      taskManager.incrementActiveTaskPomo();
      renderTaskList(taskManager.tasks);

      const nextMode = (timer.stats.sessionsToday % 4 === 0) ? 'longBreak' : 'shortBreak';
      timer.setMode(nextMode);
      if (settings.autoBreak) {
        timer.start();
        updatePlayButtonState(true);
      }
    } else {
      timer.setMode('pomodoro');
      if (settings.autoPomo) {
        timer.start();
        updatePlayButtonState(true);
      }
    }
  }

  // Timer Buttons Click Handlers
  elements.btnToggleTimer.addEventListener('click', () => {
    audioEngine.initContext();
    musicEngine.setContext(audioEngine.ctx);
    const isRunning = timer.toggle();
    updatePlayButtonState(isRunning);
  });

  elements.btnReset.addEventListener('click', () => {
    timer.reset();
    updatePlayButtonState(false);
  });

  elements.btnSkip.addEventListener('click', () => {
    timer.skip();
  });

  elements.modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      timer.setMode(mode);
    });
  });

  // --- Focus Music Player Controls ---
  elements.btnPlayMusic.addEventListener('click', async () => {
    audioEngine.initContext();
    musicEngine.setContext(audioEngine.ctx);
    const isPlaying = musicEngine.togglePlay();
    updateMusicUI(isPlaying, musicEngine.getCurrentTrackInfo());
  });

  elements.btnPrevMusic.addEventListener('click', () => {
    audioEngine.initContext();
    musicEngine.setContext(audioEngine.ctx);
    const trackInfo = musicEngine.prevSong();
    updateMusicUI(musicEngine.isPlaying, trackInfo);
  });

  elements.btnNextMusic.addEventListener('click', () => {
    audioEngine.initContext();
    musicEngine.setContext(audioEngine.ctx);
    const trackInfo = musicEngine.nextSong();
    updateMusicUI(musicEngine.isPlaying, trackInfo);
  });

  elements.musicSelect.addEventListener('change', async (e) => {
    audioEngine.initContext();
    musicEngine.setContext(audioEngine.ctx);
    const idx = parseInt(e.target.value);
    const trackInfo = await musicEngine.selectChannel(idx);
    updateMusicUI(musicEngine.isPlaying, trackInfo);
  });

  elements.musicVolSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    musicEngine.setVolume(vol);
  });

  // Zen Mini Music Controller Event Delegation
  elements.btnZenPlayMusic.addEventListener('click', () => {
    elements.btnPlayMusic.click();
  });
  elements.btnZenPrevMusic.addEventListener('click', () => {
    elements.btnPrevMusic.click();
  });
  elements.btnZenNextMusic.addEventListener('click', () => {
    elements.btnNextMusic.click();
  });

  function updateMusicUI(isPlaying, trackInfo) {
    if (isPlaying) {
      elements.musicPlayerCard.classList.add('is-playing');
      elements.musicPlayIcon.classList.add('hidden');
      elements.musicPauseIcon.classList.remove('hidden');
      elements.musicPlayLabel.textContent = 'Pause Music';

      elements.zenIconPlay.classList.add('hidden');
      elements.zenIconPause.classList.remove('hidden');
    } else {
      elements.musicPlayerCard.classList.remove('is-playing');
      elements.musicPlayIcon.classList.remove('hidden');
      elements.musicPauseIcon.classList.add('hidden');
      elements.musicPlayLabel.textContent = 'Play Music';

      elements.zenIconPlay.classList.remove('hidden');
      elements.zenIconPause.classList.add('hidden');
    }

    if (trackInfo) {
      const displayTitle = trackInfo.title ? `${trackInfo.title}` : (trackInfo.artist || 'Focus Music');
      elements.musicSub.textContent = trackInfo.title ? `${trackInfo.title} • ${trackInfo.artist}` : trackInfo.artist;
      elements.musicIcon.textContent = trackInfo.icon || '🎧';

      elements.zenMusicTitle.textContent = displayTitle;
      elements.zenMusicIcon.textContent = trackInfo.icon || '🎧';
    }
  }

  // --- Soundscape Controls ---
  elements.soundToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const soundId = btn.dataset.sound;
      const soundCard = document.querySelector(`.sound-card[data-sound="${soundId}"]`);
      const isActive = audioEngine.toggleSound(soundId);
      
      if (isActive) {
        soundCard.classList.add('active');
      } else {
        soundCard.classList.remove('active');
      }

      checkActiveAudioState();
    });
  });

  elements.volumeSliders.forEach(slider => {
    if (slider.id === 'music-volume-slider') return;
    slider.addEventListener('input', () => {
      const soundId = slider.dataset.sound;
      const vol = parseFloat(slider.value);
      audioEngine.setVolume(soundId, vol);
    });
  });

  elements.btnMasterMute.addEventListener('click', () => {
    const isMuted = audioEngine.setMasterMute(!audioEngine.isMuted);
    if (isMuted) {
      elements.iconUnmuted.classList.add('hidden');
      elements.iconMuted.classList.remove('hidden');
      elements.masterMuteLabel.textContent = 'Unmute All';
    } else {
      elements.iconUnmuted.classList.remove('hidden');
      elements.iconMuted.classList.add('hidden');
      elements.masterMuteLabel.textContent = 'Mute All';
    }
  });

  function checkActiveAudioState() {
    const hasAudio = Object.values(audioEngine.sounds).some(s => s.active) || musicEngine.isPlaying;
    visualizer.setAudioState(hasAudio);
  }

  // --- Task Queue & Pill Updates ---
  function updateActiveTaskPill(activeTask) {
    if (activeTask) {
      elements.activeTaskTitle.textContent = activeTask.title;
    } else {
      elements.activeTaskTitle.textContent = 'Select a Task to Focus';
    }
  }

  function renderTaskList(tasks) {
    elements.taskList.innerHTML = '';
    const activeTasks = tasks.filter(t => !t.completed);
    elements.tasksRemainingBadge.textContent = `${activeTasks.length} left`;

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''} ${task.isActive ? 'is-active' : ''}`;
      
      li.innerHTML = `
        <div class="task-left">
          <div class="task-checkbox" data-action="toggle" data-id="${task.id}">
            ${task.completed ? '✓' : ''}
          </div>
          <span class="task-title" data-action="select" data-id="${task.id}">${task.title}</span>
        </div>
        <div class="task-right">
          <span class="task-pomo-counter">🍅 ${task.completedPomos}/${task.estPomos}</span>
          <button class="btn-task-action btn-task-select" data-action="select" data-id="${task.id}" title="Set Active">
            ${task.isActive ? '★' : '☆'}
          </button>
          <button class="btn-task-action" data-action="delete" data-id="${task.id}" title="Delete Task">
            ✕
          </button>
        </div>
      `;

      elements.taskList.appendChild(li);
    });
  }

  elements.taskList.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === 'toggle') {
      taskManager.toggleTaskCompletion(id);
    } else if (action === 'select') {
      taskManager.setActiveTask(id);
    } else if (action === 'delete') {
      taskManager.removeTask(id);
    }
  });

  elements.addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = elements.taskInput.value;
    const est = elements.taskEstInput.value;
    if (title) {
      taskManager.addTask(title, est);
      elements.taskInput.value = '';
    }
  });

  elements.activeTaskPill.addEventListener('click', () => {
    document.querySelector('.tasks-card').scrollIntoView({ behavior: 'smooth' });
  });

  // --- Themes & Zen Mode ---
  elements.themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      setTheme(theme);
    });
  });

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    elements.themeBtns.forEach(b => {
      if (b.dataset.theme === theme) b.classList.add('active');
      else b.classList.remove('active');
    });
    localStorage.setItem('whitespace_theme', theme);
  }

  function applySavedTheme() {
    const saved = localStorage.getItem('whitespace_theme') || 'dark';
    setTheme(saved);
  }

  // --- Zen Mode with Automatic Browser Fullscreen API ---
  elements.btnZen.addEventListener('click', () => toggleZenMode());
  if (elements.btnExitZen) {
    elements.btnExitZen.addEventListener('click', () => toggleZenMode(false));
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('zen-mode')) {
      toggleZenMode(false);
    }
  });

  function toggleZenMode(forceState) {
    let enteringZen = false;
    if (typeof forceState === 'boolean') {
      enteringZen = forceState;
    } else {
      enteringZen = !document.body.classList.contains('zen-mode');
    }

    if (enteringZen) {
      document.body.classList.add('zen-mode');
      if (elements.btnExitZen) elements.btnExitZen.classList.remove('hidden');

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.body.classList.remove('zen-mode');
      if (elements.btnExitZen) elements.btnExitZen.classList.add('hidden');

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // --- Settings Modal ---
  elements.btnSettings.addEventListener('click', () => {
    elements.settingPomo.value = timer.durations.pomodoro;
    elements.settingShort.value = timer.durations.shortBreak;
    elements.settingLong.value = timer.durations.longBreak;
    elements.settingAutoBreak.checked = settings.autoBreak;
    elements.settingAutoPomo.checked = settings.autoPomo;
    elements.settingChime.checked = settings.chime;

    elements.modalSettings.classList.remove('hidden');
  });

  elements.btnCloseSettings.addEventListener('click', () => {
    elements.modalSettings.classList.add('hidden');
  });

  elements.settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    settings.pomodoro = parseInt(elements.settingPomo.value) || 25;
    settings.shortBreak = parseInt(elements.settingShort.value) || 5;
    settings.longBreak = parseInt(elements.settingLong.value) || 15;
    settings.autoBreak = elements.settingAutoBreak.checked;
    settings.autoPomo = elements.settingAutoPomo.checked;
    settings.chime = settings.chime;

    saveSettings(settings);

    timer.updateDurations({
      pomodoro: settings.pomodoro,
      shortBreak: settings.shortBreak,
      longBreak: settings.longBreak
    });

    updateModeBadges();
    elements.modalSettings.classList.add('hidden');
  });

  function loadSettings() {
    const saved = localStorage.getItem('whitespace_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      pomodoro: 25,
      shortBreak: 5,
      longBreak: 15,
      autoBreak: false,
      autoPomo: false,
      chime: true
    };
  }

  function saveSettings(s) {
    localStorage.setItem('whitespace_settings', JSON.stringify(s));
  }

  // --- Keyboard Hotkeys ---
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.code === 'Escape') {
      toggleZenMode(false);
      elements.modalSettings.classList.add('hidden');
    } else if (e.code === 'Space') {
      e.preventDefault();
      audioEngine.initContext();
      musicEngine.setContext(audioEngine.ctx);
      const isRunning = timer.toggle();
      updatePlayButtonState(isRunning);
    } else if (e.code === 'KeyR') {
      timer.reset();
      updatePlayButtonState(false);
    } else if (e.code === 'KeyS') {
      timer.skip();
    } else if (e.code === 'KeyM') {
      elements.btnMasterMute.click();
    } else if (e.code === 'KeyF') {
      toggleZenMode();
    }
  });
});
