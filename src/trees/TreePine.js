import { BlockID } from '../blocks/Block.js';

export class TreePine {
  static get chance() { return 0.006; }
  static get minGround() { return 12; }
  static place(chunk, lx, ly, lz) {
    const h = 5 + Math.floor(Math.random() * 2);
    for (let y = 0; y < h; y++) chunk.setBlock(lx, ly + y, lz, BlockID.PINE_LOG);
    const layers = [{dy:0,r:2},{dy:1,r:2},{dy:2,r:1},{dy:3,r:1},{dy:4,r:0}];
    const baseY = ly + h - 2;
    for (const {dy,r} of layers) {
      const y = baseY + dy;
      for (let dx=-r;dx<=r;dx++) for(let dz=-r;dz<=r;dz++){
        if(Math.abs(dx)===r&&Math.abs(dz)===r) continue;
        const bx=lx+dx,bz=lz+dz;
        if(bx>=0&&bx<16&&bz>=0&&bz<16&&y>=0&&y<256&&chunk.getBlock(bx,y,bz)===BlockID.AIR) chunk.setBlock(bx,y,bz,BlockID.LEAVES);
      }
    }
    if(baseY+5<256) chunk.setBlock(lx,baseY+5,lz,BlockID.LEAVES);
  }
}
