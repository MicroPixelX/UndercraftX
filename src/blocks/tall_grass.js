import * as THREE from 'three';
import { registerBlock, generateTexture } from './Block.js';

registerBlock(17, {
  name: 'Grama Alta', solid: false, transparent: true, opacity: 1.0,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.clearRect(0, 0, w, h);
      const greens = ['#3a7a22','#4a8c2a','#2e6618','#5a9c34','#44882a','#3c7e26'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (x >= 1 && x <= 3 && y >= 4) {
          ctx.fillStyle = greens[Math.floor(rng() * greens.length)];
          ctx.fillRect(x, y, 1, 1);
        }
        if (x >= 12 && x <= 14 && y >= 4) {
          ctx.fillStyle = greens[Math.floor(rng() * greens.length)];
          ctx.fillRect(x, y, 1, 1);
        }
        if (x >= 1 && x <= 14 && y >= 2 && y <= 3) {
          ctx.fillStyle = greens[Math.floor(rng() * greens.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      for (let i = 0; i < 6; i++) {
        const bx = Math.floor(rng() * 14) + 1;
        const by = Math.floor(rng() * 4);
        ctx.fillStyle = rng() > 0.5 ? '#68a840' : '#2a5a14';
        ctx.fillRect(bx, by, 1, 1);
      }
    }),
  },
  createMaterials: (tex) => {
    const mat = new THREE.MeshLambertMaterial({
      map: tex.t, transparent: true, opacity: 1.0,
      side: THREE.DoubleSide, alphaTest: 0.1, depthWrite: true,
    });
    return [mat, mat, mat, mat, mat, mat];
  },
});
