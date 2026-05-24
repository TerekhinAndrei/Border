/** @typedef {'dev'|'atk'|'def'|'neu'} GameMode */

/**
 * Статические параметры баланса и карты (GDD §7.1).
 */
export const GameConfig = Object.freeze({
  MAX_POP: 1_000_000,
  START_POP: 250_000,
  TOTAL_KM: 800,
  GR: 0.005,
  // Атака теперь дороже: 3.5% популяции против 2.5%. Часть бывшего «оборонного запаса» переехала в Army Reserve.
  BASE_COST: 0.035,
  // Пуш стал крупнее, чтобы серия в 6 атак за резерв давала ощутимое продвижение (~6% территории).
  BASE_PUSH: 0.005,
  CD_MS: 600,
  SWITCH_MS: 3000,
  JAG_SEGS: 60,
  // ── Army Reserve (Option C) ────────────────────────────────────
  // Резерв атак — главный анти-спам механизм. 30 единиц = 6 атак за залп,
  // потом обязательная пауза в Развитии для восстановления.
  MAX_ARMY: 30,
  START_ARMY: 30,
  ARMY_PER_ATTACK: 5,
  // Восстановление армии в зависимости от режима (в секунду).
  ARMY_REGEN_DEV: 4.0,
  ARMY_REGEN_DEF: 1.5,
  ARMY_REGEN_NEU: 1.0,
  ARMY_REGEN_ATK: 0.0,
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
