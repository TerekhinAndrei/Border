/**
 * SoundManager — Программный синтезатор звуков и музыки (Web Audio API).
 * Реализует индустриальную эстетику (GDD §6).
 */
export class SoundManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.masterGain = null;
    this.musicGains = { L: null, M: null, H: null };
    this.enabled = true;
    this.isStarted = false;
    this.isStopping = false;
    
    // Состояние музыки
    this.layers = [];
    this.intensity = 0.5; // 0..1 (0 - проигрыш, 1 - победа)
  }

  /** Инициализация при первом взаимодействии (Safari/Chrome requirement) */
  init() {
    if (this.isStopping) return; // Wait for stop to finish
    if (this.isStarted) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.isStarted = true;
    this._setupMusic();
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.1);
    }
  }

  /** ── SFX Synthesizers ────────────────────────────────────────── */

  /** Тихий щелчок UI */
  playClick() {
    if (!this.isStarted || !this.enabled) return;
    const { ctx, masterGain } = this;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.connect(g);
    g.connect(masterGain);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  /** Удар + Взрыв (Атака) */
  playAtk() {
    if (!this.isStarted || !this.enabled) return;
    const { ctx, masterGain } = this;
    const now = ctx.currentTime;

    // 1. Удар (Sine drop)
    const body = ctx.createOscillator();
    const gBody = ctx.createGain();
    body.frequency.setValueAtTime(150, now);
    body.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    gBody.gain.setValueAtTime(0.3, now);
    gBody.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    body.connect(gBody);
    gBody.connect(masterGain);
    body.start(now);
    body.stop(now + 0.2);

    // 2. Взрыв (White Noise)
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gNoise = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.25);

    gNoise.gain.setValueAtTime(0.15, now);
    gNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    noise.connect(filter);
    filter.connect(gNoise);
    gNoise.connect(masterGain);
    noise.start(now);
  }

  /** Тихий "тик" роста */
  playGrowth() {
    if (!this.isStarted || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(1200, now);
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Сигнал тревоги (Pulse) */
  playAlarm() {
    if (!this.isStarted || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.1);
    osc.frequency.linearRampToValueAtTime(440, now + 0.2);
    g.gain.setValueAtTime(0.08, now);
    g.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Отсчет (Beep) */
  playBeep(isFinal = false) {
    if (!this.isStarted || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Финальный звук (chord) */
  playEnd(isWin) {
    if (!this.isStarted || !this.enabled) return;
    const now = this.ctx.currentTime;
    const freqs = isWin ? [261.63, 329.63, 392.00, 523.25] : [130.81, 155.56, 196.00, 261.63]; // C-maj vs C-min
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.setValueAtTime(f, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.1, now + 0.1 + i*0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3);
    });
  }

  /** ── Dynamic Music System ────────────────────────────────────── */

  _setupMusic() {
    // Слои музыки — это бесконечные синтезируемые дроны
    this.musicGains.L = this.ctx.createGain();
    this.musicGains.M = this.ctx.createGain();
    this.musicGains.H = this.ctx.createGain();
    
    this.musicGains.L.connect(this.masterGain);
    this.musicGains.M.connect(this.masterGain);
    this.musicGains.H.connect(this.masterGain);

    this._createLayer('lowtooth', 55, this.musicGains.L, 0.15);    // Базовый гул
    this._createLayer('sine', 110, this.musicGains.M, 0.1);       // Пульсация
    this._createLayer('sawtooth', 220, this.musicGains.H, 0.05);  // Тревожные гармоники
    
    // Начальное затухание
    this.musicGains.L.gain.value = 0;
    this.musicGains.M.gain.value = 0;
    this.musicGains.H.gain.value = 0;
  }

  _createLayer(type, freq, targetGain, vol) {
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    
    osc.type = type === 'lowtooth' ? 'sawtooth' : type;
    osc.frequency.value = freq;
    
    // Небольшая расстройка для "жирноты"
    lfo.frequency.value = 0.2;
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq * 4;
    
    osc.connect(filter);
    filter.connect(targetGain);
    
    osc.start();
    lfo.start();
  }

  /** Обновление музыки на основе состояния игры */
  updateMusic(territoryPercent, isOver) {
    if (!this.isStarted) return;
    const now = this.ctx.currentTime;
    const speed = 1.5; // Время перехода
    
    if (isOver) {
      this.musicGains.L.gain.setTargetAtTime(0, now, speed);
      this.musicGains.M.gain.setTargetAtTime(0, now, speed);
      this.musicGains.H.gain.setTargetAtTime(0, now, speed);
      return;
    }

    // L всегда играет (база)
    this.musicGains.L.gain.setTargetAtTime(0.2, now, speed);
    
    // M включается при интенсивном бое или потере территорий
    const midVol = (territoryPercent < 0.6) ? 0.15 : 0.05;
    this.musicGains.M.gain.setTargetAtTime(midVol, now, speed);
    
    // H включается только при критической опасности (territory < 25%)
    const highVol = (territoryPercent < 0.25) ? 0.08 : 0;
    this.musicGains.H.gain.setTargetAtTime(highVol, now, speed);
  }

  /** Полная остановка всей музыки и звуков */
  stopAll() {
    if (this.ctx && !this.isStopping) {
      this.isStopping = true;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      }
      setTimeout(() => {
        if (this.ctx && this.ctx.state !== 'closed') {
          this.ctx.close();
        }
        this.ctx = null;
        this.isStarted = false;
        this.isStopping = false;
      }, 300);
    }
  }
}
