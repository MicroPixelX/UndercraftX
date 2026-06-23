// FIX #11: Lazy texture generation — resolved after setTextureSeed() in initBlockTextures()
import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(7, {
  name: 'Areia', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#c2b280'; ctx.fillRect(0, 0, w, h);
      for (let i=0;i<50;i++){const v=170+Math.floor(rng()*40);ctx.fillStyle=`rgb(${v},${v-20},${v-60})`;ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),1,1);}
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
