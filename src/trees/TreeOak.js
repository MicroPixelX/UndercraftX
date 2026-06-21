/**
 * TreeOak.js: Carvalho com copa esférica
 *
 * FIX #2: Tighter chunk boundary clamping to prevent cross-chunk clipping
 */

import { BlockID } from '../blocks/Block.js';

export class TreeOak {
  static get chance() { return 0.008; }
  static get minGround() { return 10; }
  static place(chunk, lx, ly, lz, rng = Math.random, _getWorld = null, _bx = 0, _bz = 0) {
    const h = 4 + Math.floor(rng() * 3);
    for (let y = 0; y < h; y++) chunk.setBlock(lx, ly + y, lz, BlockID.OAK_LOG);
    const cy = ly + h;
    const radius = 2 + Math.floor(rng() * 1.5);
    for (let dx = -radius; dx <= radius; dx++)
      for (let dy = -1; dy <= 2; dy++)
        for (let dz = -radius; dz <= radius; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist <= radius + 0.5) {
            const bx = lx + dx, by = cy + dy, bz = lz + dz;
            // FIX #2: Strict chunk boundary check
            if (bx >= 0 && bx < 16 && bz >= 0 && bz < 16 && by >= 0 && by < 256 && chunk.getBlock(bx, by, bz) === BlockID.AIR)
              chunk.setBlock(bx, by, bz, BlockID.LEAVES);
          }
        }
    if (cy + 3 < 256 && lx >= 0 && lx < 16 && lz >= 0 && lz < 16)
      chunk.setBlock(lx, cy + 3, lz, BlockID.LEAVES);
  }
}
