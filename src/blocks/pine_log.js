import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(10, {
  name: 'Pinheiro', solid: true,
  _lazyTextures: {
    top: generateTexture(16, 16, (ctx, w, h, rng) => {
      const palette = ['#a87840','#966830','#b88848','#805828'];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = x - w/2, dy = y - h/2, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 2) ctx.fillStyle = '#5a3a18';
        else ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
      for (let r = 1; r <= 5; r += 1) {
        ctx.beginPath(); ctx.arc(w/2, h/2, r, 0, Math.PI*2);
        ctx.strokeStyle = r%2 === 0 ? '#5a3a18' : '#7a4a20';
        ctx.lineWidth = 0.6; ctx.stroke();
      }
    }),
    side: generateTexture(16, 16, (ctx, w, h, rng) => {
      const base = ['#6b3a1a','#5a2e14','#7a4a24','#4e2210'];
      for (let x = 0; x < w; x++) {
        const colBase = base[Math.floor(rng() * base.length)];
        for (let y = 0; y < h; y++) {
          ctx.fillStyle = colBase;
          ctx.fillRect(x, y, 1, 1);
          if (rng() < 0.2) {
            ctx.fillStyle = rng() > 0.5 ? '#3a1808' : '#8a5830';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      for (let i = 0; i < 2; i++) {
        const nx = Math.floor(rng()*(w-3))+2, ny = Math.floor(rng()*h);
        ctx.fillStyle = '#3e1a08';
        ctx.fillRect(nx, ny, 2, 2);
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.top, tex.side, tex.top),
});
