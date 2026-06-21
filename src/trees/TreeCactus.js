/**
 * TreeCactus.js: Cacto do deserto
 *
 * FIX #2: Chunk boundary clamping
 */

import { BlockID } from '../blocks/Block.js';

export class TreeCactus {
  static get chance() { return 0.004; }
  static get minGround() { return 8; }
  static place(chunk, lx, ly, lz, rng = Math.random, _getWorld = null, _bx = 0, _bz = 0) {
    const h = 2 + Math.floor(rng() * 3);
    for (let y = 0; y < h; y++) chunk.setBlock(lx, ly + y, lz, BlockID.CACTUS);
    // Arm
    if (rng() > 0.5) {
      const dir = rng() > 0.5 ? 1 : -1;
      const useZ = rng() > 0.5;
      const ay = ly + Math.floor(h / 2);
      if (useZ) {
        const bz = lz + dir;
        // FIX #2: Chunk boundary check
        if (bz >= 0 && bz < 16) {
          chunk.setBlock(lx, ay, bz, BlockID.CACTUS);
          if (ay + 1 < 256) chunk.setBlock(lx, ay + 1, bz, BlockID.CACTUS);
        }
      } else {
        const bx = lx + dir;
        // FIX #2: Chunk boundary check
        if (bx >= 0 && bx < 16) {
          chunk.setBlock(bx, ay, lz, BlockID.CACTUS);
          if (ay + 1 < 256) chunk.setBlock(bx, ay + 1, lz, BlockID.CACTUS);
        }
      }
    }
  }
}
