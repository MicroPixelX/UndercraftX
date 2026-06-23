// FIX #11: Lazy texture generation — resolved after setTextureSeed() in initBlockTextures()
import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(14, {
  name: 'Neve', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#f0f5ff'; ctx.fillRect(0, 0, w, h);
      for (let i=0;i<40;i++){const v=230+Math.floor(rng()*25);ctx.fillStyle=`rgb(${v},${v},${v+5})`;ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),1,1);}
      for(let i=0;i<10;i++){ctx.fillStyle='rgba(200,210,230,0.3)';ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),2,1);}
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
