import * as THREE from 'three';
import { registerBlock, generateTexture } from './Block.js';

registerBlock(16, {
  name: 'Dente-de-leao', solid: false, transparent: true, opacity: 1.0,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#2a6e1a';
      ctx.fillRect(7, 8, 2, 8);
      ctx.fillStyle = '#3a8a28';
      ctx.fillRect(5, 10, 3, 2);
      ctx.fillRect(9, 9, 2, 2);
      const yellows = ['#e0c020','#d0b018','#c8a810','#f0d830'];
      for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 5; dx++) {
        const dist = Math.sqrt((dx-2)**2 + (dy-2)**2);
        if (dist <= 2.5) {
          ctx.fillStyle = yellows[Math.floor(rng() * yellows.length)];
          ctx.fillRect(5+dx, 2+dy, 1, 1);
        }
      }
      ctx.fillStyle = '#a08010';
      ctx.fillRect(6, 4, 3, 2);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#c8a020' : '#f0e040';
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
