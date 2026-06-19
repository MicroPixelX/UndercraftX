import { BlockID } from '../blocks/Block.js';

export class TreeOak {
  static get chance() { return 0.008; }
  static get minGround() { return 10; }
  static place(chunk, lx, ly, lz) {
    const h = 4 + Math.floor(Math.random() * 2);
    for (let y = 0; y < h; y++) chunk.setBlock(lx, ly + y, lz, BlockID.OAK_LOG);
    const cy = ly + h;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) {
      if (Math.sqrt(dx*dx+dy*dy+dz*dz) <= 2.5) {
        const bx=lx+dx,by=cy+dy,bz=lz+dz;
        if (bx>=0&&bx<16&&bz>=0&&bz<16&&by>=0&&by<256&&chunk.getBlock(bx,by,bz)===BlockID.AIR) chunk.setBlock(bx,by,bz,BlockID.LEAVES);
      }
    }
    if (cy+3<256) chunk.setBlock(lx,cy+3,lz,BlockID.LEAVES);
  }
}
