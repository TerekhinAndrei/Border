import { GameConfig } from '../config/GameConfig.js';

/**
 * Параметры темпа на каждый уровень сложности.
 *  iv  — минимальный интервал между атаками (мс)
 *  opt — вероятность сделать атаку в момент проверки
 */
const DIFF_PARAMS = {
  easy: { iv: 600, opt: 0.8 },
  medium: { iv: 600, opt: 0.78 },
  hard: { iv: 300, opt: 0.92 },
};

/**
 * Интервал между принятиями решения о смене режима (мс).
 */
const MODE_TICK = {
  easy: 4000,
  medium: 1500,
  hard: 1800,
};

/**
 * ИИ противника с тремя выраженными «характерами»:
 *  • Easy — «безрассудный новобранец»: всегда в атаке, никогда не уходит в защиту.
 *  • Medium — «осторожный офицер»: FSM с состояниями GROW/ATTACK/RECOVER/RUSH.
 *  • Hard — «стратег»: читает игрока (вероятность 0.6) и иногда уходит в финт
 *    (короткая ложная пауза в dev на 2 секунды), провоцируя ход игрока.
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
    /** @type {number} Время до которого hard-ИИ держит финт (имитация dev). */
    this._feintUntilMs = 0;
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
    this._feintUntilMs = 0;
  }

  start() {
    this.stop();
    const state = this.host.state;
    const diff = state.diff;
    const p = DIFF_PARAMS[diff] || DIFF_PARAMS.medium;

    this._modeInterval = setInterval(() => {
      if (this.host.paused) return;
      if (state.isOver) {
        this.stop();
        return;
      }
      if (state.switchR.active) return;

      const desired = this._decideMode(diff, state);
      if (desired && desired !== state.modeR) this.host.switchMode('R', desired);
    }, MODE_TICK[diff] || MODE_TICK.medium);

    this._attackInterval = setInterval(() => {
      if (this.host.paused) return;
      if (state.isOver) {
        this.stop();
        return;
      }
      if (state.popR <= 1) return;
      // Без резерва атаковать нельзя — даже AI обязан переждать.
      if (state.armyR < GameConfig.ARMY_PER_ATTACK) return;
      const now = Date.now();
      if (now - this._aiLastAttack < p.iv) return;
      if (state.modeR === 'neu' || state.modeR === 'dev') return;
      const maxPop = GameConfig.MAX_POP;
      const ef = state.popL / maxPop;
      const mf = state.popR / maxPop;
      let go = Math.random() < p.opt;
      // Если игрок почти повержен, не ждём шанс — добиваем.
      if (ef < 0.08 && mf > 0.05) go = true;
      if (go) {
        this._aiLastAttack = now;
        this.host.executeRightAttack();
      }
    }, 80);
  }

  /**
   * Решает желаемый режим в зависимости от сложности и состояния партии.
   * Возвращает один из 'dev' | 'atk' | 'def' либо null если менять не нужно.
   * @param {'easy'|'medium'|'hard'} diff
   * @param {import('../game/GameState.js').GameState} state
   */
  _decideMode(diff, state) {
    if (diff === 'easy') return this._decideEasy(state);
    if (diff === 'medium') return this._decideMedium(state);
    return this._decideHard(state);
  }

  _decideEasy(state) {
    // «Новобранец» — всегда в атаке. Но даже он вынужденно уходит в Развитие,
    // когда резерв опустошён (правило игры, не стратегия).
    if (state && state.armyR < GameConfig.ARMY_PER_ATTACK * 1.5) return 'dev';
    return 'atk';
  }

  /**
   * Medium FSM: четыре состояния согласно GDD §3.1.2.
   *   RECOVER (popR < 20%)              → dev
   *   RUSH    (territoryR < 40%)        → atk (территориальный кризис)
   *   GROW    (20% ≤ popR < 60%)        → dev (накопление)
   *   ATTACK  (popR ≥ 60%)              → atk (основной натиск)
   */
  _decideMedium(state) {
    const maxPop = GameConfig.MAX_POP;
    const mf = state.popR / maxPop;
    const myTerritory = state.border;
    const armyLow = state.armyR < GameConfig.ARMY_PER_ATTACK * 2;
    // Резерв на исходе — копим, иначе кнопка серая и AI стоит зря.
    if (armyLow) return 'dev';
    if (mf < 0.2) return 'dev';
    if (myTerritory < 0.4) return 'atk';
    if (mf < 0.6) return 'dev';
    return 'atk';
  }

  /**
   * Hard: чтение игрока + редкий финт (имитация dev) для обмана.
   */
  _decideHard(state) {
    const now = Date.now();
    const maxPop = GameConfig.MAX_POP;
    const mf = state.popR / maxPop;
    const ef = state.popL / maxPop;
    const myTerr = state.border;
    const armyLow = state.armyR < GameConfig.ARMY_PER_ATTACK * 2;

    // Резерв опустошён — нет смысла стоять в атаке, копим в dev.
    if (armyLow) return 'dev';

    // Если финт ещё активен — держим dev, чтобы спровоцировать атаку игрока.
    if (now < this._feintUntilMs) return 'dev';

    // 12% шанс начать новый финт на 2 секунды, но только при здоровом запасе населения.
    if (mf > 0.35 && Math.random() < 0.12) {
      this._feintUntilMs = now + 2000;
      return 'dev';
    }

    // Чтение игрока (вероятность 0.6).
    if (Math.random() < 0.6) {
      if (state.modeL === 'atk') return 'def';
      if (state.modeL === 'def') return 'dev';
      return 'atk';
    }

    // Запасная эвристика.
    if (mf < 0.15) return 'dev';
    if (myTerr < 0.35) return 'atk';
    const pr = state.popR / Math.max(1, state.popL);
    if (pr > 1.4) return 'atk';
    if (ef < 0.15) return 'atk';
    return Math.random() < 0.4 ? 'dev' : 'atk';
  }
}
