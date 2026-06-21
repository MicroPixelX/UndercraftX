import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const top = generateTexture(16, 16, (ctx, w, h, rng) => {
  ctx.fillStyle = '#2d6b1e'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3a8a28'; ctx.beginPath(); ctx.arc(w/2,h/2,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#8a7a30'; ctx.fillRect(7,0,2,h); ctx.fillRect(0,7,w,2);
});
const side = generateTexture(16, 16, (ctx, w, h, rng) => {
  ctx.fillStyle = '#2d6b1e'; ctx.fillRect(0, 0, w, h);
  for (let x=2;x<w;x+=4){ctx.fillStyle='#1a5010';ctx.fillRect(x,0,1,h);ctx.fillStyle='#3a8a28';ctx.fillRect(x+1,0,1,h);}
  for(let y=0;y<h;y+=3)if(rng()>0.4){const x=rng()>0.5?w-1:0;ctx.fillStyle='#c0a040';ctx.fillRect(x,y,1,1);}
});
registerBlock(13, { name: 'Cacto', solid: true, createMaterials: () => createBlockMaterial(top, side, side) });
