// FIX #11: Textures are now registered as lazy descriptors and resolved in
// initBlockTextures() AFTER setTextureSeed() — making them truly seed-deterministic.
import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(1, {
  name: 'Grama', solid: true,
  _lazyTextures: {
    top:    generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#5da32e'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgb(60,${140+Math.floor(rng()*80)},30)`; ctx.fillRect(Math.floor(rng()*w), Math.floor(rng()*h), 1, 1); }
    }),
    side:   generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) { const r=120+Math.floor(rng()*40); ctx.fillStyle=`rgb(${r},${r-50},${r-100})`; ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),1,1); }
      ctx.fillStyle = '#5da32e'; ctx.fillRect(0, 0, w, 3);
      for (let y=3;y<5;y++) for(let x=0;x<w;x++) if(rng()>0.5){ctx.fillStyle='#5da32e';ctx.fillRect(x,y,1,1);}
    }),
    bottom: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { const r=120+Math.floor(rng()*40); ctx.fillStyle=`rgb(${r},${r-50},${r-100})`; ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),1,1); }
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.top, tex.side, tex.bottom),
});
