import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const top = generateTexture(16, 16, (ctx, w, h, rng) => {
  ctx.fillStyle = '#a87840'; ctx.fillRect(0, 0, w, h);
  for (let r=1;r<=5;r+=1){ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.strokeStyle=r%2===0?'#7a4a20':'#905830';ctx.lineWidth=0.6;ctx.stroke();}
});
const side = generateTexture(16, 16, (ctx, w, h, rng) => {
  ctx.fillStyle = '#6b3a1a'; ctx.fillRect(0, 0, w, h);
  for (let x=0;x<w;x++){const r=90+Math.floor(rng()*30);ctx.fillStyle=`rgb(${r},${50+Math.floor(rng()*20)},15)`;ctx.fillRect(x,0,1,h);}
  for(let i=0;i<2;i++){const nx=Math.floor(rng()*(w-4))+2,ny=Math.floor(rng()*h);ctx.fillStyle='#4a2010';ctx.beginPath();ctx.arc(nx,ny,1.5,0,Math.PI*2);ctx.fill();}
});
registerBlock(10, { name: 'Pinheiro', solid: true, createMaterials: () => createBlockMaterial(top, side, top) });
