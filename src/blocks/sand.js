import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(7, {
  name: 'Areia', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#c8b888','#d0c090','#b8a878','#dcc898','#b09868'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#a08858' : '#e8d8a8';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 1+Math.floor(rng()*2), 1);
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
