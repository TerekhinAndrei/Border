import { GameConfig } from '../config/GameConfig.js';
import { rndF } from '../utils/helpers.js';

const COLS = 40;
const ROWS = 24;

/**
 * Процедурная генерация сетки рельефа, рек и городов.
 */
export class MapGenerator {
  /**
   * @param {import('../game/GameState.js').GameState} state
   * @param {'ru'|'en'} lang
   */
  static generate(state, lang) {
    const { mapW, mapH } = state;
    state.terrain = [];
    for (let r = 0; r <= ROWS; r++) {
      state.terrain[r] = [];
      for (let c = 0; c <= COLS; c++) state.terrain[r][c] = Math.random();
    }
    for (let s = 0; s < 3; s++) {
      for (let r = 1; r < ROWS; r++) {
        for (let c = 1; c < COLS; c++) {
          state.terrain[r][c] =
            (state.terrain[r - 1][c] +
              state.terrain[r + 1][c] +
              state.terrain[r][c - 1] +
              state.terrain[r][c + 1] +
              state.terrain[r][c] * 2) /
            6;
        }
      }
    }

    state.rivers = [];
    for (let ri = 0; ri < 2; ri++) {
      const rx = mapW * (0.2 + ri * 0.35 + rndF(-0.05, 0.05));
      const pts = [];
      let cx = rx;
      for (let ry = 0; ry <= mapH; ry += mapH / 20) {
        cx += rndF(-12, 12);
        pts.push({ x: cx, y: ry });
      }
      state.rivers.push(pts);
    }

    const cnL = lang === 'ru' ? ['Корст', 'Малвен', 'Дарн', 'Велт'] : ['Korst', 'Malven', 'Darn', 'Velt'];
    const cnR = lang === 'ru' ? ['Аркос', 'Тумен', 'Прасс', 'Эрин'] : ['Arkos', 'Tumen', 'Prass', 'Erin'];
    state.cities = [];
    for (let ci = 0; ci < 4; ci++) {
      state.cities.push({
        x: mapW * (0.06 + Math.random() * 0.38),
        y: mapH * (0.1 + Math.random() * 0.8),
        name: cnL[ci],
        side: 'l',
      });
      state.cities.push({
        x: mapW * (0.56 + Math.random() * 0.38),
        y: mapH * (0.1 + Math.random() * 0.8),
        name: cnR[ci],
        side: 'r',
      });
    }

    state.frontJag = [];
    const J = GameConfig.JAG_SEGS;
    for (let i = 0; i <= J; i++) state.frontJag.push(rndF(-6, 6));
  }
}
