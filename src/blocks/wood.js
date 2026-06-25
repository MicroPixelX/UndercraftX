import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(4, {
  name: 'Madeira', solid: true,
  _lazyTextures: {
    top: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#b5894e'; ctx.fillRect(0, 0, w, h);
      for (let r = 2; r <= 6; r += 2) {
        ctx.beginPath(); ctx.arc(w/2, h/2, r, 0, Math.PI*2);
        ctx.strokeStyle = r%4 === 0 ? '#8b6914' : '#a07840';
        ctx.lineWidth = 1; ctx.stroke();
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (rng() < 0.15) {
          ctx.fillStyle = rng() > 0.5 ? '#9a7030' : '#c0985e';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }),
    side: generateTexture(16, 16, (ctx, w, h, rng) => {
      const dark = '#7a5a0c', mid = '#8b6914', light = '#a07a2e';
      for (let y = 0; y < h; y++) {
        const baseShade = rng() > 0.5 ? mid : light;
        for (let x = 0; x < w; x++) {
          ctx.fillStyle = baseShade;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      for (let x = 0; x < w; x += 3) {
        for (let y = 0; y < h; y++) {
          if (rng() > 0.6) { ctx.fillStyle = dark; ctx.fillRect(x, y, 1, 1); }
        }
      }
      for (let i = 0; i < 3; i++) {
        const knotY = Math.floor(rng() * h);
        ctx.fillStyle = '#5a3e08';
        ctx.fillRect(Math.floor(rng()*w-1), knotY, 2, 1);
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.top, tex.side, tex.side),
});
