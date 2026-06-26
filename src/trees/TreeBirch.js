/**
 * TreeBirch.js: Bétula com copa pequena
 *
 * FIX #2: Chunk boundary clamping
 */

import { BlockID } from '../blocks/Block.js';

export class TreeBirch {
  static get chance() { return 0.005; }
  static get minGround() { return 10; }
  static place(chunk, lx, ly, lz, rng = Math.random) {
    const h = 5 + Math.floor(rng() * 3);
    for (let y = 0; y < h; y++) chunk.setBlock(lx, ly + y, lz, BlockID.BIRCH_LOG);
    const cy = ly + h;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 2; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          if (dy === 2 && (Math.abs(dx) + Math.abs(dz)) > 0) continue;
          if (dy === -1 && (Math.abs(dx) + Math.abs(dz)) > 1) continue;
          const bx = lx + dx, by = cy + dy, bz = lz + dz;
          // FIX #2: Strict chunk boundary check
          if (bx >= 0 && bx < 16 && bz >= 0 && bz < 16 && by >= 0 && by < 256 && chunk.getBlock(bx, by, bz) === BlockID.AIR)
            chunk.setBlock(bx, by, bz, BlockID.LEAVES);
        }
  }
}
