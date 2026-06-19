import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const t = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 50; i++) { const r=120+Math.floor(Math.random()*40); ctx.fillStyle=`rgb(${r},${r-50},${r-100})`; ctx.fillRect(Math.floor(Math.random()*w), Math.floor(Math.random()*h),1,1); }
});
registerBlock(2, { name: 'Terra', solid: true, createMaterials: () => createBlockMaterial(t, t, t) });
