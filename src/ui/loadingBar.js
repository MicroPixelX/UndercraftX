export class LoadingBar {
  constructor() {
    this.bar = document.getElementById('loading-bar');
    this.fill = document.getElementById('loading-fill');
    this.text = document.getElementById('loading-text');
  }

  show(pct, msg) {
    if (this.bar) this.bar.style.display = 'flex';
    if (this.fill) this.fill.style.width = `${pct}%`;
    if (this.text) this.text.textContent = msg;
  }

  hide() {
    if (this.bar) this.bar.style.display = 'none';
  }
}
