import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const t = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#ffb7c5'; ctx.fillRect(0, 0, w, h);
  for (let i=0;i<60;i++){const r=200+Math.floor(Math.random()*55),g=140+Math.floor(Math.random()*60);ctx.fillStyle=`rgb(${r},${g},${180+Math.floor(Math.random()*40)})`;ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),1+Math.floor(Math.random()*2),1+Math.floor(Math.random()*2));}
  for(let i=0;i<12;i++){ctx.fillStyle='rgba(255,230,240,0.4)';ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),2,1);}
});
registerBlock(12, { name: 'Cerejeira', solid: true, transparent: true, opacity: 0.9, createMaterials: () => createBlockMaterial(t, t, t, { transparent: true, opacity: 0.9, alphaTest: 0.1 }) });
