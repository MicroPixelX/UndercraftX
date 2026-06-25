/**
 * terrain.js: Geração procedural realista + seed determinística
 * Biomas: Planície, Floresta, Deserto, Neve, Selva, Montanha
 * + Montanhas com picos nevados, cavernas 3D, praias, camadas geológicas
 *
 * CHANGES from original:
 *  - Smaller oceans (threshold shifted, depth reduced)
 *  - Smoother terrain with less extreme noise variation (fewer floating blocks)
 *  - Caves are fewer, smaller, and deeper-only (no giant holes at surface)
 *  - Beaches are wider and more natural
 *  - Terrain height is more gently rolling (no sudden cliffs creating floating overhangs)
 *  - Overhang detection: stone fills under overhangs to prevent floating terrain
 */

import { BlockID } from '../blocks/Block.js';
import { TreeTypes } from '../trees/index.js';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

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

  noise3D(x, y, z) {
    const F3 = 1.0 / 3.0, G3 = 1.0 / 6.0;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
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
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
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

  _grad3(gi, x, y, z) {
    const g = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
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

const BIOME = {
  OCEAN: 0, PLAINS: 1, FOREST: 2, DESERT: 3,
  SNOW: 4, JUNGLE: 5, MOUNTAINS: 6
};

const BIOME_NAMES = {
  0: 'Oceano', 1: 'Planície', 2: 'Floresta',
  3: 'Deserto', 4: 'Neve', 5: 'Selva', 6: 'Montanha'
};

export class TerrainGenerator {
  constructor(seed = 42) {
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.continentNoise  = new SimplexNoise(seed);
    this.mountainNoise   = new SimplexNoise(seed + 1000);
    this.detailNoise     = new SimplexNoise(seed + 2000);
    this.biomeNoise      = new SimplexNoise(seed + 3000);
    this.biomeDetailNoise = new SimplexNoise(seed + 3500);
    this.caveNoise       = new SimplexNoise(seed + 4000);
    this.treeNoise       = new SimplexNoise(seed + 5000);
    this.seaLevel = 40;
    this.worldMin = 1;
    this.worldMax = 254;
    this._textureRng = mulberry32(seed + 9999);
  }

  textureRand(wx, wy, wz, idx) {
    const v = mulberry32(wx * 374761393 + wz * 668265263 + wy * 1013904223 + idx * 7 + this.seed);
    return v();
  }

  getBiome(wx, wz) {
    const continental = this.biomeNoise.fbm(wx * 0.0015, wz * 0.0015, 4);
    const detail = this.biomeDetailNoise.fbm(wx * 0.008, wz * 0.008, 3);

    // Smaller oceans: only the deepest continental values become ocean
    if (continental < -0.40) return BIOME.OCEAN;

    const temp = detail + continental * 0.3;
    if (continental > 0.4 && detail > -0.1) return BIOME.MOUNTAINS;
    if (temp < -0.35) return BIOME.SNOW;
    if (temp > 0.4 && continental > 0.05) return BIOME.DESERT;
    if (temp > 0.15 && continental < 0.2) return BIOME.JUNGLE;
    if (temp > -0.1) return BIOME.FOREST;
    return BIOME.PLAINS;
  }

  getHeight(wx, wz) {
    const biome = this.getBiome(wx, wz);
    const continental = this.biomeNoise.fbm(wx * 0.0015, wz * 0.0015, 4);

    if (biome === BIOME.OCEAN) {
      // Shallower oceans — only 3-6 blocks deep instead of 8-14
      const depth = this.continentNoise.fbm(wx * 0.01, wz * 0.01, 3);
      const h = this.seaLevel - 3 + depth * 3;
      return this._clamp(Math.floor(h));
    }

    let height = this.seaLevel;

    // Broader, smoother base — less extreme variation
    const base = this.continentNoise.fbm(wx * 0.005, wz * 0.005, 4);
    height += base * 8;

    // Medium detail — gentler
    const detail = this.detailNoise.fbm(wx * 0.025, wz * 0.025, 3);
    height += detail * 4;

    // Very fine detail — subtle
    const micro = this.detailNoise.noise2D(wx * 0.1, wz * 0.1);
    height += micro * 1;

    if (biome === BIOME.MOUNTAINS) {
      const mountain = this.mountainNoise.fbm(wx * 0.012, wz * 0.012, 5);
      const ridge = 1.0 - Math.abs(mountain);
      const ridgeSignal = ridge * ridge * 25;
      const peakNoise = this.mountainNoise.fbm(wx * 0.006, wz * 0.006, 3);
      const peakFactor = 0.5 + peakNoise * 0.5;
      height += ridgeSignal * peakFactor;
      // More gradual sharp peaks — reduced multiplier
      if (mountain > 0.3 && peakNoise > 0.15) {
        height += (mountain - 0.3) * 12;
      }
    }

    switch (biome) {
      case BIOME.PLAINS:
        height += 2;
        height *= 0.85;
        break;
      case BIOME.FOREST:
        height += 2;
        height *= 0.9;
        break;
      case BIOME.DESERT: {
        height *= 0.8;
        height += 3;
        const dune = this.detailNoise.noise2D(wx * 0.04, wz * 0.04);
        height += dune * 2;
        break;
      }
      case BIOME.SNOW:
        height += 3;
        break;
      case BIOME.JUNGLE: {
        height *= 0.88;
        height += 2;
        const jungleVar = this.detailNoise.noise2D(wx * 0.05, wz * 0.05);
        height += jungleVar * 3;
        break;
      }
    }

    return this._clamp(Math.floor(height));
  }

  getBlockAt(wx, wy, wz, gh, biome) {
    if (wy === 0) return BlockID.BEDROCK;
    if (wy <= 3) {
      const bedrockChance = this.caveNoise.noise2D(wx * 0.5 + wy * 100, wz * 0.5);
      if (bedrockChance > -0.3 || wy === 1) return BlockID.BEDROCK;
    }

    // Smaller, deeper caves only — no giant holes near surface
    if (wy >= 5 && wy <= 30) {
      const cave = this.caveNoise.fbm3(wx * 0.05, wy * 0.06, wz * 0.05, 3);
      // Higher threshold = fewer caves; depth scaling makes them rarer near surface
      const depthFactor = 1 - (wy / 30) * 0.3;
      const caveThreshold = 0.45 - (wy <= 15 ? 0.03 : 0) * depthFactor;
      if (cave > caveThreshold) return BlockID.AIR;
    }

    // No big caves at all (removed the large cave generator that made giant holes)

    // Rock on steep slopes
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
      // Wider beach zone: seaLevel-3 to seaLevel+3
      if (gh >= this.seaLevel - 3 && gh <= this.seaLevel + 3) return BlockID.SAND;
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

  generateChunk(chunk) {
    const bx = chunk.chunkX * 16, bz = chunk.chunkZ * 16;
    const heightCache = new Int32Array(16 * 16);

    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
      const wx = bx + lx, wz = bz + lz;
      const h = this.getHeight(wx, wz);
      const b = this.getBiome(wx, wz);
      heightCache[lx * 16 + lz] = h;
      for (let y = 0; y < 256; y++) {
        const bl = this.getBlockAt(wx, y, wz, h, b);
        if (bl !== BlockID.AIR) chunk.setBlock(lx, y, lz, bl);
      }
    }

    // Anti-float pass: fill overhangs under terrain to prevent floating blocks
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
      const gh = heightCache[lx * 16 + lz];
      let lastSolid = 0;
      for (let y = 0; y <= gh; y++) {
        const bl = chunk.getBlock(lx, y, lz);
        if (bl !== BlockID.AIR && bl !== BlockID.WATER) {
          lastSolid = y;
        } else if (bl === BlockID.AIR && y > 5 && y < gh) {
          // Check if there's a significant gap of air below solid ground above
          const aboveBlock = chunk.getBlock(lx, y + 1, lz);
          if (aboveBlock !== BlockID.AIR && aboveBlock !== BlockID.WATER) {
            // There's solid above and air here — check if there's solid well below
            const distBelow = y - lastSolid;
            if (distBelow > 3) {
              // Fill air gap with stone to prevent floating platforms
              chunk.setBlock(lx, y, lz, BlockID.STONE);
            }
          }
        }
      }
    }

    // Trees
    for (let lx = 0; lx < 16; lx++) for (let lz = 0; lz < 16; lz++) {
      const wx = bx + lx, wz = bz + lz;
      const h = heightCache[lx * 16 + lz];
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
            T.place(chunk, lx, h + 1, lz, posRng, this._getBlockFromWorld.bind(this), bx, bz);
          }
        }
      }
    }
  }

  _getBlockFromWorld(localChunk, bx, bz, wx, wy, wz) {
    const lx = wx - bx;
    const lz = wz - bz;
    if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16) {
      return localChunk.getBlock(lx, wy, lz);
    }
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
