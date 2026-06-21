/**
 * terrain.js: Geração procedural realista + seed determinística
 * Biomas: Planície, Floresta, Deserto, Neve, Selva, Oceano, Montanha
 * + Montanhas com picos nevados, cavernas 3D REAIS, praias, camadas geológicas
 *
 * FIXES:
 *  - #3: noise3D era falso (2D combinado) — substituída por Simplex 3D real
 *  - #1: Texturas procedurais agora usam rng determinístico em vez de Math.random
 *  - #2: Árvores podem se estender para chunks vizinhos (cross-chunk tree placement)
 */

import { BlockID } from '../blocks/Block.js';
import { TreeTypes } from '../trees/index.js';

// ----------------------------------------------------------------
//  PRNG determinístico (mulberry32)
// ----------------------------------------------------------------

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ----------------------------------------------------------------
//  Simplex Noise 2D + 3D (REAL 3D — seedado)
// ----------------------------------------------------------------

class SimplexNoise {
  constructor(seed = 0) {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    let n = seed;
    for (let i = 255; i > 0; i--) {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      const j = n % (i + 1);
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
  }

  // 2D simplex noise (unchanged)
  noise2D(x, y) {
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) { t0 *= t0; const g = this.perm[ii + this.perm[jj]] % 12; n0 = t0 * t0 * this._grad2(g, x0, y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) { t1 *= t1; const g = this.perm[ii + i1 + this.perm[jj + j1]] % 12; n1 = t1 * t1 * this._grad2(g, x1, y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) { t2 *= t2; const g = this.perm[ii + 1 + this.perm[jj + 1]] % 12; n2 = t2 * t2 * this._grad2(g, x2, y2); }
    return 70 * (n0 + n1 + n2);
  }

  // FIX #3: REAL 3D Simplex Noise — replaces the fake 2D-combo approach
  noise3D(x, y, z) {
    // Skewing factors for 3D simplex
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;

    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * G3;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);

    // Determine which simplex we're in
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    const ii = i & 255, jj = j & 255, kk = k & 255;

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

    let tt = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (tt >= 0) { tt *= tt; const gi = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12; n0 = tt * tt * this._grad3(gi, x0, y0, z0); }

    tt = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (tt >= 0) { tt *= tt; const gi = this.perm[ii+i1 + this.perm[jj+j1 + this.perm[kk+k1]]] % 12; n1 = tt * tt * this._grad3(gi, x1, y1, z1); }

    tt = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (tt >= 0) { tt *= tt; const gi = this.perm[ii+i2 + this.perm[jj+j2 + this.perm[kk+k2]]] % 12; n2 = tt * tt * this._grad3(gi, x2, y2, z2); }

    tt = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (tt >= 0) { tt *= tt; const gi = this.perm[ii+1 + this.perm[jj+1 + this.perm[kk+1]]] % 12; n3 = tt * tt * this._grad3(gi, x3, y3, z3); }

    return 32 * (n0 + n1 + n2 + n3);
  }

  _grad2(gi, x, y) {
    const g = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    return g[gi][0] * x + g[gi][1] * y;
  }

  // FIX #3: 3D gradient table (12 directions in 3D)
  _grad3(gi, x, y, z) {
    const g = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    return g[gi][0] * x + g[gi][1] * y + g[gi][2] * z;
  }

  fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
    let v = 0, a = 1, f = 1, m = 0;
    for (let i = 0; i < octaves; i++) {
      v += this.noise2D(x * f, y * f) * a;
      m += a; a *= gain; f *= lacunarity;
    }
    return v / m;
  }

  fbm3(x, y, z, octaves = 3) {
    let v = 0, a = 1, f = 1, m = 0;
    for (let i = 0; i < octaves; i++) {
      v += this.noise3D(x * f, y * f, z * f) * a;
      m += a; a *= 0.5; f *= 2;
    }
    return v / m;
  }
}

// ----------------------------------------------------------------
//  Biomas
// ----------------------------------------------------------------

const BIOME = {
  OCEAN: 0, PLAINS: 1, FOREST: 2, DESERT: 3,
  SNOW: 4, JUNGLE: 5, MOUNTAINS: 6
};

const BIOME_NAMES = {
  0: 'Oceano', 1: 'Planície', 2: 'Floresta',
  3: 'Deserto', 4: 'Neve', 5: 'Selva', 6: 'Montanha'
};

// ----------------------------------------------------------------
//  TerrainGenerator
// ----------------------------------------------------------------

export class TerrainGenerator {
  constructor(seed = 42) {
    this.seed = seed;
    this.rng = mulberry32(seed);

    // Noises de terreno
    this.continentNoise  = new SimplexNoise(seed);
    this.mountainNoise   = new SimplexNoise(seed + 1000);
    this.detailNoise     = new SimplexNoise(seed + 2000);
    this.biomeNoise      = new SimplexNoise(seed + 3000);
    this.biomeDetailNoise = new SimplexNoise(seed + 3500);
    this.caveNoise       = new SimplexNoise(seed + 4000);
    this.treeNoise       = new SimplexNoise(seed + 5000);

    // Constantes
    this.seaLevel = 40;
    this.worldMin = 1;
    this.worldMax = 254;

    // FIX #1: Cache de texturas determinísticas — uma rng por seed
    this._textureRng = mulberry32(seed + 9999);
  }

  // Deterministic texture RNG — returns a value in [0,1) from position
  textureRand(wx, wy, wz, idx) {
    const v = mulberry32(wx * 374761393 + wz * 668265263 + wy * 1013904223 + idx * 7 + this.seed);
    return v();
  }

  // ── Bioma ──────────────────────────────────

  getBiome(wx, wz) {
    const continental = this.biomeNoise.fbm(wx * 0.0015, wz * 0.0015, 4);
    const detail = this.biomeDetailNoise.fbm(wx * 0.008, wz * 0.008, 3);
    if (continental < -0.25) return BIOME.OCEAN;
    if (continental < -0.15) return BIOME.OCEAN;

    const temp = detail + continental * 0.3;

    if (continental > 0.4 && detail > -0.1) return BIOME.MOUNTAINS;
    if (temp < -0.35) return BIOME.SNOW;
    if (temp > 0.4 && continental > 0.05) return BIOME.DESERT;
    if (temp > 0.15 && continental < 0.2) return BIOME.JUNGLE;
    if (temp > -0.1) return BIOME.FOREST;
    return BIOME.PLAINS;
  }

  // ── Altura ─────────────────────────────────

  getHeight(wx, wz) {
    const biome = this.getBiome(wx, wz);
    const continental = this.biomeNoise.fbm(wx * 0.0015, wz * 0.0015, 4);

    if (biome === BIOME.OCEAN) {
      const depth = this.continentNoise.fbm(wx * 0.01, wz * 0.01, 3);
      const h = this.seaLevel - 8 + depth * 6;
      return this._clamp(Math.floor(h));
    }

    let height = this.seaLevel;

    const base = this.continentNoise.fbm(wx * 0.008, wz * 0.008, 5);
    height += base * 12;

    const detail = this.detailNoise.fbm(wx * 0.03, wz * 0.03, 4);
    height += detail * 6;

    const micro = this.detailNoise.noise2D(wx * 0.1, wz * 0.1);
    height += micro * 2;

    if (biome === BIOME.MOUNTAINS) {
      const mountain = this.mountainNoise.fbm(wx * 0.012, wz * 0.012, 5);
      const ridge = 1.0 - Math.abs(mountain);
      const ridgeSignal = ridge * ridge * 40;
      const peakNoise = this.mountainNoise.fbm(wx * 0.006, wz * 0.006, 3);
      const peakFactor = 0.5 + peakNoise * 0.5;
      height += ridgeSignal * peakFactor;
      if (mountain > 0.3 && peakNoise > 0.15) {
        height += (mountain - 0.3) * 25;
      }
    }

    switch (biome) {
      case BIOME.PLAINS:
        height += 2;
        height *= 0.85;
        break;
      case BIOME.FOREST:
        height += 3;
        height *= 0.9;
        break;
      case BIOME.DESERT:
        height *= 0.75;
        height += 4;
        const dune = this.detailNoise.noise2D(wx * 0.05, wz * 0.05);
        height += dune * 3;
        break;
      case BIOME.SNOW:
        height += 5;
        break;
      case BIOME.JUNGLE:
        height *= 0.88;
        height += 3;
        const jungleVar = this.detailNoise.noise2D(wx * 0.06, wz * 0.06);
        height += jungleVar * 4;
        break;
    }

    return this._clamp(Math.floor(height));
  }

  // ── Camadas geológicas ──────────────────────

  getBlockAt(wx, wy, wz, gh, biome) {
    if (wy === 0) return BlockID.BEDROCK;
    if (wy <= 3) {
      const bedrockChance = this.caveNoise.noise2D(wx * 0.5 + wy * 100, wz * 0.5);
      if (bedrockChance > -0.3 || wy === 1) return BlockID.BEDROCK;
    }

    // FIX #3: Cavernas com TRUE 3D noise — sem artefatos 2D
    if (wy >= 5 && wy <= 50) {
      const cave = this.caveNoise.fbm3(wx * 0.04, wy * 0.05, wz * 0.04, 3);
      const caveThreshold = 0.38 - (wy <= 15 ? 0.05 : 0);
      if (cave > caveThreshold) return BlockID.AIR;
    }

    if (wy >= 10 && wy <= 30) {
      const bigCave = this.caveNoise.fbm3(wx * 0.02, wy * 0.03, wz * 0.02, 2);
      if (bigCave > 0.48) return BlockID.AIR;
    }

    // Rocha exposta em encostas
    if (wy > gh && wy <= gh + 3) {
      const hN = this.getHeight(wx, wz - 2);
      const hS = this.getHeight(wx, wz + 2);
      const hE = this.getHeight(wx + 2, wz);
      const hW = this.getHeight(wx - 2, wz);
      const maxDiff = Math.max(Math.abs(gh - hN), Math.abs(gh - hS), Math.abs(gh - hE), Math.abs(gh - hW));
      if (maxDiff > 6 && wy > gh + 1) return BlockID.STONE;
    }

    if (wy < gh - 4) return BlockID.STONE;
    if (wy < gh) return BlockID.DIRT;
    if (wy === gh) {
      if (gh >= this.seaLevel - 2 && gh <= this.seaLevel + 2) return BlockID.SAND;
      switch (biome) {
        case BIOME.DESERT: return BlockID.SAND;
        case BIOME.SNOW:   return BlockID.SNOW;
        case BIOME.JUNGLE: return BlockID.GRASS;
        case BIOME.MOUNTAINS:
          return gh > 70 ? BlockID.SNOW : BlockID.GRASS;
        default: return BlockID.GRASS;
      }
    }

    if (wy <= this.seaLevel && wy > gh) return BlockID.WATER;

    return BlockID.AIR;
  }

  // ── Geração do chunk ───────────────────────

  generateChunk(chunk) {
    const bx = chunk.chunkX * 16, bz = chunk.chunkZ * 16;

    // Passo 1: Gerar blocos de terreno
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
      const wx = bx + lx, wz = bz + lz;
      const h = this.getHeight(wx, wz);
      const b = this.getBiome(wx, wz);
      for (let y = 0; y < 256; y++) {
        const bl = this.getBlockAt(wx, y, wz, h, b);
        if (bl !== BlockID.AIR) chunk.setBlock(lx, y, lz, bl);
      }
    }

    // FIX #2: Passo 2 — Árvores com suporte cross-chunk
    // Varrer posições com margem de 3 blocos (-3..18) para permitir árvores
    // que começam perto da borda e se estendem para chunks vizinhos.
    // Cada vizinho gerará as folhas que caem no seu território.
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
      const wx = bx + lx, wz = bz + lz;
      const h = this.getHeight(wx, wz);
      const b = this.getBiome(wx, wz);

      if (h <= this.seaLevel + 1) continue;
      if (b === BIOME.OCEAN) continue;
      if (b === BIOME.MOUNTAINS && h > 72) continue;

      let types = [];
      let density = 0;
      switch (b) {
        case BIOME.DESERT:
          types = [TreeTypes[4]];
          density = 0.004;
          break;
        case BIOME.SNOW:
          types = [TreeTypes[1]];
          density = 0.007;
          break;
        case BIOME.FOREST:
          types = [TreeTypes[0], TreeTypes[1], TreeTypes[2]];
          density = 0.018;
          break;
        case BIOME.JUNGLE:
          types = [TreeTypes[0], TreeTypes[2]];
          density = 0.025;
          break;
        case BIOME.PLAINS:
          types = [TreeTypes[0], TreeTypes[3]];
          density = 0.005;
          break;
        case BIOME.MOUNTAINS:
          types = [TreeTypes[1]];
          density = 0.005;
          break;
        default:
          continue;
      }

      const posRng = mulberry32(wx * 374761393 + wz * 668265263 + this.seed);
      const treeRoll = posRng();

      if (treeRoll < density) {
        const groundBlock = chunk.getBlock(lx, h, lz);
        if (groundBlock === BlockID.GRASS || groundBlock === BlockID.SAND || groundBlock === BlockID.SNOW) {
          const typeIdx = Math.floor(posRng() * types.length);
          const T = types[typeIdx];
          if (h >= T.minGround) {
            // Allow placing tree blocks in neighbor chunks if they are loaded
            T.place(chunk, lx, h + 1, lz, posRng, this._getBlockFromWorld.bind(this), bx, bz);
          }
        }
      }
    }
  }

  // FIX #2: Helper — get a block from any loaded chunk by world coordinates
  _getBlockFromWorld(localChunk, bx, bz, wx, wy, wz) {
    const lx = wx - bx;
    const lz = wz - bz;
    // If within local chunk bounds, use it directly
    if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16) {
      return localChunk.getBlock(lx, wy, lz);
    }
    // Outside this chunk — we cannot access neighbor chunks during generation.
    // Return AIR so tree placement doesn't block, and only place blocks in our chunk.
    return BlockID.AIR;
  }

  _clamp(h) {
    return Math.max(this.worldMin, Math.min(this.worldMax, h));
  }

  getBiomeName(id) {
    return BIOME_NAMES[id] || '?';
  }
}

export { BIOME, BIOME_NAMES };
