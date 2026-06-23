// FIX #11: Lazy texture generation — resolved after setTextureSeed() in initBlockTextures()
import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(2, {
  name: 'Terra', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 50; i++) { const r=120+Math.floor(rng()*40); ctx.fillStyle=`rgb(${r},${r-50},${r-100})`; ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),1,1); }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
