import { GameConfig } from '../config/GameConfig.js';

const COLS = 40;
const ROWS = 24;

/**
 * Отрисовка фоновой карты и UI-слоя (фронт, частицы, подписи).
 */
export class GameRenderer {
  /**
   * @param {import('../game/GameState.js').GameState} state
   * @param {HTMLCanvasElement} mapCanvas
   * @param {HTMLCanvasElement} uiCanvas
   */
  constructor(state, mapCanvas, uiCanvas) {
    this.state = state;
    this.mapCanvas = mapCanvas;
    this.uiCanvas = uiCanvas;
  }

  drawMap() {
    const { mapW, mapH, terrain, rivers, cities } = this.state;
    const ctx = this.mapCanvas.getContext('2d');
    ctx.clearRect(0, 0, mapW, mapH);
    const cw = mapW / COLS;
    const rh = mapH / ROWS;
    for (let r = 0; r < ROWS; r++) {
      for (let cc = 0; cc < COLS; cc++) {
        const v = terrain[r][cc];
        const base = v > 0.65 ? [210, 220, 195] : v > 0.4 ? [220, 215, 195] : [200, 210, 220];
        ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
        ctx.fillRect(cc * cw, r * rh, cw + 1, rh + 1);
      }
    }
    ctx.strokeStyle = 'rgba(36,36,36,0.055)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < mapW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapH);
      ctx.stroke();
    }
    for (let y = 0; y < mapH; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapW, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(100,140,180,0.5)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    rivers.forEach((pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
    cities.forEach((city) => {
      ctx.fillStyle = city.side === 'l' ? '#6B7A8F' : '#C4956A';
      ctx.beginPath();
      ctx.arc(city.x, city.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(36,36,36,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(36,36,36,0.55)';
      ctx.font = '7px Share Tech Mono,monospace';
      ctx.fillText(city.name, city.x + 5, city.y + 3);
    });
  }

  drawUiOverlay() {
    const state = this.state;
    const { mapW, mapH, border, modeL, modeR, events, particles, frontJag, nameL, nameR } = state;
    const J = GameConfig.JAG_SEGS;
    const ctx = this.uiCanvas.getContext('2d');
    ctx.clearRect(0, 0, mapW, mapH);
    const frontX = (1 - border) * mapW;
    const pts = [];
    for (let i = 0; i <= J; i++) {
      const y = (i / J) * mapH;
      pts.push({ x: frontX + frontJag[i], y });
    }
    ctx.beginPath();
    ctx.moveTo(0, 0);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(0, mapH);
    ctx.closePath();
    const lc =
      modeL === 'dev'
        ? 'rgba(80,160,100,0.28)'
        : modeL === 'def'
          ? 'rgba(46,109,164,0.28)'
          : 'rgba(107,122,143,0.30)';
    ctx.fillStyle = lc;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(mapW, 0);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(mapW, mapH);
    ctx.closePath();
    const rc =
      modeR === 'dev'
        ? 'rgba(80,160,100,0.26)'
        : modeR === 'def'
          ? 'rgba(46,109,164,0.26)'
          : 'rgba(214,160,100,0.26)';
    ctx.fillStyle = rc;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = 'rgba(214,81,8,0.18)';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#D65108';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.setLineDash([6, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    events.forEach((ev) => {
      if (ev.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(1, ev.life);
      ctx.font = '13px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ev.icon, ev.x, ev.y);
      ctx.restore();
    });
    particles.forEach((p) => {
      if (p.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.font = 'bold 10px Share Tech Mono,monospace';
    ctx.fillStyle = 'rgba(70,88,108,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(nameL, 42, 14);
    ctx.fillStyle = 'rgba(160,100,50,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(nameR, mapW - 42, 14);
  }

  resizeFromArena(arenaEl) {
    this.state.mapW = arenaEl.offsetWidth;
    this.state.mapH = arenaEl.offsetHeight;
    const w = this.state.mapW;
    const h = this.state.mapH;
    this.mapCanvas.width = w;
    this.mapCanvas.height = h;
    this.uiCanvas.width = w;
    this.uiCanvas.height = h;
  }
}
