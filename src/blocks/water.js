// FIX #11: Lazy texture generation — resolved after setTextureSeed() in initBlockTextures()
import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(6, {
  name: 'Agua', solid: false, transparent: true, opacity: 0.6,
  _lazyTextures: {
    t: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#3060c0'; ctx.fillRect(0, 0, w, h);
      for (let i=0;i<30;i++){const b=150+Math.floor(rng()*80);ctx.fillStyle=`rgba(50,${b},220,0.5)`;ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),2+Math.floor(rng()*3),1);}
      for(let i=0;i<10;i++){ctx.fillStyle='rgba(200,230,255,0.3)';ctx.fillRect(Math.floor(rng()*w),Math.floor(rng()*h),3,1);}
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.t, tex.t, tex.t, { transparent: true, opacity: 0.6 }),
});
