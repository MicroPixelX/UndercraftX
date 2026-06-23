/**
 * game.js: Mundo + chunks + culling cross-chunk
 *
 * FIXES:
 *  - #6: Only rebuild dirty chunks instead of ALL chunks on every update
 *  - Detach chunks from scene only when actually removed (not every frame)
 *  - #11: getSpawnPosition now uses the seeded PRNG instead of Math.random()
 *         so the spawn point is deterministic for the same seed.
 *  - #12: updateChunks double-rebuild fix — new chunks are built in a single pass.
 *         Previously, the second pass could re-mark already-built chunks as dirty
 *         and rebuild them again in the same frame (wasted CPU + potential flicker).
 */

import * as THREE from 'three';
import { Chunk } from './world/chunk.js';
import { TerrainGenerator, BIOME, BIOME_NAMES } from './world/terrain.js';
import { BlockID, isBlockSolid, initBlockTextures } from './blocks/Block.js';
import './blocks/index.js';

const RD = 4, CS = 16, CH = 256;

// Deterministic PRNG (mulberry32) — same as in terrain.js
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class Game {
  constructor(scene, camera, dom, seed = 42) {
    this.scene = scene; this.camera = camera; this.domElement = dom;
    this.seed = seed;
    // FIX #11: Seeded spawn RNG — deterministic per world seed
    this._spawnRng = mulberry32(seed ^ 0xDEADBEEF);
    initBlockTextures();
    this.chunks = new Map();
    this.terrain = new TerrainGenerator(seed);
    this.cx = NaN; this.cz = NaN; this.throttle = 0;
  }

  key(cx,cz){return `${cx},${cz}`;}

  getBlockAt(wx,wy,wz){
    const iy = Math.floor(wy);
    if(iy < 0 || iy >= CH) return BlockID.AIR;
    const cx=Math.floor(wx/CS),cz=Math.floor(wz/CS);
    const ch=this.chunks.get(this.key(cx,cz));
    if(!ch)return BlockID.AIR;
    const lx=((wx%CS)+CS)%CS,lz=((wz%CS)+CS)%CS;
    return ch.getBlock(lx,iy,lz);
  }

  getNeighborBlock(gx,gy,gz){
    if(gy < 0 || gy >= CH) return BlockID.AIR;
    return this.getBlockAt(Math.floor(gx),gy,Math.floor(gz));
  }

  updateChunks(px,pz){
    const pcx=Math.floor(px/CS),pcz=Math.floor(pz/CS);
    if(pcx===this.cx&&pcz===this.cz)return;
    this.cx=pcx;this.cz=pcz;

    const loaded=new Set();
    // FIX #12: Track which chunks are newly created this update cycle
    const newlyCreated = new Set();

    // Generate new chunks that entered radius
    for(let dx=-RD;dx<=RD;dx++)for(let dz=-RD;dz<=RD;dz++){
      const cx=this.cx+dx,cz=this.cz+dz,k=this.key(cx,cz);
      loaded.add(k);
      if(!this.chunks.has(k)){
        const ch=new Chunk(cx,cz);
        this.terrain.generateChunk(ch);
        this.chunks.set(k,ch);
        newlyCreated.add(k);
      }
    }

    // Remove chunks that left radius
    for(const [k,ch] of this.chunks){
      if(!loaded.has(k)){
        ch.dispose(this.scene);
        this.chunks.delete(k);
      }
    }

    // FIX #6 + FIX #12: Single-pass rebuild strategy.
    // 1. Mark existing clean chunks dirty if they border a newly-created chunk.
    // 2. Build ALL dirty chunks exactly once — no second pass needed.
    for(const [,ch] of this.chunks){
      if(!ch.dirty){
        const ncx = ch.chunkX, ncz = ch.chunkZ;
        const neighborKeys = [
          this.key(ncx-1,ncz), this.key(ncx+1,ncz),
          this.key(ncx,ncz-1), this.key(ncx,ncz+1)
        ];
        for(const nk of neighborKeys){
          // FIX #12: Only mark dirty when the neighbor was JUST created, not when
          // it was already present and clean — avoids cascading dirty propagation.
          if(newlyCreated.has(nk)){
            ch.dirty = true;
            break;
          }
        }
      }
    }

    // Single rebuild pass — every dirty chunk is built exactly once per update
    for(const [,ch] of this.chunks){
      if(ch.dirty){
        ch.buildMesh(this.scene,(gx,gy,gz)=>this.getNeighborBlock(gx,gy,gz));
      }
    }
  }

  update(pos){
    this.throttle++;
    if(this.throttle>=10){
      this.throttle=0;
      this.updateChunks(pos.x,pos.z);
    }
  }

  isSolidAt(wx,wy,wz){return isBlockSolid(this.getBlockAt(Math.floor(wx),Math.floor(wy),Math.floor(wz)));}

  getSpawnPosition(){
    // FIX #11: Use seeded PRNG instead of Math.random() so spawn is deterministic
    const rng = this._spawnRng;
    for(let attempt=0;attempt<20;attempt++){
      const sx=8+Math.floor(rng()*64)-32;
      const sz=8+Math.floor(rng()*64)-32;
      const h=this.terrain.getHeight(sx,sz);
      const biome=this.terrain.getBiome(sx,sz);
      if(biome!==BIOME.OCEAN&&h>this.terrain.seaLevel+1){
        return new THREE.Vector3(sx,h+3,sz);
      }
    }
    const sx=8,sz=8,h=this.terrain.getHeight(sx,sz);
    let sy=h+3;
    if(h<=this.terrain.seaLevel)sy=this.terrain.seaLevel+3;
    return new THREE.Vector3(sx,sy,sz);
  }

  getBiomeAt(x,z){
    const b=this.terrain.getBiome(x,z);
    return BIOME_NAMES[b]||'?';
  }
}
