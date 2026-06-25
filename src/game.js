/**
 * game.js: Mundo + chunks + culling cross-chunk
 *
 * FIXES:
 *  - #6: Only rebuild dirty chunks instead of ALL chunks on every update
 *  - #11: getSpawnPosition now uses the seeded PRNG instead of Math.random()
 *  - #12: updateChunks double-rebuild fix
 *  - FIX-G: getSpawnPosition checks that the spawn area is clear of solid blocks
 *  - FIX-P: getBlockAt now floors wx and wz
 *  - FIX-Q: updateChunks throttle starts at threshold
 *  - FIX-V6: _isSpawnClear also rejects underwater spawn positions
 */

import * as THREE from 'three';
import { Chunk } from './world/chunk.js';
import { TerrainGenerator, BIOME, BIOME_NAMES } from './world/terrain.js';
import { BlockID, isBlockSolid, initBlockTextures } from './blocks/Block.js';
import './blocks/index.js';

const RD = 4, CS = 16, CH = 256;

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
    this._spawnRng = mulberry32(seed ^ 0xDEADBEEF);
    initBlockTextures();
    this.chunks = new Map();
    this.terrain = new TerrainGenerator(seed);
    this.cx = NaN; this.cz = NaN;
    this.throttle = 9;
  }

  key(cx,cz){return `${cx},${cz}`;}

  getBlockAt(wx,wy,wz){
    wx = Math.floor(wx);
    wz = Math.floor(wz);
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
    const newlyCreated = new Set();

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

    const toRemove = [];
    for(const [k,ch] of this.chunks){
      if(!loaded.has(k)){
        ch.dispose(this.scene);
        toRemove.push(k);
      }
    }
    for(const k of toRemove) this.chunks.delete(k);

    for(const [,ch] of this.chunks){
      if(!ch.dirty){
        const ncx = ch.chunkX, ncz = ch.chunkZ;
        const neighborKeys = [
          this.key(ncx-1,ncz), this.key(ncx+1,ncz),
          this.key(ncx,ncz-1), this.key(ncx,ncz+1)
        ];
        for(const nk of neighborKeys){
          if(newlyCreated.has(nk)){
            ch.dirty = true;
            break;
          }
        }
      }
    }

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

  // FIX-V6: Also reject spawn positions that are underwater
  _isSpawnClear(sx, sy, sz) {
    const hw = 0.3;
    const mh = 1.8;
    for (let x = Math.floor(sx - hw); x <= Math.floor(sx + hw); x++)
      for (let y = Math.floor(sy); y <= Math.floor(sy + mh); y++)
        for (let z = Math.floor(sz - hw); z <= Math.floor(sz + hw); z++) {
          const b = this.getBlockAt(x, y, z);
          if (isBlockSolid(b)) return false;
          // FIX-V6: Reject if feet are in water
          if (y === Math.floor(sy) && b === BlockID.WATER) return false;
        }
    return true;
  }

  getSpawnPosition(){
    const rng = this._spawnRng;
    for(let attempt=0;attempt<40;attempt++){
      const sx=8+Math.floor(rng()*64)-32;
      const sz=8+Math.floor(rng()*64)-32;
      const h=this.terrain.getHeight(sx,sz);
      const biome=this.terrain.getBiome(sx,sz);
      if(biome!==BIOME.OCEAN&&h>this.terrain.seaLevel+1){
        const sy = h + 1;
        if (this._isSpawnClear(sx, sy, sz)) {
          return new THREE.Vector3(sx, sy, sz);
        }
      }
    }
    const sx=8,sz=8,h=this.terrain.getHeight(sx,sz);
    let sy=Math.max(h+1,this.terrain.seaLevel+2);
    return new THREE.Vector3(sx,sy,sz);
  }

  getBiomeAt(x,z){
    const b=this.terrain.getBiome(x,z);
    return BIOME_NAMES[b]||'?';
  }

  dispose() {
    for (const [,ch] of this.chunks) {
      ch.dispose(this.scene);
    }
    this.chunks.clear();
    this.cx = NaN;
    this.cz = NaN;
  }
}
