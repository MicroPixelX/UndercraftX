export class WorldBuilder {
  constructor(scene, renderer, camera) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
  }

  buildAsync(game, loadingBar, onDone) {
    const getNeighbor = (gx, gy, gz) => game.getNeighborBlock(gx, gy, gz);
    const dirtyChunks = [];

    for (const [, ch] of game.chunks) {
      if (ch.dirty) dirtyChunks.push(ch);
    }

    if (dirtyChunks.length === 0) {
      onDone();
      return;
    }

    let built = 0;
    let idx = 0;
    const batchSize = 3;

    const step = () => {
      const end = Math.min(idx + batchSize, dirtyChunks.length);
      for (let i = idx; i < end; i++) {
        dirtyChunks[i].buildMesh(this.scene, getNeighbor);
        built++;
      }
      idx = end;

      const pct = Math.floor((built / dirtyChunks.length) * 100);
      loadingBar.show(pct, `Construindo mundo... ${built}/${dirtyChunks.length}`);

      this.renderer.updateSky(this.camera.position);
      this.renderer.render();

      if (idx < dirtyChunks.length) {
        requestAnimationFrame(step);
      } else {
        onDone();
      }
    };

    requestAnimationFrame(step);
  }
}
