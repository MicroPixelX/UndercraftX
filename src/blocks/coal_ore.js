import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(18, {
  name: 'Carvao', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        const v = 100 + Math.floor(rng() * 60);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 1, 1);
      }
      ctx.strokeStyle = '#606060'; ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        let cx = rng()*w, cy = rng()*h;
        ctx.moveTo(cx, cy);
        for (let j = 0; j < 4; j++) {
          cx += (rng()-0.5)*6; cy += (rng()-0.5)*6;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }
      const coalSpots = 3 + Math.floor(rng() * 4);
      for (let i = 0; i < coalSpots; i++) {
        const sx = Math.floor(rng() * (w-3)) + 1;
        const sy = Math.floor(rng() * (h-3)) + 1;
        const sw = 2 + Math.floor(rng() * 2);
        const sh = 2 + Math.floor(rng() * 2);
        for (let dy = 0; dy < sh; dy++) for (let dx = 0; dx < sw; dx++) {
          ctx.fillStyle = rng() > 0.3 ? '#1a1a1a' : '#2a2a2a';
          ctx.fillRect(sx+dx, sy+dy, 1, 1);
        }
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
