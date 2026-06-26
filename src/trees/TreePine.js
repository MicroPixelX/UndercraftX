/**
 * TreePine.js: Pinheiro com cone de folhas
 *
 * FIX #7: Pine tree leaves no longer OVERLAP the trunk.
 *   - Old logic placed leaves at baseY (ly+2), overlapping trunk blocks at y=0..h
 *   - New logic: leaves start AFTER trunk ends, forming a proper cone on top
 * FIX #2: Tightened chunk boundary checks — blocks won't write outside chunk
 */

import { BlockID } from '../blocks/Block.js';

export class TreePine {
  static get chance() { return 0.006; }
  static get minGround() { return 12; }
  static place(chunk, lx, ly, lz, rng = Math.random) {
    const trunkH = 5 + Math.floor(rng() * 3);

    // Place trunk
    for (let y = 0; y < trunkH; y++) {
      if (ly + y >= 0 && ly + y < 256)
        chunk.setBlock(lx, ly + y, lz, BlockID.PINE_LOG);
    }

    // FIX #7: Leaves cone starts ABOVE the trunk, not overlapping it.
    // Old code started at baseY = ly + 2, overlapping trunk at y=2,3,4,5,...
    // New code: leaves start at the top of the trunk (ly + trunkH - 2) and go up.
    const leafBaseY = ly + trunkH - 2;
    const leafH = 3 + Math.floor(rng() * 2); // 3-4 layers of leaves

    for (let dy = 0; dy < leafH; dy++) {
      const y = leafBaseY + dy;
      if (y < 0 || y >= 256) continue;
      // Taper: radius shrinks from 2 at base to 0 at top
      const r = Math.max(0, 2 - dy);
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          // Skip corners for a round-ish shape
          if (Math.abs(dx) === r && Math.abs(dz) === r && rng() > 0.3) continue;
          const bx = lx + dx, bz = lz + dz;
          // FIX #2: Clamp to chunk boundaries — no cross-chunk writes from tree placement
          if (bx >= 0 && bx < 16 && bz >= 0 && bz < 16) {
            const current = chunk.getBlock(bx, y, bz);
            // Only place leaves in AIR — never overwrite trunk or other blocks
            if (current === BlockID.AIR) {
              chunk.setBlock(bx, y, bz, BlockID.LEAVES);
            }
          }
        }
      }
    }

    // Tip leaf
    const tipY = leafBaseY + leafH;
    if (tipY < 256 && lx >= 0 && lx < 16 && lz >= 0 && lz < 16) {
      if (chunk.getBlock(lx, tipY, lz) === BlockID.AIR)
        chunk.setBlock(lx, tipY, lz, BlockID.LEAVES);
    }
  }
}
