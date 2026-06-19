import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';
const t = generateTexture(16, 16, (ctx, w, h) => {
  ctx.fillStyle = '#3060c0'; ctx.fillRect(0, 0, w, h);
  for (let i=0;i<30;i++){const b=150+Math.floor(Math.random()*80);ctx.fillStyle=`rgba(50,${b},220,0.5)`;ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),2+Math.floor(Math.random()*3),1);}
  for(let i=0;i<10;i++){ctx.fillStyle='rgba(200,230,255,0.3)';ctx.fillRect(Math.floor(Math.random()*w),Math.floor(Math.random()*h),3,1);}
});
registerBlock(6, { name: 'Água', solid: false, transparent: true, opacity: 0.6, createMaterials: () => createBlockMaterial(t, t, t, { transparent: true, opacity: 0.6 }) });
