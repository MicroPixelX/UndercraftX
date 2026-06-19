import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const t = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { const v=100+Math.floor(Math.random()*60); ctx.fillStyle=`rgb(${v},${v},${v})`; ctx.fillRect(Math.floor(Math.random()*w), Math.floor(Math.random()*h),1,1); }
  ctx.strokeStyle = '#606060'; ctx.lineWidth = 0.5;
  for (let i=0;i<3;i++){ctx.beginPath();let cx=Math.random()*w,cy=Math.random()*h;ctx.moveTo(cx,cy);for(let j=0;j<4;j++){cx+=(Math.random()-0.5)*6;cy+=(Math.random()-0.5)*6;ctx.lineTo(cx,cy);}ctx.stroke();}
});
registerBlock(3, { name: 'Pedra', solid: true, createMaterials: () => createBlockMaterial(t, t, t) });
