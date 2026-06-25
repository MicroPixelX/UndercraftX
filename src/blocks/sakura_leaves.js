import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(12, {
  name: 'Cerejeira', solid: true, transparent: true, opacity: 0.9,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#ffb7c5','#ff9eb0','#ffc8d4','#e88a9a','#ffd0da','#d07888'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#c06080' : '#ffe0e8';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 1+Math.floor(rng()*2), 1+Math.floor(rng()*2));
      }
      for (let i = 0; i < 5; i++) {
        if (rng() > 0.5) {
          ctx.fillStyle = 'rgba(255,240,248,0.35)';
          ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 2, 1);
        }
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t, { transparent: true, opacity: 0.9, alphaTest: 0.1 }),
});
