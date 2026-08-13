/* ==========================================================================
   WhiteSpace — Theme-Aware Dynamic Canvas Visualizer
   - Clean Dark: Shimmering Ocean Waves
   - Midnight Aurora: Silky Smooth Polar Aurora Australis (Top Sky Light Curtains)
   - Emerald Zen: Drifting Zen Leaves
   ========================================================================== */

export class AmbientVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.width = 0;
    this.height = 0;
    this.step = 0;
    this.animId = null;
    this.isTimerRunning = false;
    this.hasActiveAudio = false;

    // Initialize Leaf Particles for Emerald Zen theme
    this.initLeaves();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.initLeaves();
  }

  setTimerState(isRunning) {
    this.isTimerRunning = isRunning;
  }

  setAudioState(hasAudio) {
    this.hasActiveAudio = hasAudio;
  }

  // --- Zen Leaf Particles Initialization ---
  initLeaves() {
    const leafCount = 32;
    this.leaves = [];
    for (let i = 0; i < leafCount; i++) {
      this.leaves.push({
        x: Math.random() * (this.width || 1200),
        y: Math.random() * (this.height || 800),
        size: 10 + Math.random() * 14,
        speedY: 0.4 + Math.random() * 0.8,
        speedX: -0.3 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (-0.02 + Math.random() * 0.04),
        opacity: 0.35 + Math.random() * 0.5,
        swingOffset: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? 'rgba(16, 185, 129, ' : 'rgba(5, 150, 105, '
      });
    }
  }

  // --- Draw Single Zen Leaf ---
  drawLeaf(leaf) {
    this.ctx.save();
    this.ctx.translate(leaf.x, leaf.y);
    this.ctx.rotate(leaf.rotation);
    this.ctx.fillStyle = `${leaf.color}${leaf.opacity})`;

    const s = leaf.size;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -s);
    this.ctx.bezierCurveTo(s * 0.6, -s * 0.4, s * 0.6, s * 0.4, 0, s);
    this.ctx.bezierCurveTo(-s * 0.6, s * 0.4, -s * 0.6, -s * 0.4, 0, -s);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -s * 0.8);
    this.ctx.lineTo(0, s * 0.8);
    this.ctx.stroke();

    this.ctx.restore();
  }

  // --- Render Drifting Zen Leaves (Emerald Zen Theme) ---
  renderLeaves(ampMultiplier, speedMultiplier) {
    this.leaves.forEach(leaf => {
      leaf.y += leaf.speedY * speedMultiplier;
      leaf.x += leaf.speedX + Math.sin(this.step * 0.8 + leaf.swingOffset) * 0.6;
      leaf.rotation += leaf.rotSpeed * speedMultiplier;

      if (leaf.y > this.height + 20) {
        leaf.y = -20;
        leaf.x = Math.random() * this.width;
      }
      if (leaf.x < -20) leaf.x = this.width + 20;
      if (leaf.x > this.width + 20) leaf.x = -20;

      this.drawLeaf(leaf);
    });
  }

  // --- Render Silky Smooth Polar Aurora Curtains (Midnight Aurora Theme) ---
  renderRealisticAurora(ampMultiplier, speedMultiplier) {
    const isZen = document.body.classList.contains('zen-mode');
    this.ctx.save();

    // Use screen blending for soft atmospheric glow without harsh lines
    this.ctx.globalCompositeOperation = 'screen';

    // 3 Soft, silky continuous curtains floating gracefully at top of screen
    const curtains = [
      {
        yBase: this.height * 0.08,
        amplitude: 35 * ampMultiplier,
        freq: 0.002,
        speed: 0.6 * speedMultiplier,
        colors: ['rgba(6, 182, 212, ', 'rgba(16, 185, 129, '] // Cyan -> Emerald
      },
      {
        yBase: this.height * 0.12,
        amplitude: 45 * ampMultiplier,
        freq: 0.0016,
        speed: 0.45 * speedMultiplier,
        colors: ['rgba(16, 185, 129, ', 'rgba(234, 179, 8, '] // Emerald -> Gold
      },
      {
        yBase: this.height * 0.16,
        amplitude: 40 * ampMultiplier,
        freq: 0.0024,
        speed: 0.7 * speedMultiplier,
        colors: ['rgba(236, 72, 153, ', 'rgba(168, 85, 247, '] // Magenta -> Violet
      }
    ];

    const opacityTop = isZen ? 0.28 : 0.2;
    const maxReachY = this.height * 0.32; // Fades out completely before reaching timer!

    curtains.forEach((c, idx) => {
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);

      // Draw continuous smooth top curve across screen
      for (let x = 0; x <= this.width; x += 6) {
        const wave1 = Math.sin(x * c.freq + this.step * c.speed + idx * 1.2);
        const wave2 = Math.cos(x * c.freq * 1.8 - this.step * c.speed * 0.8);
        const y = c.yBase + (wave1 + wave2) * c.amplitude;
        this.ctx.lineTo(x, Math.max(0, y));
      }

      this.ctx.lineTo(this.width, 0);
      this.ctx.closePath();

      // Soft vertical gradient from top edge down to maxReachY
      const grad = this.ctx.createLinearGradient(0, 0, 0, maxReachY);
      grad.addColorStop(0, `${c.colors[0]}${opacityTop})`);
      grad.addColorStop(0.5, `${c.colors[1]}${opacityTop * 0.6})`);
      grad.addColorStop(1, 'rgba(6, 9, 25, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  // --- Render Flowing Ocean Waves (Clean Dark Theme) ---
  drawWave(yOffset, frequency, amplitude, speed, color) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, yOffset);

    for (let x = 0; x <= this.width; x += 4) {
      const angle = (x * frequency) + (this.step * speed);
      const y = yOffset + Math.sin(angle) * amplitude;
      this.ctx.lineTo(x, y);
    }

    this.ctx.lineTo(this.width, this.height);
    this.ctx.lineTo(0, this.height);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  renderWaves(ampMultiplier, speedMultiplier) {
    const grad1 = this.ctx.createLinearGradient(0, this.height * 0.7, 0, this.height);
    grad1.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
    grad1.addColorStop(1, 'rgba(139, 92, 246, 0.18)');
    this.drawWave(
      this.height * 0.74,
      0.0025,
      32 * ampMultiplier,
      0.9 * speedMultiplier,
      grad1
    );

    const grad2 = this.ctx.createLinearGradient(0, this.height * 0.8, 0, this.height);
    grad2.addColorStop(0, 'rgba(139, 92, 246, 0.12)');
    grad2.addColorStop(1, 'rgba(99, 102, 241, 0.25)');
    this.drawWave(
      this.height * 0.82,
      0.004,
      22 * ampMultiplier,
      1.3 * speedMultiplier,
      grad2
    );
  }

  // --- Main Animation Loop ---
  start() {
    const render = () => {
      this.step += 0.008;
      this.ctx.clearRect(0, 0, this.width, this.height);

      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      const isZen = document.body.classList.contains('zen-mode');
      const speedMultiplier = this.isTimerRunning ? 1.3 : 0.8;
      const ampMultiplier = (this.hasActiveAudio ? 1.4 : 1.0) * (isZen ? 1.5 : 1.0);

      if (theme === 'forest') {
        // Emerald Zen Theme -> Drifting Zen Leaves
        this.renderLeaves(ampMultiplier, speedMultiplier);
      } else if (theme === 'aurora') {
        // Midnight Aurora Theme -> Silky Smooth Polar Aurora Curtains
        this.renderRealisticAurora(ampMultiplier, speedMultiplier);
      } else {
        // Clean Dark & Minimal Light Themes -> Flowing Ocean Waves
        this.renderWaves(ampMultiplier, speedMultiplier);
      }

      this.animId = requestAnimationFrame(render);
    };

    render();
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
