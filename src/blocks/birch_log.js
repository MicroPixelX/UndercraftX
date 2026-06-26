import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(11, {
  name: 'Betula', solid: true,
  _lazyTextures: {
    top: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#e8dcc8','#dcd0b8','#f0e4d0','#d0c4a8'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = x - w/2, dy = y - h/2, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 2) ctx.fillStyle = '#b8a888';
        else ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let r = 2; r <= 5; r += 1) {
        ctx.beginPath(); ctx.arc(w/2, h/2, r, 0, Math.PI*2);
        ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 0.5; ctx.stroke();
      }
    }),
    side: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#e8e0d0','#ddd8c8','#f0e8da','#d0c8b8'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 5; i++) {
        const ny = Math.floor(rng()*h), sx = Math.floor(rng()*(w-4));
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(sx, ny, 2+Math.floor(rng()*4), 1);
      }
      for (let x = 0; x < w; x++) {
        if (rng() > 0.7) { ctx.fillStyle = '#b8b0a0'; ctx.fillRect(x, 0, 1, h); }
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.top, tex.side, tex.top),
});
