import { GameConfig } from '../config/GameConfig.js';
import { rnd, rndF } from '../utils/helpers.js';

const ICONS = ['💥', '🔥', '💣', '⚡', '🪖'];

/**
 * Визуальные эффекты у фронта: дрожь линии, иконки, частицы.
 */
export class BattleEffects {
  /**
   * @param {import('../game/GameState.js').GameState} state
   * @param {'L'|'R'} side
   */
  static wiggleFront(state, side) {
    const J = GameConfig.JAG_SEGS;
    const dir = side === 'L' ? -1 : 1;
    for (let i = 0; i <= J; i++) {
      state.frontJag[i] += dir * rndF(2, 9) * Math.random();
    }
  }

  /**
   * @param {import('../game/GameState.js').GameState} state
   * @param {'L'|'R'} side
   */
  static spawnEvents(state, side) {
    const fx = (1 - state.border) * state.mapW;
    const n = 2 + rnd(3);
    for (let i = 0; i < n; i++) {
      let ex = fx + rndF(-25, 25) + (side === 'L' ? -rndF(8, 35) : rndF(8, 35));
      ex = Math.max(40, Math.min(state.mapW - 40, ex));
      state.events.push({
        x: ex,
        y: rndF(state.mapH * 0.1, state.mapH * 0.9),
        icon: ICONS[rnd(ICONS.length)],
        life: 1 + Math.random() * 0.5,
      });
    }
  }

  /**
   * @param {import('../game/GameState.js').GameState} state
   * @param {'L'|'R'} side
   * @param {number} cost
   */
  static spawnParticles(state, side, cost) {
    const fx = (1 - state.border) * state.mapW;
    const maxPop = GameConfig.MAX_POP;
    const n = Math.min(10, Math.max(3, Math.floor((cost / maxPop) * 50)));
    const vd = side === 'L' ? 1 : -1;
    for (let i = 0; i < n; i++) {
      state.particles.push({
        x: fx + rndF(-12, 12),
        y: rndF(state.mapH * 0.2, state.mapH * 0.8),
        vx: vd * (1 + Math.random() * 4),
        vy: rndF(-3, 3),
        life: 1,
        col: '#D65108',
        r: 1.5 + Math.random() * 2,
      });
    }
  }
}
