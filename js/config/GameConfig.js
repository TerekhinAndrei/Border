/** @typedef {'dev'|'atk'|'def'|'neu'} GameMode */

/**
 * Статические параметры баланса и карты (GDD §7.1).
 */
export const GameConfig = Object.freeze({
  MAX_POP: 1_000_000,
  START_POP: 250_000,
  TOTAL_KM: 800,
  GR: 0.005,
  BASE_COST: 0.025,
  BASE_PUSH: 0.003,
  CD_MS: 600,
  SWITCH_MS: 3000,
  JAG_SEGS: 60,
});

/**
 * Режимы: развитие / наступление / укрепление / нейтраль при переключении.
 */
export const ModeRegistry = Object.freeze({
  dev: { growMult: 5.5, costMult: 1.0, pushMult: 1.0, canAtk: false },
  atk: { growMult: 0.0, costMult: 1.0, pushMult: 2.0, canAtk: true },
  def: { growMult: 1.0, costMult: 2.0, pushMult: 1.0, canAtk: true },
  neu: { growMult: 1.0, costMult: 1.0, pushMult: 1.0, canAtk: false },
});
