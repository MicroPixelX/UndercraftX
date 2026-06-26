import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(2, {
  name: 'Terra', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#8b5e3c','#7a4e2c','#9a6e4c','#6e4224','#a07850'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#5a3418';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 2, 1);
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
