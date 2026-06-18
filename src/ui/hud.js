/**
 * HUD: crosshair, info de debug
 */

export class HUD {
  constructor() {
    this.hudElement = document.getElementById('hud');
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
  }

  /**
   * Atualiza info de FPS e posição
   */
  update(playerPosition, chunkCoords) {
    // FPS counter
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }

    // Info
    const p = playerPosition;
    this.hudElement.innerHTML = `
      <div>FPS: ${this.fps}</div>
      <div>X: ${Math.floor(p.x)} Y: ${Math.floor(p.y)} Z: ${Math.floor(p.z)}</div>
      <div>Chunk: ${chunkCoords.x}, ${chunkCoords.z}</div>
    `;
  }

  /**
   * Esconde HUD
   */
  hide() {
    this.hudElement.style.display = 'none';
  }

  /**
   * Mostra HUD
   */
  show() {
    this.hudElement.style.display = 'block';
  }
}