import { BlockID } from '../blocks/Block.js';

export class TreePine {
  static get chance() { return 0.006; }
  static get minGround() { return 12; }
  static place(chunk, lx, ly, lz, rng = Math.random) {
    const h = 5 + Math.floor(rng() * 3);
    for (let y = 0; y < h; y++) chunk.setBlock(lx, ly + y, lz, BlockID.PINE_LOG);
    // Cone de folhas do pinheiro
    const baseY = ly + 2;
    for (let dy = 0; dy < h; dy++) {
      const y = baseY + dy;
      const r = Math.max(0, 3 - Math.floor(dy * 0.7));
      for (let dx = -r; dx <= r; dx++)
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && rng() > 0.3) continue;
          const bx = lx + dx, bz = lz + dz;
          if (bx >= 0 && bx < 16 && bz >= 0 && bz < 16 && y >= 0 && y < 256 && chunk.getBlock(bx, y, bz) === BlockID.AIR)
            chunk.setBlock(bx, y, bz, BlockID.LEAVES);
        }
    }
    // Topo
    const tipY = baseY + h;
    if (tipY < 256) chunk.setBlock(lx, tipY, lz, BlockID.LEAVES);
  }
}
