/**
 * hud.js: FPS + posição + bioma + seed
 *
 * FIXES:
 *  - #9: Replaced innerHTML with textContent to eliminate XSS risk
 *  - #9: Throttled HUD updates to once per 100ms instead of every frame
 */

export class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    this.fps = 0; this.fc = 0; this.lt = performance.now();
    this.seed = 0;
    // Pre-create DOM elements once (no innerHTML)
    this._divs = {};
    this._ensureElements();
    // FIX #9: Throttle HUD updates to ~10Hz instead of every frame
    this._lastUpdate = 0;
    this._updateInterval = 100; // ms
  }

  _ensureElements() {
    const tags = ['fps', 'pos', 'chunk', 'biome', 'seed', 'break'];
    for (const tag of tags) {
      const div = document.createElement('div');
      div.dataset.role = tag;
      this.el.appendChild(div);
      this._divs[tag] = div;
    }
  }

  setSeed(s) { this.seed = s; }

  update(pos, chunk, biome = '', breakInfo = null) {
    // FPS counter — always runs
    this.fc++;
    const n = performance.now();
    if (n - this.lt >= 1000) { this.fps = this.fc; this.fc = 0; this.lt = n; }

    // FIX #9: Throttle DOM writes to every 100ms
    if (n - this._lastUpdate < this._updateInterval) return;
    this._lastUpdate = n;

    // FIX #9: Use textContent instead of innerHTML — eliminates XSS vector
    this._divs.fps.textContent = `FPS: ${this.fps}`;
    this._divs.pos.textContent = `X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}`;
    this._divs.chunk.textContent = `Chunk: ${chunk.x},${chunk.z}`;
    this._divs.biome.textContent = biome ? `Bioma: ${biome}` : '';
    this._divs.seed.textContent = `Seed: ${this.seed}`;
    if (breakInfo && breakInfo.progress > 0 && breakInfo.time > 0) {
      const pct = Math.min(100, Math.floor((breakInfo.progress / breakInfo.time) * 100));
      this._divs.break.textContent = `Quebrando: ${pct}%`;
    } else {
      this._divs.break.textContent = '';
    }
  }

  hide() { this.el.style.display = 'none'; }
  show() { this.el.style.display = 'block'; }
}
