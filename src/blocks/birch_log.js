// FIX #11: Lazy texture generation — resolved after setTextureSeed() in initBlockTextures()
import { registerBlock, generateTexture, createBlockMaterial } from './Block.js';

registerBlock(11, {
  name: 'Betula', solid: true,
  _lazyTextures: {
    top:  generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#e8dcc8'; ctx.fillRect(0, 0, w, h);
      for (let r=2;r<=5;r+=1){ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.strokeStyle='#c8b898';ctx.lineWidth=0.5;ctx.stroke();}
    }),
    side: generateTexture(16, 16, (ctx, w, h, rng) => {
      ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 0, w, h);
      for(let i=0;i<6;i++){const y=Math.floor(rng()*h),sx=Math.floor(rng()*(w-5));ctx.fillStyle='#4a3828';ctx.fillRect(sx,y,3+Math.floor(rng()*5),1);}
      for(let x=0;x<w;x++)if(rng()>0.7){ctx.fillStyle='rgba(180,170,150,0.5)';ctx.fillRect(x,0,1,h);}
    }),
  },
  createMaterials: (tex) => createBlockMaterial(tex.top, tex.side, tex.top),
});
