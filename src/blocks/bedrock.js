import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const t = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, w, h);
  for (let i=0;i<40;i++){const v=Math.floor(Math.random()*50);ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),1+Math.floor(Math.random()*2),1+Math.floor(Math.random()*2));}
});
registerBlock(8, { name: 'Bedrock', solid: true, createMaterials: () => createBlockMaterial(t, t, t) });
