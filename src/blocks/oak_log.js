import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(9, {
  name: 'Carvalho', solid: true,
  _lazyTextures: {
    top: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#b5894e','#a07840','#c0985e','#907030'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = x - w/2, dy = y - h/2, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 2) ctx.fillStyle = '#6a4a20';
        else ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let r = 2; r <= 5; r += 1) {
        ctx.beginPath(); ctx.arc(w/2, h/2, r, 0, Math.PI*2);
        ctx.strokeStyle = r%2 === 0 ? '#6a4a20' : '#8b6914';
        ctx.lineWidth = 0.8; ctx.stroke();
      }
    }),
    side: generateTexture(16, 16, (ctx, w, h, rng) => {
      const base = ['#5c3a1e','#4e3018','#6a4a28','#3e2810'];
      for (let x = 0; x < w; x++) {
        const colBase = base[Math.floor(rng() * base.length)];
        for (let y = 0; y < h; y++) {
          ctx.fillStyle = colBase;
          ctx.fillRect(x, y, 1, 1);
          if (rng() < 0.2) {
            ctx.fillStyle = rng() > 0.5 ? '#3a2010' : '#7a5a30';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      for (let i = 0; i < 3; i++) {
        const ky = Math.floor(rng()*h);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(0, ky, w, 1);
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.top, tex.side, tex.top),
});
