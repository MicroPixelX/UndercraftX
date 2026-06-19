import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const top = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#b5894e'; ctx.fillRect(0, 0, w, h);
  for (let r=2;r<=6;r+=2){ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.strokeStyle=r%4===0?'#8b6914':'#a07840';ctx.lineWidth=1;ctx.stroke();}
});
const side = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#8b6914'; ctx.fillRect(0, 0, w, h);
  for (let x=0;x<w;x+=3){ctx.strokeStyle=`rgb(${130+Math.floor(Math.random()*30)},${90+Math.floor(Math.random()*20)},15)`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+(Math.random()-0.5)*2,h);ctx.stroke();}
});
registerBlock(4, { name: 'Madeira', solid: true, createMaterials: () => createBlockMaterial(top, side, side) });
