/**
 * game.js: Mundo + chunks + culling cross-chunk
 * Atualizado: suporte a 7 biomas, seed, getBiomeName
 */
import * as THREE from 'three';
import { Chunk } from './world/chunk.js';
import { TerrainGenerator, BIOME, BIOME_NAMES } from './world/terrain.js';
import { BlockID, isBlockSolid, initBlockTextures } from './blocks/Block.js';
import './blocks/index.js';

const RD = 4, CS = 16, CH = 256;

export class Game {
  constructor(scene, camera, dom, seed = 42) {
    this.scene = scene; this.camera = camera; this.domElement = dom;
    this.seed = seed;
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
    for(let dx=-RD;dx<=RD;dx++)for(let dz=-RD;dz<=RD;dz++){
      const cx=this.cx+dx,cz=this.cz+dz,k=this.key(cx,cz);
      loaded.add(k);
      if(!this.chunks.has(k)){const ch=new Chunk(cx,cz);this.terrain.generateChunk(ch);this.chunks.set(k,ch);}
    }
    for(const [k,ch] of this.chunks){if(!loaded.has(k)){ch.dispose(this.scene);this.chunks.delete(k);}}
    for(const [,ch] of this.chunks) ch.buildMesh(this.scene,(gx,gy,gz)=>this.getNeighborBlock(gx,gy,gz));
  }

  update(pos){this.throttle++;if(this.throttle>=10){this.throttle=0;this.updateChunks(pos.x,pos.z);}}

  isSolidAt(wx,wy,wz){return isBlockSolid(this.getBlockAt(Math.floor(wx),Math.floor(wy),Math.floor(wz)));}

  getSpawnPosition(){
    // Tentar encontrar spawn em terra (não oceano)
    for (let attempt = 0; attempt < 20; attempt++) {
      const sx = 8 + Math.floor(Math.random() * 64) - 32;
      const sz = 8 + Math.floor(Math.random() * 64) - 32;
      const h = this.terrain.getHeight(sx, sz);
      const biome = this.terrain.getBiome(sx, sz);
      if (biome !== BIOME.OCEAN && h > this.terrain.seaLevel + 1) {
        return new THREE.Vector3(sx, h + 3, sz);
      }
    }
    // Fallback: centro
    const sx=8,sz=8,h=this.terrain.getHeight(sx,sz);
    let sy=h+3;
    if(h<=this.terrain.seaLevel)sy=this.terrain.seaLevel+3;
    return new THREE.Vector3(sx,sy,sz);
  }

  getBiomeAt(x,z){
    const b = this.terrain.getBiome(x, z);
    return BIOME_NAMES[b] || '?';
  }
}
