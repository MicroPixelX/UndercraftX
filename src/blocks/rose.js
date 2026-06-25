import * as THREE from 'three';
import { registerBlock, generateTexture } from './Block.js';

registerBlock(15, {
  name: 'Rosa', solid: false, transparent: true, opacity: 1.0,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.clearRect(0, 0, w, h);
      const stem = '#2a6e1a';
      const reds = ['#cc1a1a','#e02020','#b01515','#dd2828','#aa1010'];
      ctx.fillStyle = stem;
      ctx.fillRect(7, 8, 2, 8);
      ctx.fillStyle = '#3a8a28';
      ctx.fillRect(5, 9, 3, 2);
      ctx.fillRect(8, 11, 3, 2);
      for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 5; dx++) {
        const dist = Math.sqrt((dx-2)**2 + (dy-2)**2);
        if (dist <= 2.5) {
          ctx.fillStyle = reds[Math.floor(rng() * reds.length)];
          ctx.fillRect(5+dx, 2+dy, 1, 1);
        }
      }
      ctx.fillStyle = '#ffe040';
      ctx.fillRect(6, 4, 3, 3);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#ee3030' : '#ff4040';
        ctx.fillRect(5+Math.floor(rng()*5), 2+Math.floor(rng()*5), 1, 1);
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
