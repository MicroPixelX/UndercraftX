import { BlockID } from '../blocks/Block.js';

export class TreeSakura {
  static get chance() { return 0.003; }
  static get minGround() { return 10; }
  static place(chunk, lx, ly, lz) {
    const h = 4 + Math.floor(Math.random() * 2);
    for (let y = 0; y < h; y++) chunk.setBlock(lx, ly + y, lz, BlockID.OAK_LOG);
    const branchY = ly + h - 1;
    for (const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      if(Math.random()>0.5){const bx=lx+dx,bz=lz+dz;if(bx>=0&&bx<16&&bz>=0&&bz<16) chunk.setBlock(bx,branchY,bz,BlockID.OAK_LOG);}
    }
    const cy = ly + h;
    for (let dx=-2;dx<=2;dx++) for(let dy=0;dy<=2;dy++) for(let dz=-2;dz<=2;dz++){
      if(Math.sqrt(dx*dx+dy*dy+dz*dz)<=2.2){
        const bx=lx+dx,by=cy+dy,bz=lz+dz;
        if(bx>=0&&bx<16&&bz>=0&&bz<16&&by>=0&&by<256&&chunk.getBlock(bx,by,bz)===BlockID.AIR) chunk.setBlock(bx,by,bz,BlockID.SAKURA_LEAVES);
      }
    }
  }
}
