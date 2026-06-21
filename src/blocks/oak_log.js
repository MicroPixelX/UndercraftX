import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const top = generateTexture(16, 16, (ctx, w, h, rng) => {
  ctx.fillStyle = '#b5894e'; ctx.fillRect(0, 0, w, h);
  for (let r=2;r<=6;r+=1){ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.strokeStyle=r%2===0?'#8b6914':'#a07840';ctx.lineWidth=0.8;ctx.stroke();}
});
const side = generateTexture(16, 16, (ctx, w, h, rng) => {
  ctx.fillStyle = '#5c3a1e'; ctx.fillRect(0, 0, w, h);
  for (let x=0;x<w;x++){const s=70+Math.floor(rng()*30);ctx.fillStyle=`rgb(${s},${s-20},${s-40})`;ctx.fillRect(x,0,1,h);}
  for(let i=0;i<4;i++){const y=Math.floor(rng()*h);ctx.strokeStyle='#3a2010';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y+(rng()-0.5)*3);ctx.stroke();}
});
registerBlock(9, { name: 'Carvalho', solid: true, createMaterials: () => createBlockMaterial(top, side, top) });
