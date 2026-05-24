import { GameConfig } from '../config/GameConfig.js';

/**
 * Параметры темпа на каждый уровень сложности.
 *  iv  — минимальный интервал между атаками (мс)
 *  opt — вероятность сделать атаку в момент проверки
 */
const DIFF_PARAMS = {
  easy: { iv: 700, opt: 0.85 },
  medium: { iv: 550, opt: 0.85 },
  hard: { iv: 350, opt: 0.95 },
};

/**
 * Интервал между принятиями решения о смене режима (мс).
 * Низкое значение — реактивный AI; высокое — задумчивый.
 */
const MODE_TICK = {
  easy: 1200,
  medium: 900,
  hard: 700,
};

/**
 * Пороги Army Reserve с гистерезисом (анти-флип):
 *  • LOW  — ниже этого порога нужно срочно копить (переход в dev/def)
 *  • READY — поднявшись выше этого порога, AI возвращается в атаку
 * Игрок переключается мгновенно; для AI это набор thresholds, чтобы
 * не дёргаться в район одной цифры.
 */
const ARMY_LOW = 6;     // ниже — нельзя нормально вести наступление
const ARMY_READY = 18;  // выше — снова в атаку

/**
 * ИИ противника с тремя выраженными «характерами»:
 *  • Easy — «безрассудный новобранец»: всегда в атаке, никогда не уходит в защиту.
 *  • Medium — «осторожный офицер»: атакует пока есть резерв, при угрозе уходит в def.
 *  • Hard — «стратег»: читает игрока (вероятность 0.6) и иногда уходит в финт.
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
      // canAtk = true для atk и def. В dev/neu атаковать нельзя.
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
   * Возвращает желаемый режим. Использует гистерезис: если AI уже в режиме
   * восстановления и резерв ещё ниже ARMY_READY — продолжаем копить,
   * не дёргаемся туда-сюда.
   * @param {'easy'|'medium'|'hard'} diff
   * @param {import('../game/GameState.js').GameState} state
   */
  _decideMode(diff, state) {
    if (diff === 'easy') return this._decideEasy(state);
    if (diff === 'medium') return this._decideMedium(state);
    return this._decideHard(state);
  }

  /**
   * Easy — «новобранец»: атакует пока есть армия, восстанавливается в dev.
   * Никогда не уходит в def — простой реактивный паттерн.
   */
  _decideEasy(state) {
    const army = state.armyR;
    const isRecovering = state.modeR === 'dev';
    // Если уже копим — продолжаем до полного восстановления (анти-флип).
    if (isRecovering && army < ARMY_READY) return 'dev';
    // Резерв опустошён — копить.
    if (army < ARMY_LOW) return 'dev';
    return 'atk';
  }

  /**
   * Medium — «офицер»: атакует, при угрозе и пустом резерве уходит в защиту,
   * при критическом населении — в развитие. Использует гистерезис.
   */
  _decideMedium(state) {
    const maxPop = GameConfig.MAX_POP;
    const popFrac = state.popR / maxPop;
    const army = state.armyR;
    const playerThreat = state.modeL === 'atk';
    const inRecovery = state.modeR === 'dev' || state.modeR === 'def';

    // Критическое истощение — безусловно копим. Гистерезис на 12%.
    if (popFrac < 0.10) return 'dev';
    if (popFrac < 0.12 && state.modeR === 'dev') return 'dev';

    // Если уже восстанавливаемся и резерв ещё не готов — не дёргаемся.
    if (inRecovery && army < ARMY_READY) {
      // Под атакой и резерв пуст — лучше блок, чем dev.
      if (playerThreat && army < ARMY_LOW * 2) return 'def';
      return state.modeR;
    }

    // Резерв опустошён — выбор между def (если бьют) и dev (если спокойно).
    if (army < ARMY_LOW) {
      return playerThreat ? 'def' : 'dev';
    }

    // Территориальный кризис — RUSH в атаку.
    if (state.border < 0.4) return 'atk';

    // По умолчанию — атакуем. Army Reserve сама всё запейсит.
    return 'atk';
  }

  /**
   * Hard — «стратег»: чтение игрока + редкий финт. Гистерезис и реакция на угрозу.
   */
  _decideHard(state) {
    const now = Date.now();
    const maxPop = GameConfig.MAX_POP;
    const army = state.armyR;
    const playerThreat = state.modeL === 'atk';
    const inRecovery = state.modeR === 'dev' || state.modeR === 'def';

    // Критическое истощение.
    if (state.popR / maxPop < 0.10) return 'dev';

    // Финт активен — держим dev (имитация уязвимости).
    if (now < this._feintUntilMs) return 'dev';

    // Гистерезис восстановления.
    if (inRecovery && army < ARMY_READY) {
      if (playerThreat && army < ARMY_LOW * 2) return 'def';
      return state.modeR;
    }

    // Резерв опустошён.
    if (army < ARMY_LOW) {
      return playerThreat ? 'def' : 'dev';
    }

    // Финт: при полной армии и здоровом населении 15% шанс короткой ловушки.
    if (army >= ARMY_READY && Math.random() < 0.15) {
      this._feintUntilMs = now + 1800;
      return 'dev';
    }

    // Чтение игрока (60%).
    if (Math.random() < 0.6) {
      if (state.modeL === 'atk') return 'def';
      if (state.modeL === 'def') return 'atk'; // не сидим в dev зря, кусаем в обмен
      return 'atk';
    }

    // По умолчанию агрессивны.
    return 'atk';
  }
}
