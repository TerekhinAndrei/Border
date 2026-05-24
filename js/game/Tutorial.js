/**
 * Контекстный туториал для первой партии: 4 шага со spotlight'ом
 * на ключевых элементах UI и пояснениями. Игра ставится на паузу
 * на время каждого шага.
 */
export class Tutorial {
  /**
   * @param {import('./BorderGame.js').BorderGame} host
   */
  constructor(host) {
    this.host = host;
    this.active = false;
    this.stepIdx = 0;
    /** @type {Array<{target:string, key:string}>} */
    this.steps = [
      { target: '#pb-l', key: 's1' },
      { target: '#mp-l .mode-btns', key: 's3' },
      { target: '#abl', key: 's2' },
      { target: '.abtn-wrap:first-child .army-track', key: 's5' },
      { target: '#arena', key: 's4' },
    ];
    this._onResize = () => this._reposition();
    this._wasPaused = false;
  }

  static seen() {
    try {
      return localStorage.getItem('border_tutorial_seen') === '1';
    } catch (_) {
      return false;
    }
  }

  static markSeen() {
    try {
      localStorage.setItem('border_tutorial_seen', '1');
    } catch (_) {}
  }

  static reset() {
    try {
      localStorage.removeItem('border_tutorial_seen');
    } catch (_) {}
  }

  bindUi() {
    const next = document.getElementById('tut-next');
    const skip = document.getElementById('tut-skip');
    if (next) next.addEventListener('click', () => this._next());
    if (skip) skip.addEventListener('click', () => this._skip());
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.stepIdx = 0;
    this._wasPaused = this.host.paused;
    if (!this._wasPaused) this.host.pauseOpen();
    // Закрываем UI паузы — она нам мешает поверх tutorial overlay
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    const overlay = document.getElementById('tut-overlay');
    if (overlay) overlay.classList.add('active');
    window.addEventListener('resize', this._onResize);
    this._renderStep();
  }

  _next() {
    if (!this.active) return;
    this.stepIdx++;
    if (this.stepIdx >= this.steps.length) {
      this._finish();
    } else {
      this._renderStep();
    }
  }

  _skip() {
    this._finish();
  }

  _finish() {
    if (!this.active) return;
    this.active = false;
    Tutorial.markSeen();
    const overlay = document.getElementById('tut-overlay');
    if (overlay) overlay.classList.remove('active');
    window.removeEventListener('resize', this._onResize);
    // Возобновляем игру, если мы её ставили на паузу
    if (!this._wasPaused && this.host.paused) this.host.pauseClose();
  }

  _renderStep() {
    const step = this.steps[this.stepIdx];
    if (!step) return;
    const t = (k) => this.host.i18n.t(k);
    const stepEl = document.getElementById('tut-step');
    const titleEl = document.getElementById('tut-title');
    const bodyEl = document.getElementById('tut-body');
    const nextEl = document.getElementById('tut-next');
    const skipEl = document.getElementById('tut-skip');
    if (stepEl) stepEl.textContent = `${this.stepIdx + 1} / ${this.steps.length}`;
    if (titleEl) titleEl.textContent = t(`tut_${step.key}_title`);
    if (bodyEl) bodyEl.textContent = t(`tut_${step.key}_body`);
    if (nextEl) nextEl.textContent = this.stepIdx === this.steps.length - 1 ? t('tut_start') : t('tut_next');
    if (skipEl) skipEl.textContent = t('tut_skip');
    this._reposition();
  }

  _reposition() {
    const step = this.steps[this.stepIdx];
    if (!step) return;
    const target = document.querySelector(step.target);
    const spotlight = document.getElementById('tut-spotlight');
    const card = document.getElementById('tut-card');
    if (!target || !spotlight || !card) return;
    const r = target.getBoundingClientRect();
    const pad = 6;
    spotlight.style.left = `${r.left - pad}px`;
    spotlight.style.top = `${r.top - pad}px`;
    spotlight.style.width = `${r.width + pad * 2}px`;
    spotlight.style.height = `${r.height + pad * 2}px`;

    // Карточка ниже spotlight'а, если есть место; иначе выше.
    const cardH = card.offsetHeight || 160;
    const vh = window.innerHeight;
    const gap = 16;
    let top;
    if (r.bottom + gap + cardH < vh) {
      top = r.bottom + gap;
    } else if (r.top - gap - cardH > 0) {
      top = r.top - gap - cardH;
    } else {
      top = Math.max(8, vh - cardH - 8);
    }
    card.style.top = `${top}px`;
  }
}
