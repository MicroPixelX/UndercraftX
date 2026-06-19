import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const t = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#c2b280'; ctx.fillRect(0, 0, w, h);
  for (let i=0;i<50;i++){const v=170+Math.floor(Math.random()*40);ctx.fillStyle=`rgb(${v},${v-20},${v-60})`;ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),1,1);}
});
registerBlock(7, { name: 'Areia', solid: true, createMaterials: () => createBlockMaterial(t, t, t) });
