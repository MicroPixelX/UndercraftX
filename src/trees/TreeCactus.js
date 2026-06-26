/**
 * TreeCactus.js: Cacto do deserto
 *
 * FIXES:
 *  - #2: Chunk boundary clamping
 *  - FIX-I: Cactus now checks if target block is AIR before placing,
 *           preventing overwrite of existing blocks (tree trunks, other cacti, etc.)
 */

import { BlockID } from '../blocks/Block.js';

export class TreeCactus {
  static get chance() { return 0.004; }
  static get minGround() { return 8; }
  static place(chunk, lx, ly, lz, rng = Math.random) {
    const h = 2 + Math.floor(rng() * 3);
    // FIX-I: Check AIR before placing trunk blocks
    for (let y = 0; y < h; y++) {
      if (ly + y >= 0 && ly + y < 256 && chunk.getBlock(lx, ly + y, lz) === BlockID.AIR)
        chunk.setBlock(lx, ly + y, lz, BlockID.CACTUS);
    }
    // Arm
    if (rng() > 0.5) {
      const dir = rng() > 0.5 ? 1 : -1;
      const useZ = rng() > 0.5;
      const ay = ly + Math.floor(h / 2);
      if (useZ) {
        const bz = lz + dir;
        // #2: Chunk boundary check + FIX-I: AIR check
        if (bz >= 0 && bz < 16 && ay < 256 && chunk.getBlock(lx, ay, bz) === BlockID.AIR) {
          chunk.setBlock(lx, ay, bz, BlockID.CACTUS);
          if (ay + 1 < 256 && chunk.getBlock(lx, ay + 1, bz) === BlockID.AIR)
            chunk.setBlock(lx, ay + 1, bz, BlockID.CACTUS);
        }
      } else {
        const bx = lx + dir;
        // #2: Chunk boundary check + FIX-I: AIR check
        if (bx >= 0 && bx < 16 && ay < 256 && chunk.getBlock(bx, ay, lz) === BlockID.AIR) {
          chunk.setBlock(bx, ay, lz, BlockID.CACTUS);
          if (ay + 1 < 256 && chunk.getBlock(bx, ay + 1, lz) === BlockID.AIR)
            chunk.setBlock(bx, ay + 1, lz, BlockID.CACTUS);
        }
      }
    }
  }
}
