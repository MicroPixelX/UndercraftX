import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(8, {
  name: 'Bedrock', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#1a1a1a','#252525','#0e0e0e','#303030','#121212'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#080808' : '#383838';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 1+Math.floor(rng()*2), 1+Math.floor(rng()*2));
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
