/**
 * Geração de terreno procedural usando Perlin Noise
 */

import { BlockType } from './block-types.js';

// Simplex noise simples (implementação enxuta)
class SimplexNoise {
  constructor(seed = 0) {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    
    // Shuffle com seed
    let n = seed;
    for (let i = 255; i > 0; i--) {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const j = n % (i + 1);
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  noise2D(x, y) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      const gi0 = this.perm[ii + this.perm[jj]] % 12;
      n0 = t0 * t0 * this.dot2(gi0, x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
      n1 = t1 * t1 * this.dot2(gi1, x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
      n2 = t2 * t2 * this.dot2(gi2, x2, y2);
    }

    return 70 * (n0 + n1 + n2);
  }

  dot2(gi, x, y) {
    const grad3 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, 1], [1, -1], [-1, -1]
    ];
    return grad3[gi][0] * x + grad3[gi][1] * y;
  }

  noise3D(x, y, z) {
    // Combina 2D noise em camadas
    return (this.noise2D(x, z) + this.noise2D(y, z + x)) / 2;
  }
}

export class TerrainGenerator {
  constructor(seed = 12345) {
    this.noise = new SimplexNoise(seed);
    this.seaLevel = 8;     // Nível do mar
    this.heightScale = 16; // Variação máxima de altura
  }

  /**
   * Obtém altura do terreno num ponto 2D
   */
  getHeight(worldX, worldZ) {
    const scale = 0.05;
    const n = this.noise.noise2D(worldX * scale, worldZ * scale);
    const hills = this.noise.noise2D(worldX * scale * 2, worldZ * scale * 2) * 0.5;
    return Math.floor(this.seaLevel + (n + hills) * this.heightScale);
  }

  /**
   * Gera tipo de bloco numa posição
   */
  getBlockAt(worldX, worldY, worldZ) {
    const groundHeight = this.getHeight(worldX, worldZ);

    // Abaixo do chão: pedra (ou bedrock no fundo)
    if (worldY < groundHeight - 4) {
      return worldY === 0 ? BlockType.BEDROCK : BlockType.STONE;
    }

    // Camada do solo (1 bloco abaixo da superfície)
    if (worldY < groundHeight) {
      return BlockType.DIRT;
    }

    // Superfície
    if (worldY === groundHeight) {
      // Grama cima, areia na água
      if (worldY <= this.seaLevel + 1) {
        return BlockType.SAND;
      }
      return BlockType.GRASS;
    }

    // Entre superfície e nível do mar: água
    if (worldY <= this.seaLevel) {
      return BlockType.WATER;
    }

    return BlockType.AIR;
  }

  /**
   * Gera chunk com terreno
   */
  generateChunk(chunk) {
    const baseX = chunk.chunkX * 16;
    const baseZ = chunk.chunkZ * 16;

    for (let lx = 0; lx < 16; lx++) {
      for (let lz = 0; lz < 16; lz++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;
        const groundHeight = this.getHeight(wx, wz);

        for (let ly = 0; ly < 16; ly++) {
          const wy = chunk.chunkY * 16 + ly;
          const blockType = this.getBlockAt(wx, wy, wz);
          chunk.setBlock(lx, ly, lz, blockType);
        }
      }
    }
  }
}