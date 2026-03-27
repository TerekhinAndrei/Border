import { GameConfig, ModeRegistry } from '../config/GameConfig.js';

/**
 * Расчёт параметров атаки и применение потерь к состоянию.
 */
export class CombatSystem {
  /**
   * @param {string} attackerMode
   * @param {string} defenderMode
   */
  static getAttackParams(attackerMode, defenderMode) {
    const am = ModeRegistry[attackerMode] || ModeRegistry.neu;
    let push = GameConfig.BASE_PUSH * am.pushMult;
    if (defenderMode === 'def') push *= 0.25;
    const cost = GameConfig.BASE_COST * am.costMult;
    return { push, cost, canAtk: am.canAtk };
  }

  /**
   * @param {import('../game/GameState.js').GameState} state
   * @param {boolean} isLeft
   * @returns {boolean}
   */
  /**
   * @returns {{ ok: boolean, attackerCost: number }}
   */
  static applyAttack(state, isLeft) {
    const aMode = isLeft ? state.modeL : state.modeR;
    const dMode = isLeft ? state.modeR : state.modeL;
    const p = CombatSystem.getAttackParams(aMode, dMode);
    if (!p.canAtk) return { ok: false, attackerCost: 0 };

    const atkPop = isLeft ? state.popL : state.popR;
    let cost = Math.floor(atkPop * p.cost);
    if (cost < 1) cost = 1;
    let defCost = Math.floor(cost * 0.25);
    if (defCost < 1) defCost = 1;

    if (isLeft) {
      state.lostL += cost;
      state.popL = Math.max(1, state.popL - cost);
      state.lostR += defCost;
      state.popR = Math.max(1, state.popR - defCost);
      state.border = Math.max(0, state.border - p.push);
    } else {
      state.lostR += cost;
      state.popR = Math.max(1, state.popR - cost);
      state.lostL += defCost;
      state.popL = Math.max(1, state.popL - defCost);
      state.border = Math.min(1, state.border + p.push);
    }
    return { ok: true, attackerCost: cost };
  }
}
