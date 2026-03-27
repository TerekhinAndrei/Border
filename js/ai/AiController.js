import { GameConfig } from '../config/GameConfig.js';

const DIFF_PARAMS = {
  easy: { iv: 1200, opt: 0.45 },
  medium: { iv: 600, opt: 0.72 },
  hard: { iv: 300, opt: 0.92 },
};

const MODE_TICK = {
  hard: 1800,
  medium: 2800,
  easy: 4000,
};

/**
 * ИИ противника: периодический выбор режима и атаки.
 */
export class AiController {
  /**
   * @param {import('../game/BorderGame.js').BorderGame} host
   */
  constructor(host) {
    this.host = host;
    this._attackInterval = null;
    this._modeInterval = null;
    this._aiLastAttack = 0;
  }

  stop() {
    if (this._attackInterval) {
      clearInterval(this._attackInterval);
      this._attackInterval = null;
    }
    if (this._modeInterval) {
      clearInterval(this._modeInterval);
      this._modeInterval = null;
    }
  }

  start() {
    this.stop();
    const state = this.host.state;
    const diff = state.diff;
    const p = DIFF_PARAMS[diff] || DIFF_PARAMS.medium;
    const maxPop = GameConfig.MAX_POP;

    this._modeInterval = setInterval(() => {
      if (this.host.paused) return;
      if (state.isOver) {
        this.stop();
        return;
      }
      if (state.switchR.active) return;

      const mf = state.popR / maxPop;
      const ef = state.popL / maxPop;
      const myTerr = state.border;
      const pr = state.popR / Math.max(1, state.popL);
      let desired;
      const readChance = diff === 'hard' ? 0.85 : diff === 'medium' ? 0.55 : 0.25;
      if (Math.random() < readChance) {
        if (state.modeL === 'atk') desired = 'def';
        else if (state.modeL === 'def') desired = 'dev';
        else desired = 'atk';
      } else {
        if (mf < 0.15) desired = 'dev';
        else if (myTerr < 0.35) desired = 'atk';
        else if (pr > 1.4) desired = 'atk';
        else if (ef < 0.15) desired = 'atk';
        else desired = Math.random() < 0.4 ? 'dev' : 'atk';
      }
      if (desired !== state.modeR) this.host.switchMode('R', desired);
    }, MODE_TICK[diff] || MODE_TICK.medium);

    this._attackInterval = setInterval(() => {
      if (this.host.paused) return;
      if (state.isOver) {
        this.stop();
        return;
      }
      if (state.popR <= 1) return;
      const now = Date.now();
      if (now - this._aiLastAttack < p.iv) return;
      if (state.modeR === 'neu' || state.modeR === 'dev') return;
      const ef = state.popL / maxPop;
      const mf = state.popR / maxPop;
      let go = Math.random() < p.opt;
      if (ef < 0.08 && mf > 0.05) go = true;
      if (go) {
        this._aiLastAttack = now;
        this.host.executeRightAttack();
      }
    }, 80);
  }
}
