import { GameConfig, ModeRegistry } from '../config/GameConfig.js';
import {
  NamePairs,
  CasusTemplates,
  MicroStories,
  NewsLines,
  EndQuotes,
  CasualtyThresholds,
} from '../content/GameContent.js';
import { I18n } from '../i18n/I18n.js';
import { GameState } from './GameState.js';
import { GameRenderer } from '../rendering/GameRenderer.js';
import { MapGenerator } from '../systems/MapGenerator.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { BattleEffects } from '../systems/BattleEffects.js';
import { AiController } from '../ai/AiController.js';
import { SoundManager } from '../systems/SoundManager.js';
import { el, show, hide, setText, rnd, fmt, fmtK, popCol, shuffle } from '../utils/helpers.js';

/**
 * Главный фасад игры: экраны, цикл, ввод, ИИ.
 */
export class BorderGame {
  constructor() {
    this.state = new GameState();
    this.i18n = new I18n();
    const mapCanvas = /** @type {HTMLCanvasElement} */ (el('map-canvas'));
    const uiCanvas = /** @type {HTMLCanvasElement} */ (el('ui-canvas'));
    this.renderer = new GameRenderer(this.state, mapCanvas, uiCanvas);
    this.ai = new AiController(this);
    this.sound = new SoundManager();

    this.rafId = 0;
    this.lastTs = null;
    this.newsTimer = null;
    this.narrTimer = null;
    this.newsHideTimer = null;
    /** @type {ReturnType<typeof setInterval> | null} */
    this.casusTyperInterval = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    this._viewportResizeTimer = null;
    /** Пауза: симуляция и ИИ остановлены, UI заморожен */
    this.paused = false;

    // ── Настройки ──────────────────────────────────────────────
    this.soundOn = true;
    /** @type {'slow'|'normal'|'fast'} */
    this.growthSpeed = 'normal';
    this._loadSettings();

    // ── Мемориал (имена погибших, хранятся в сессии) ───────────
    /** @type {string[]} */
    this.memorialNames = [];

    // ── Анимация меню ──────────────────────────────────────────
    this.menuRafId = 0;
    this.menuBorder = 0.5;   // позиция «живой» границы 0..1
    this.menuVel = 0.003;    // скорость дрейфа
  }

  /** После поворота экрана / ресайза окна пересчитываем canvas и карту */
  onViewportResize() {
    const sg = el('s-game');
    if (!sg || window.getComputedStyle(sg).display === 'none' || this.state.isOver) return;
    const arena = el('arena');
    if (!arena || arena.offsetWidth < 8 || arena.offsetHeight < 8) return;
    this.renderer.resizeFromArena(arena);
    MapGenerator.generate(this.state, this.i18n.lang);
    this.renderer.drawMap();
    this.renderHudAndUi();
  }

  _initEvents() {
    el('menu-play').onclick = () => {
      this.sound.init();
      this.sound.playClick();
      this.showCasus();
    };
    el('menu-settings').onclick = () => {
      this.sound.init();
      this.sound.playClick();
      this.openSettings();
    };
    el('menu-help').onclick = () => {
      this.sound.init();
      this.sound.playClick();
      this.openHelp();
    };
    el('menu-lang').onclick = () => {
      this.sound.init();
      this.sound.playClick();
      this.toggleLang();
    };

    el('settings-close').onclick = () => {
      this.sound.playClick();
      this.closeSettings();
    };
    el('help-close').onclick = () => {
      this.sound.playClick();
      this.closeHelp();
    };

    el('set-snd-on').onclick = () => {
      this.sound.init();
      this._setSoundSetting(true);
      this.sound.playClick();
    };
    el('set-snd-off').onclick = () => {
      this.sound.init();
      this._setSoundSetting(false);
    };
    el('cb-langbtn').addEventListener('click', () => this.toggleLang());
    el('cb-btn').addEventListener('click', () => this._startCountdown());
    el('lang-btn').addEventListener('click', () => this.toggleLang());
    el('btn-pause').addEventListener('click', () => this.togglePause());
    el('pause-resume').addEventListener('click', () => this.pauseClose());
    el('pause-restart').addEventListener('click', () => {
      this.pauseClose();
      this.startGame();
    });
    el('pause-menu').addEventListener('click', () => this.goToMainMenu());
    el('mbt-ai').addEventListener('click', () => this.setMode('ai'));
    el('mbt-2p').addEventListener('click', () => this.setMode('2p'));
    el('diff-sel').addEventListener('change', (e) => this.setDiff(/** @type {HTMLSelectElement} */ (e.target).value));
    el('btn-l-dev').addEventListener('click', () => this.switchMode('L', 'dev'));
    el('btn-l-atk').addEventListener('click', () => this.switchMode('L', 'atk'));
    el('btn-l-def').addEventListener('click', () => this.switchMode('L', 'def'));
    el('btn-r-def').addEventListener('click', () => this.switchMode('R', 'def'));
    el('btn-r-atk').addEventListener('click', () => this.switchMode('R', 'atk'));
    el('btn-r-dev').addEventListener('click', () => this.switchMode('R', 'dev'));
    el('abl').addEventListener('click', () => this.playerAtk());
    el('ard').addEventListener('click', () => this.playerDef());
    el('btn-new').addEventListener('click', () => { hide('s-memorial'); this.newCasus(); });
    el('btn-rematch').addEventListener('click', () => { hide('s-memorial'); this.startGame(); });
    el('btn-to-menu').addEventListener('click', () => { hide('s-memorial'); this.goToMainMenu(); });
    el('btn-open-memorial').addEventListener('click', () => this._showMemorial());

    // ── Настройки ─────────────────────────────────────────────
    // el('set-snd-on').addEventListener('click', () => this._setSoundSetting(true)); // Handled by _initEvents
    // el('set-snd-off').addEventListener('click', () => this._setSoundSetting(false)); // Handled by _initEvents
    el('set-spd-slow').addEventListener('click', () => this._setSpeedSetting('slow'));
    el('set-spd-normal').addEventListener('click', () => this._setSpeedSetting('normal'));
    el('set-spd-fast').addEventListener('click', () => this._setSpeedSetting('fast'));
    el('set-lang-ru').addEventListener('click', () => this._setLangSetting('ru'));
    el('set-lang-en').addEventListener('click', () => this._setLangSetting('en'));

    // ── Мемориал ──────────────────────────────────────────────
    el('mem-save-btn').addEventListener('click', () => this._memSave());
    el('mem-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._memSave();
    });
    // el('menu-help').addEventListener('click', () => this.openHelp()); // Handled by _initEvents
    // el('help-close').addEventListener('click', () => this.closeHelp()); // Handled by _initEvents
  }

  wireDom() {
    this._initEvents(); // Call the new method
  }

  t(key) {
    return this.i18n.t(key);
  }

  // ── Настройки ───────────────────────────────────────────────
  _loadSettings() {
    try {
      const s = localStorage.getItem('border_settings');
      if (s) {
        const obj = JSON.parse(s);
        if (typeof obj.soundOn === 'boolean') this.soundOn = obj.soundOn;
        if (['slow','normal','fast'].includes(obj.growthSpeed)) this.growthSpeed = obj.growthSpeed;
        if (['ru','en'].includes(obj.lang)) this.i18n.lang = obj.lang;
      }
    } catch (_) {}
  }

  _saveSettings() {
    try {
      localStorage.setItem('border_settings', JSON.stringify({
        soundOn: this.soundOn,
        growthSpeed: this.growthSpeed,
        lang: this.i18n.lang,
      }));
    } catch (_) {}
  }

  /** Возвращает множитель GR для текущей скорости роста */
  get growthMult() {
    return this.growthSpeed === 'slow' ? 0.5 : this.growthSpeed === 'fast' ? 2.0 : 1.0;
  }

  _setSoundSetting(on) {
    this.soundOn = on;
    this.sound.setEnabled(on);
    this._saveSettings();
    this._applySettingsUI();
  }

  _setSpeedSetting(speed) {
    this.growthSpeed = speed;
    ['slow','normal','fast'].forEach(s => {
      el(`set-spd-${s}`).classList.toggle('active', s === speed);
    });
    this._saveSettings();
  }

  _setLangSetting(lang) {
    if (this.i18n.lang === lang) return;
    this.i18n.lang = lang;
    document.documentElement.lang = lang;
    el('set-lang-ru').classList.toggle('active', lang === 'ru');
    el('set-lang-en').classList.toggle('active', lang === 'en');
    this.i18n.applyStaticLabels();
    this._saveSettings();
  }

  _applySettingsUI() {
    el('set-snd-on').classList.toggle('active', this.soundOn);
    el('set-snd-off').classList.toggle('active', !this.soundOn);
    this.sound.setEnabled(this.soundOn);
    ['slow','normal','fast'].forEach(s => {
      el(`set-spd-${s}`).classList.toggle('active', s === this.growthSpeed);
    });
    el('set-lang-ru').classList.toggle('active', this.i18n.lang === 'ru');
    el('set-lang-en').classList.toggle('active', this.i18n.lang === 'en');
  }

  toggleLang() {
    this.i18n.toggle();
    document.documentElement.lang = this.i18n.lang === 'ru' ? 'ru' : 'en';
    el('set-lang-ru').classList.toggle('active', this.i18n.lang === 'ru');
    el('set-lang-en').classList.toggle('active', this.i18n.lang === 'en');
    this.i18n.applyStaticLabels();
    this._saveSettings();
    const casus = el('s-casus');
    if (casus && window.getComputedStyle(casus).display !== 'none') {
      this.showCasus();
    }
  }

  openSettings() {
    this._applySettingsUI();
    show('s-settings');
  }

  closeSettings() {
    hide('s-settings');
  }

  openHelp() {
    show('s-help');
  }

  closeHelp() {
    hide('s-help');
  }

  togglePause() {
    if (this.state.isOver) return;
    const sg = el('s-game');
    if (!sg || window.getComputedStyle(sg).display === 'none') return;
    if (this.paused) this.pauseClose();
    else this.pauseOpen();
  }

  pauseOpen() {
    this.paused = true;
    el('pause-overlay').style.display = 'flex';
  }

  pauseClose() {
    this.paused = false;
    el('pause-overlay').style.display = 'none';
    this.lastTs = null;
  }

  /** Выход в главное меню: остановка партии */
  /** Выход в главное меню: остановка партии */
  goToMainMenu() {
    this.sound.stopAll();
    this.pauseClose();
    if (this.casusTyperInterval != null) {
      clearInterval(this.casusTyperInterval);
      this.casusTyperInterval = null;
    }
    this.ai.stop();
    cancelAnimationFrame(this.rafId);
    clearInterval(this.newsTimer);
    clearTimeout(this.narrTimer);
    clearTimeout(this.newsHideTimer);
    if (this.state.switchL.timer) clearTimeout(this.state.switchL.timer);
    if (this.state.switchR.timer) clearTimeout(this.state.switchR.timer);
    hide('s-game');
    hide('s-casus');
    hide('s-end');
    hide('s-memorial');
    hide('s-settings');
    show('s-menu');
    this._startMenuAnim();
  }

  setStatus(s) {
    setText('statusbar', s);
  }

  showCasus() {
    this.sound.playClick();
    el('cb-btn').disabled = false;
    if (this.casusTyperInterval != null) {
      clearInterval(this.casusTyperInterval);
      this.casusTyperInterval = null;
    }
    hide('s-menu');
    hide('s-settings');
    show('s-casus');
    hide('s-game');
    hide('s-end');
    const pairs = NamePairs[this.i18n.lang];
    const pair = pairs[rnd(pairs.length)];
    this.state.nameL = pair[0];
    this.state.nameR = pair[1];
    const pool = CasusTemplates[this.i18n.lang](this.state.nameL, this.state.nameR);
    this.state.casusText = pool[rnd(pool.length)];
    setText('cb-head', this.t('cb_head'));
    setText('cb-btn', this.t('cb_btn'));
    el('cb-btn').style.display = 'none';
    el('cb-date').textContent = '';
    el('cb-body').textContent = '';
    const text = this.state.casusText;
    let idx = 0;
    this.casusTyperInterval = setInterval(() => {
      if (idx < text.length) {
        el('cb-body').textContent += text[idx];
        idx++;
      } else {
        clearInterval(this.casusTyperInterval);
        this.casusTyperInterval = null;
        const mons =
          this.i18n.lang === 'ru'
            ? [
                'января',
                'февраля',
                'марта',
                'апреля',
                'мая',
                'июня',
                'июля',
                'августа',
                'сентября',
                'октября',
                'ноября',
                'декабря',
              ]
            : [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ];
        el('cb-date').textContent = `${1 + rnd(28)} ${mons[rnd(12)]} ${2014 + rnd(11)} ${this.t('cb_sig')}`;
        el('cb-btn').style.display = 'inline-block';
      }
    }, 22);
  }

  newCasus() {
    this.showCasus();
  }

  setMode(m) {
    this.state.gameMode = m;
    el('mbt-ai').classList.toggle('on', m === 'ai');
    el('mbt-2p').classList.toggle('on', m === '2p');
    el('diff-sel').style.display = m === 'ai' ? '' : 'none';
    this.startGame();
  }

  setDiff(d) {
    this.state.diff = d;
  }

  startGame() {
    this.pauseClose();
    if (this.casusTyperInterval != null) {
      clearInterval(this.casusTyperInterval);
      this.casusTyperInterval = null;
    }
    hide('s-menu');
    hide('s-settings');
    hide('s-casus');
    show('s-game');
    hide('s-end');
    if (this.state.switchL.timer) clearTimeout(this.state.switchL.timer);
    if (this.state.switchR.timer) clearTimeout(this.state.switchR.timer);
    this.state.resetSession();
    this.state.microPool = shuffle(MicroStories[this.i18n.lang].slice());
    this.ai.stop();
    cancelAnimationFrame(this.rafId);
    clearInterval(this.newsTimer);
    clearTimeout(this.narrTimer);
    clearTimeout(this.newsHideTimer);

    el('abl').disabled = false;
    el('ard').disabled = false;
    el('m-narr').style.opacity = '0';
    el('m-news').style.opacity = '0';
    el('m-thresh').style.display = 'none';

    const arena = el('arena');
    this.renderer.resizeFromArena(arena);
    MapGenerator.generate(this.state, this.i18n.lang);
    this.renderer.drawMap();

    this.i18n.applyStaticLabels();
    setText('p-l-name', this.t('p_p1'));
    setText('p-r-name', this.state.gameMode === 'ai' ? this.t('p_ai') : this.t('p_p2'));
    this.setStatus(this.t('s_init'));
    this.updateModeUI('L');
    this.updateModeUI('R');
    this.renderHudAndUi();

    this.lastTs = null;
    this.rafId = requestAnimationFrame((ts) => this.tick(ts));

    if (this.state.gameMode === 'ai') this.ai.start();

    this.newsTimer = setInterval(
      () => this.showNews(),
      26000 + rnd(18000),
    );
    // Сбросить состояние звука для новой игры
    this._lastPopTick = 0;
    this._lastAlarmTick = 0;
  }

  _startCountdown() {
    this.sound.playClick();
    el('cb-btn').disabled = true;
    let count = 3;
    const update = () => {
      if (count > 0) {
        this.sound.playBeep(false);
        el('cb-btn').textContent = `${count}...`;
        this.setStatus(count.toString());
        count--;
        setTimeout(update, 1000);
      } else {
        this.sound.playBeep(true);
        this.startGame();
      }
    };
    update();
  }

  switchMode(side, newMode) {
    const s = this.state;
    if (s.isOver || this.paused) return;
    const curMode = side === 'L' ? s.modeL : s.modeR;
    const sw = side === 'L' ? s.switchL : s.switchR;
    if (sw.active) return;
    if (curMode === newMode) return;
    sw.active = true;
    sw.target = newMode;
    sw.startMs = Date.now();
    if (side === 'L') s.modeL = 'neu';
    else s.modeR = 'neu';
    this.updateModeUI(side);
    const cdEl = el(`cd-${side.toLowerCase()}`);
    cdEl.style.transition = 'none';
    cdEl.style.width = '0%';
    setTimeout(() => {
      cdEl.style.transition = `width ${GameConfig.SWITCH_MS}ms linear`;
      cdEl.style.width = '100%';
    }, 20);
    sw.timer = setTimeout(() => {
      sw.active = false;
      if (side === 'L') s.modeL = newMode;
      else s.modeR = newMode;
      cdEl.style.width = '0%';
      this.updateModeUI(side);
    }, GameConfig.SWITCH_MS);
  }

  updateModeUI(side) {
    const s = this.state;
    const mode = side === 'L' ? s.modeL : s.modeR;
    const sw = side === 'L' ? s.switchL : s.switchR;
    const sl = side.toLowerCase();
    const tips = {
      dev: this.t('tip_dev'),
      atk: this.t('tip_atk'),
      def: this.t('tip_def'),
      neu: '',
    };
    const colors = {
      dev: 'var(--mode-dev)',
      atk: 'var(--mode-atk)',
      def: 'var(--mode-def)',
      neu: 'var(--mode-neu)',
    };
    setText(`ms-${sl}`, sw.active ? this.t('switching') : tips[mode]);
    el(`ms-${sl}`).style.color = colors[mode];
    ['dev', 'atk', 'def'].forEach((m) => {
      const btn = el(`btn-${sl}-${m}`);
      if (!btn) return;
      btn.className = `mbtn ${m}${mode === m ? ` active-${m}` : ''}`;
      btn.disabled = sw.active;
    });
  }

  /**
   * Атака правой стороны (игрок 2 или ИИ).
   * @returns {boolean}
   */
  executeRightAttack() {
    return this._resolveAttack(false);
  }

  _resolveAttack(isLeft) {
    const s = this.state;
    const res = CombatSystem.applyAttack(s, isLeft);
    if (!res.ok) return false;
    this.sound.playAtk();
    const side = isLeft ? 'L' : 'R';
    BattleEffects.spawnEvents(s, side);
    BattleEffects.spawnParticles(s, side, res.attackerCost);
    BattleEffects.wiggleFront(s, side);
    
    // Нарратив: сменяется каждые 2 атаки (суммарно с обеих сторон)
    s.totalAttacks = (s.totalAttacks || 0) + 1;
    if (s.totalAttacks % 2 === 0) {
      this.showNarr();
    }
    this.checkThresholds();
    this.checkWin();
    this.checkExtinction();
    this.renderHudAndUi();
    return true;
  }

  playerAtk() {
    const s = this.state;
    if (s.isOver || this.paused) return;
    if (s.modeL === 'neu') {
      this.setStatus(this.t('switching'));
      return;
    }
    if (!ModeRegistry[s.modeL].canAtk) {
      this.setStatus(this.t('tip_dev'));
      return;
    }
    if (s.popL <= 1) {
      this.setStatus(this.t('s_exhaust'));
      return;
    }
    const now = Date.now();
    if (now - s.cdL < GameConfig.CD_MS) return;
    s.cdL = now;
    this._resolveAttack(true);
  }

  playerDef() {
    const s = this.state;
    if (s.isOver || this.paused || s.gameMode !== '2p') return;
    if (s.modeR === 'neu') return;
    if (!ModeRegistry[s.modeR].canAtk) return;
    if (s.popR <= 1) return;
    const now = Date.now();
    if (now - s.cdR < GameConfig.CD_MS) return;
    s.cdR = now;
    this._resolveAttack(false);
  }

  tick(ts) {
    const s = this.state;
    if (s.isOver) return;
    if (this.paused) {
      this.rafId = requestAnimationFrame((t) => this.tick(t));
      return;
    }
    if (this.lastTs == null) {
      this.lastTs = ts;
      this.rafId = requestAnimationFrame((t) => this.tick(t));
      return;
    }
    const dt = Math.min(ts - this.lastTs, 80) / 1000;
    this.lastTs = ts;
    const max = GameConfig.MAX_POP;
    const gr = GameConfig.GR * this.growthMult;
    const tL = (1 - s.border) / 0.5;
    const tR = s.border / 0.5;
    const gmL = ModeRegistry[s.modeL] ? ModeRegistry[s.modeL].growMult : 1;
    const gmR = ModeRegistry[s.modeR] ? ModeRegistry[s.modeR].growMult : 1;
    s.popL = Math.min(max, s.popL + s.popL * gr * (1 - s.popL / max) * tL * gmL * dt);
    s.popR = Math.min(max, s.popR + s.popR * gr * (1 - s.popR / max) * tR * gmR * dt);

    for (let i = s.events.length - 1; i >= 0; i--) {
      s.events[i].life -= dt * 0.7;
      if (s.events[i].life <= 0) s.events.splice(i, 1);
    }
    for (let j = s.particles.length - 1; j >= 0; j--) {
      const p = s.particles[j];
      p.x += p.vx * 55 * dt;
      p.y += p.vy * 55 * dt;
      p.vy += 2.5 * dt;
      p.life -= dt * 1.8;
      if (p.life <= 0) s.particles.splice(j, 1);
    }
    const J = GameConfig.JAG_SEGS;
    for (let k = 0; k <= J; k++) s.frontJag[k] *= 0.97;

    // ── Звуковая логика ──────────────────────────────────────────
    this.sound.updateMusic(1 - s.border, s.isOver);
    
    // Тик роста (раз в 5 секунд, если идет реальный рост)
    if (ts - this._lastPopTick > 5000) {
      const gmL = ModeRegistry[s.modeL] ? ModeRegistry[s.modeL].growMult : 0;
      if (gmL > 1 && s.popL < GameConfig.MAX_POP * 0.99) {
        this.sound.playGrowth();
        this._lastPopTick = ts;
      }
    }

    this.renderHudAndUi();
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  renderHudAndUi() {
    const s = this.state;
    const lp = Math.round((1 - s.border) * 100);
    const rp = 100 - lp;
    setText('terr-l', `${lp}%`);
    setText('terr-r', `${rp}%`);
    
    // Сигнал тревоги (ниже 10% населения, раз в 2 секунды)
    const now = Date.now();
    if (s.popL < GameConfig.START_POP * 0.1 && now - this._lastAlarmTick > 2000) {
      this.sound.playAlarm();
      this._lastAlarmTick = now;
    }

    setText('info-dead', `${this.t('casualties')}: ${fmt(s.lostL + s.lostR, this.i18n.numberLocale)}`);
    const cL = popCol(s.popL);
    const cR = popCol(s.popR);
    const dispMax = Math.max(s.popL, s.popR, GameConfig.START_POP * 1.2);
    el('fill-l').style.height = `${Math.round((s.popL / dispMax) * 100)}%`;
    el('fill-l').style.background = cL;
    el('fill-r').style.height = `${Math.round((s.popR / dispMax) * 100)}%`;
    el('fill-r').style.background = cR;
    el('num-l').textContent = fmtK(s.popL);
    el('num-l').style.color = cL;
    el('num-r').textContent = fmtK(s.popR);
    el('num-r').style.color = cR;
    el('abl').disabled = s.isOver || s.modeL === 'dev' || s.modeL === 'neu';
    this.renderer.drawUiOverlay();
  }

  showNarr() {
    const s = this.state;
    if (!s.microPool || s.microPool.length < 50) {
      s.microPool = shuffle(MicroStories[this.i18n.lang].slice());
      s.microIdx = 0;
    }
    const e = el('m-narr');
    e.textContent = s.microPool[s.microIdx % s.microPool.length];
    s.microIdx++;
    e.style.transition = 'opacity .15s';
    e.style.opacity = '1';
    clearTimeout(this.narrTimer);
    this.narrTimer = setTimeout(() => {
      e.style.transition = 'opacity .2s';
      e.style.opacity = '0';
    }, 1800);
  }

  showNews() {
    if (this.state.isOver) return;
    const lines = NewsLines[this.i18n.lang];
    const e = el('m-news');
    e.textContent = lines[rnd(lines.length)];
    e.style.transition = 'opacity .4s';
    e.style.opacity = '1';
    clearTimeout(this.newsHideTimer);
    this.newsHideTimer = setTimeout(() => {
      e.style.transition = 'opacity .8s';
      e.style.opacity = '0';
    }, 4000);
  }

  checkThresholds() {
    const s = this.state;
    const total = s.lostL + s.lostR;
    const msgs = CasualtyThresholds[this.i18n.lang];
    [100000, 500000, 1000000].forEach((tv) => {
      if (!s.threshHit[tv] && total >= tv) {
        s.threshHit[tv] = true;
        const e = el('m-thresh');
        const numStr = fmt(tv, this.i18n.numberLocale);
        const prefix = this.i18n.lang === 'ru' ? `${numStr} погибших` : `${numStr} dead`;
        e.innerHTML = `<strong>${prefix}</strong>${msgs[tv]}`;
        e.style.display = 'flex';
        setTimeout(() => {
          e.style.display = 'none';
        }, 4000);
      }
    });
  }

  checkWin() {
    const s = this.state;
    if (s.isOver) return;
    if (s.border <= 0) this.endGame('L');
    else if (s.border >= 1) this.endGame('R');
  }

  checkExtinction() {
    const s = this.state;
    if (s.isOver) return;
    if (s.popL <= 1) this.endGame('R');
    else if (s.popR <= 1) this.endGame('L');
  }

  endGame(winner) {
    const s = this.state;
    if (s.isOver) return;
    s.isOver = true;
    this.pauseClose();
    this.ai.stop();
    cancelAnimationFrame(this.rafId);
    clearInterval(this.newsTimer);
    clearTimeout(this.narrTimer);
    clearTimeout(this.newsHideTimer);
    this.sound.updateMusic(0, true);
    this.sound.playEnd(winner === 'L');
    if (s.switchL.timer) clearTimeout(s.switchL.timer);
    if (s.switchR.timer) clearTimeout(s.switchR.timer);
    el('abl').disabled = true;
    el('ard').disabled = true;
    this.setStatus(winner === 'L' ? this.t('s_won') : this.t('s_lost'));

    setTimeout(() => {
      hide('s-game');
      show('s-end');
      const sec = Math.floor((Date.now() - s.startMs) / 1000);
      const total = s.lostL + s.lostR;
      const civilian = Math.round(total * 0.62);
      const children = Math.round(civilian * 0.22);
      const women = Math.round(civilian * 0.38);
      const elderly = Math.round(civilian * 0.28);
      const loc = this.i18n.numberLocale;
      setText('d-children', fmt(children, loc));
      setText('dl-children', this.t('dl_children'));
      setText('d-women', fmt(women, loc));
      setText('dl-women', this.t('dl_women'));
      setText('d-elderly', fmt(elderly, loc));
      setText('dl-elderly', this.t('dl_elderly'));
      setText('el-l', s.nameL);
      setText('el-r', s.nameR);
      const suf = this.i18n.lang === 'ru' ? ' чел.' : '';
      setText('ev-l', fmt(s.lostL, loc) + suf);
      setText('ev-r', fmt(s.lostR, loc) + suf);
      setText('ev-t', fmt(s.lostL + s.lostR, loc) + suf);
      setText('ev-d', this.i18n.formatDuration(sec));
      const gainL = Math.round((1 - s.border) * 100) - 50;
      const km = Math.abs(Math.round((gainL / 100) * GameConfig.TOTAL_KM));
      if (gainL > 0) {
        setText('e-terrline', s.nameL + this.t('km_won') + km + this.t('km_km'));
      } else if (gainL < 0) {
        setText('e-terrline', s.nameR + this.t('km_won') + km + this.t('km_km'));
      } else {
        setText('e-terrline', this.t('km_none'));
      }
      setText('e-casus', this.t('e_casus') + s.casusText + this.t('e_casus_suffix'));
      const quotes = EndQuotes[this.i18n.lang];
      setText('e-quote', quotes[rnd(quotes.length)]);
    }, 2200);
  }

  // ── Мемориал ───────────────────────────────────────────────
  _showMemorial() {
    el('mem-input').value = '';
    this._renderMemList();
    hide('s-end');
    show('s-memorial');
    setTimeout(() => el('mem-input').focus(), 100);
  }

  _memSave() {
    const name = (el('mem-input').value || '').trim();
    if (name) {
      this.memorialNames.push(name);
      el('mem-input').value = '';
      this._renderMemList();
    }
    // не закрываем экран — пользователь сам выбирает кнопку навигации
  }

  _renderMemList() {
    const list = el('mem-list');
    if (!list) return;
    if (this.memorialNames.length === 0) {
      list.innerHTML = `<div class="mem-empty">${this.i18n.t('mem_empty')}</div>`;
      return;
    }
    list.innerHTML = this.memorialNames
      .map(n => `<div class="mem-entry">${n}</div>`)
      .join('');
  }

  // ── Анимация меню ─────────────────────────────────────────────
  _startMenuAnim() {
    cancelAnimationFrame(this.menuRafId);
    const canvas = /** @type {HTMLCanvasElement} */ (el('menu-canvas'));
    if (!canvas) return;
    const loop = () => {
      const menu = el('s-menu');
      if (!menu || window.getComputedStyle(menu).display === 'none') return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      this._menuDraw(canvas);
      this.menuRafId = requestAnimationFrame(loop);
    };
    this.menuRafId = requestAnimationFrame(loop);
  }

  _stopMenuAnim() {
    cancelAnimationFrame(this.menuRafId);
  }

  _menuDraw(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Седообразный дрейф границы: маятник
    this.menuBorder += this.menuVel;
    const noise = (Math.sin(Date.now() * 0.0008) * 0.06)
                + (Math.sin(Date.now() * 0.0021 + 1.3) * 0.04);
    const bx = (this.menuBorder + noise) * W;
    if (bx < W * 0.1 || bx > W * 0.9) this.menuVel *= -1;

    // Зона лева
    ctx.fillStyle = '#B8C4D0';
    ctx.fillRect(0, 0, bx, H);
    // Зона права
    ctx.fillStyle = '#F2D4B8';
    ctx.fillRect(bx, 0, W - bx, H);
    // Линия границы
    ctx.strokeStyle = '#D65108';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }

  boot() {
    document.documentElement.lang = this.i18n.lang;
    this.wireDom();
    this.i18n.applyStaticLabels();
    this._applySettingsUI();
    hide('s-casus');
    hide('s-game');
    hide('s-end');
    hide('s-memorial');
    hide('s-settings');
    show('s-menu');
    this._startMenuAnim();
    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        const st = el('s-settings');
        if (st && window.getComputedStyle(st).display !== 'none') {
          this.closeSettings();
          return;
        }
        this.togglePause();
        return;
      }
      if (this.paused) return;
      if (k === 'a' || k === 'ф') this.playerAtk();
      if ((k === 'l' || k === 'д') && this.state.gameMode === '2p') this.playerDef();
      if (k === '1') this.switchMode('L', 'dev');
      if (k === '2') this.switchMode('L', 'atk');
      if (k === '3') this.switchMode('L', 'def');
      if (this.state.gameMode === '2p') {
        if (k === '7') this.switchMode('R', 'def');
        if (k === '8') this.switchMode('R', 'atk');
        if (k === '9') this.switchMode('R', 'dev');
      }
    });
    const scheduleResize = () => {
      if (this._viewportResizeTimer) clearTimeout(this._viewportResizeTimer);
      this._viewportResizeTimer = setTimeout(() => {
        this._viewportResizeTimer = null;
        this.onViewportResize();
      }, 120);
    };
    window.addEventListener('resize', scheduleResize);
    window.addEventListener('orientationchange', scheduleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleResize);
    }
  }
}
