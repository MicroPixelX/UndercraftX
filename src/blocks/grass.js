import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(1, {
  name: 'Grama', solid: true,
  _lazyTextures: {
    top: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#4a8c2a'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const shade = rng();
        if (shade < 0.3) { ctx.fillStyle = '#3d7a22'; ctx.fillRect(x, y, 1, 1); }
        else if (shade < 0.5) { ctx.fillStyle = '#5a9c34'; ctx.fillRect(x, y, 1, 1); }
        else if (shade < 0.6) { ctx.fillStyle = '#68a840'; ctx.fillRect(x, y, 1, 1); }
      }
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#2e6618' : '#76b44e';
        ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 1, 1);
      }
    }),
    side: generateTexture(16, 16, (ctx, w, h, rng) => {
      for (let y = 0; y < 3; y++) for (let x = 0; x < w; x++) {
        const shade = rng();
        if (shade < 0.35) ctx.fillStyle = '#4a8c2a';
        else if (shade < 0.6) ctx.fillStyle = '#3d7a22';
        else ctx.fillStyle = '#5a9c34';
        ctx.fillRect(x, y, 1, 1);
      }
      for (let y = 3; y < 5; y++) for (let x = 0; x < w; x++) {
        ctx.fillStyle = rng() > 0.45 ? '#4a8c2a' : '#8b5e3c';
        ctx.fillRect(x, y, 1, 1);
      }
      for (let y = 5; y < h; y++) for (let x = 0; x < w; x++) {
        const shade = rng();
        if (shade < 0.3) ctx.fillStyle = '#8b5e3c';
        else if (shade < 0.55) ctx.fillStyle = '#7a4e2c';
        else if (shade < 0.8) ctx.fillStyle = '#9a6e4c';
        else ctx.fillStyle = '#6e4224';
        ctx.fillRect(x, y, 1, 1);
      }
    }),
    bottom: generateTexture(16, 16, (ctx, w, h, rng) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const shade = rng();
        if (shade < 0.3) ctx.fillStyle = '#8b5e3c';
        else if (shade < 0.55) ctx.fillStyle = '#7a4e2c';
        else if (shade < 0.8) ctx.fillStyle = '#9a6e4c';
        else ctx.fillStyle = '#6e4224';
        ctx.fillRect(x, y, 1, 1);
      }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.top, tex.side, tex.bottom),
});
