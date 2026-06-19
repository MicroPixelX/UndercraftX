import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

const top = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#5da32e'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgb(60,${140+Math.floor(Math.random()*80)},30)`; ctx.fillRect(Math.floor(Math.random()*w), Math.floor(Math.random()*h), 1, 1); }
});
const side = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) { const r=120+Math.floor(Math.random()*40); ctx.fillStyle=`rgb(${r},${r-50},${r-100})`; ctx.fillRect(Math.floor(Math.random()*w), Math.floor(Math.random()*h),1,1); }
  ctx.fillStyle = '#5da32e'; ctx.fillRect(0, 0, w, 3);
  for (let y=3;y<5;y++) for(let x=0;x<w;x++) if(Math.random()>0.5){ctx.fillStyle='#5da32e';ctx.fillRect(x,y,1,1);}
});
const bottom = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { const r=120+Math.floor(Math.random()*40); ctx.fillStyle=`rgb(${r},${r-50},${r-100})`; ctx.fillRect(Math.floor(Math.random()*w), Math.floor(Math.random()*h),1,1); }
});
registerBlock(1, { name: 'Grama', solid: true, createMaterials: () => createBlockMaterial(top, side, bottom) });
