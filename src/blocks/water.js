import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(6, {
  name: 'Agua', solid: false, transparent: true, opacity: 0.6,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#2a50b0','#3060c0','#3870d0','#2050a0'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 6; i++) {
        const wy = Math.floor(rng()*h);
        const sx = Math.floor(rng()*(w-3));
        ctx.fillStyle = `rgba(80,${160+Math.floor(rng()*60)},240,0.4)`;
        ctx.fillRect(sx, wy, 2+Math.floor(rng()*3), 1);
      }
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = 'rgba(180,220,255,0.25)';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 3, 1);
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t, { transparent: true, opacity: 0.6 }),
});
