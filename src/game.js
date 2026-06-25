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
import { BlockID, isBlockSolid, isBlockTransparent, initBlockTextures, BlockRegistry } from './blocks/Block.js';
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
    this.throttle = 1;
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

    let rebuiltCount = 0;
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
        rebuiltCount++;
        if(rebuiltCount >= 8) break;
      }
    }
  }

  update(pos){
    this.throttle++;
    if(this.throttle>=3){
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
    this.terrain = null;
    this.cx = NaN;
    this.cz = NaN;
    this.throttle = 9;
  }

  raycastBlock(origin, direction, maxDist = 6) {
    const dx = direction.x, dy = direction.y, dz = direction.z;
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = dx >= 0 ? 1 : -1;
    const stepY = dy >= 0 ? 1 : -1;
    const stepZ = dz >= 0 ? 1 : -1;
    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    let tMaxX = dx !== 0 ? ((dx > 0 ? (x + 1 - origin.x) : (origin.x - x)) * tDeltaX) : Infinity;
    let tMaxY = dy !== 0 ? ((dy > 0 ? (y + 1 - origin.y) : (origin.y - y)) * tDeltaY) : Infinity;
    let tMaxZ = dz !== 0 ? ((dz > 0 ? (z + 1 - origin.z) : (origin.z - z)) * tDeltaZ) : Infinity;
    let dist = 0;
    let face = { x: 0, y: 0, z: 0 };

    while (dist < maxDist) {
      const block = this.getBlockAt(x, y, z);
      if (block !== BlockID.AIR && block !== BlockID.WATER && (isBlockSolid(block) || isBlockTransparent(block))) {
        return { x, y, z, block, face, dist };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          dist = tMaxX; x += stepX; tMaxX += tDeltaX;
          face = { x: -stepX, y: 0, z: 0 };
        } else {
          dist = tMaxZ; z += stepZ; tMaxZ += tDeltaZ;
          face = { x: 0, y: 0, z: -stepZ };
        }
      } else {
        if (tMaxY < tMaxZ) {
          dist = tMaxY; y += stepY; tMaxY += tDeltaY;
          face = { x: 0, y: -stepY, z: 0 };
        } else {
          dist = tMaxZ; z += stepZ; tMaxZ += tDeltaZ;
          face = { x: 0, y: 0, z: -stepZ };
        }
      }
    }
    return null;
  }

  breakBlock(bx, by, bz) {
    const cx = Math.floor(bx / CS), cz = Math.floor(bz / CS);
    const ch = this.chunks.get(this.key(cx, cz));
    if (!ch) return false;
    const lx = ((bx % CS) + CS) % CS, lz = ((bz % CS) + CS) % CS;
    const block = ch.getBlock(lx, by, lz);
    if (block === BlockID.AIR || block === BlockID.BEDROCK) return false;    ch.setBlock(lx, by, lz, BlockID.AIR);
    this._markDirty(cx, cz);
    if (lx === 0) this._markDirty(cx-1, cz);
    if (lx === 15) this._markDirty(cx+1, cz);
    if (lz === 0) this._markDirty(cx, cz-1);
    if (lz === 15) this._markDirty(cx, cz+1);
    return true;
  }

  placeBlock(bx, by, bz, face) {
    const px = bx + face.x, py = by + face.y, pz = bz + face.z;
    if (py < 0 || py >= CH) return false;
    const cx = Math.floor(px / CS), cz = Math.floor(pz / CS);
    const ch = this.chunks.get(this.key(cx, cz));
    if (!ch) return false;
    const lx = ((px % CS) + CS) % CS, lz = ((pz % CS) + CS) % CS;
    const existing = ch.getBlock(lx, py, lz);
    if (existing !== BlockID.AIR && existing !== BlockID.WATER) return false;
    ch.setBlock(lx, py, lz, BlockID.DIRT);
    this._markDirty(cx, cz);
    if (lx === 0) this._markDirty(cx-1, cz);
    if (lx === 15) this._markDirty(cx+1, cz);
    if (lz === 0) this._markDirty(cx, cz-1);
    if (lz === 15) this._markDirty(cx, cz+1);
    return true;
  }

  _markDirty(cx, cz) {
    const ch = this.chunks.get(this.key(cx, cz));
    if (ch) ch.dirty = true;
  }
}
