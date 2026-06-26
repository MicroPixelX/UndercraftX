import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(13, {
  name: 'Cacto', solid: true,
  _lazyTextures: {
    top: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#2d6b1e','#388028','#1a5810','#247018'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.fillStyle = '#3a8a28'; ctx.beginPath(); ctx.arc(w/2, h/2, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8a7a30'; ctx.fillRect(7, 0, 2, h); ctx.fillRect(0, 7, w, 2);
    }),
    side: generateTexture(16, 16, (ctx, w, h, rng) => {
      const dark = '#1a5010', mid = '#2d6b1e', light = '#3a8a28';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = mid; ctx.fillRect(x, y, 1, 1);
      }
      for (let x = 2; x < w; x += 4) {
        for (let y = 0; y < h; y++) {
          ctx.fillStyle = dark; ctx.fillRect(x, y, 1, 1);
          if (x+1 < w) { ctx.fillStyle = light; ctx.fillRect(x+1, y, 1, 1); }
        }
      }
      for (let y = 0; y < h; y += 3) {
        if (rng() > 0.4) {
          const x = rng() > 0.5 ? w-1 : 0;
          ctx.fillStyle = '#c0a040';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.top, tex.side, tex.side),
});
