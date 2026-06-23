// FIX #11: Lazy texture generation — resolved after setTextureSeed() in initBlockTextures()
import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(8, {
  name: 'Bedrock', solid: true,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, w, h);
      for (let i=0;i<40;i++){const v=Math.floor(rng()*50);ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),1+Math.floor(rng()*2),1+Math.floor(rng()*2));}
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t),
});
