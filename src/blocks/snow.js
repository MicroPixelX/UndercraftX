import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const t = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#f0f5ff'; ctx.fillRect(0, 0, w, h);
  for (let i=0;i<40;i++){const v=230+Math.floor(Math.random()*25);ctx.fillStyle=`rgb(${v},${v},${v+5})`;ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),1,1);}
  for(let i=0;i<10;i++){ctx.fillStyle='rgba(200,210,230,0.3)';ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),2,1);}
});
registerBlock(14, { name: 'Neve', solid: true, createMaterials: () => createBlockMaterial(t, t, t) });
