// FIX #11: Lazy texture generation — resolved after setTextureSeed() in initBlockTextures()
import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(5, {
  name: 'Folhas', solid: true, transparent: true, opacity: 0.95,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#228b22'; ctx.fillRect(0, 0, w, h);
      for (let i=0;i<80;i++){const g=100+Math.floor(rng()*80);ctx.fillStyle=`rgb(${20+Math.floor(rng()*30)},${g},${15+Math.floor(rng()*20)})`;ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),1+Math.floor(rng()*2),1+Math.floor(rng()*2));}
      for(let i=0;i<15;i++){ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),1,1);}
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t, { transparent: true, opacity: 0.95, alphaTest: 0.1 }),
});
