import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(14, {
  name: 'Neve', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#f0f5ff','#e8edf8','#f8faff','#dfe6f0','#ffffff'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#d0d8e8' : '#ffffff';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 2+Math.floor(rng()*2), 1);
      }
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = 'rgba(200,210,230,0.25)';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 3, 1);
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
