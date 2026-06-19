import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const t = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#228b22'; ctx.fillRect(0, 0, w, h);
  for (let i=0;i<80;i++){const g=100+Math.floor(Math.random()*80);ctx.fillStyle=`rgb(${20+Math.floor(Math.random()*30)},${g},${15+Math.floor(Math.random()*20)})`;ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),1+Math.floor(Math.random()*2),1+Math.floor(Math.random()*2));}
  for(let i=0;i<15;i++){ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),1,1);}
});
registerBlock(5, { name: 'Folhas', solid: true, transparent: true, opacity: 0.95, createMaterials: () => createBlockMaterial(t, t, t, { transparent: true, opacity: 0.95, alphaTest: 0.1 }) });
