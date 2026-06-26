import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(5, {
  name: 'Folhas', solid: true, transparent: true, opacity: 0.95,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#1a6e1a','#228b22','#2ea02e','#147014','#3ab83a','#0e5a0e'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#0a4a0a' : '#4cc84c';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 1, 1);
      }
      for (let i = 0; i < 8; i++) {
        if (rng() > 0.6) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 1, 1);
        }
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t, { transparent: true, opacity: 0.95, alphaTest: 0.1 }),
});
