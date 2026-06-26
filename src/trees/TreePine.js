/**
 * TreePine.js: Pinheiro com cone de folhas
 *
 * FIX #7: Pine tree leaves no longer OVERLAP the trunk.
 * FIX #2: Tightened chunk boundary checks
 * FIX-S: Removed unused cross-chunk params
 */

import { BlockID } from '../blocks/Block.js';

export class TreePine {
  static get chance() { return 0.006; }
  static get minGround() { return 12; }
  static place(chunk, lx, ly, lz, rng = Math.random) {
    const trunkH = 5 + Math.floor(rng() * 3);

    for (let y = 0; y < trunkH; y++) {
      if (ly + y >= 0 && ly + y < 256)
        chunk.setBlock(lx, ly + y, lz, BlockID.PINE_LOG);
    }

    const leafBaseY = ly + trunkH - 2;
    const leafH = 3 + Math.floor(rng() * 2);

    for (let dy = 0; dy < leafH; dy++) {
      const y = leafBaseY + dy;
      if (y < 0 || y >= 256) continue;
      const r = Math.max(0, 2 - dy);
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && rng() > 0.3) continue;
          const bx = lx + dx, bz = lz + dz;
          if (bx >= 0 && bx < 16 && bz >= 0 && bz < 16) {
            const current = chunk.getBlock(bx, y, bz);
            if (current === BlockID.AIR) {
              chunk.setBlock(bx, y, bz, BlockID.LEAVES);
            }
          }
        }
      }
    }

    const tipY = leafBaseY + leafH;
    if (tipY < 256 && lx >= 0 && lx < 16 && lz >= 0 && lz < 16) {
      if (chunk.getBlock(lx, tipY, lz) === BlockID.AIR)
        chunk.setBlock(lx, tipY, lz, BlockID.LEAVES);
    }
  }
}
