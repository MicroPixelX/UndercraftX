/**
 * game.js: Mundo + chunks + culling cross-chunk
 */
import * as THREE from 'three';
import { Chunk } from './world/chunk.js';
import { TerrainGenerator, BIOME } from './world/terrain.js';
import { BlockID, isBlockSolid, initBlockTextures } from './blocks/Block.js';
import './blocks/index.js';

const RD = 4, CS = 16, CH = 256;

export class Game {
  constructor(scene, camera, dom) {
    this.scene = scene; this.camera = camera; this.domElement = dom;
    initBlockTextures();
    this.chunks = new Map();
    this.terrain = new TerrainGenerator(42);
    this.cx = 0; this.cz = 0; this.throttle = 0;
  }

  key(cx,cz){return `${cx},${cz}`;}

  getBlockAt(wx,wy,wz){
    const cx=Math.floor(wx/CS),cz=Math.floor(wz/CS);
    const ch=this.chunks.get(this.key(cx,cz));
    if(!ch)return BlockID.AIR;
    const lx=((wx%CS)+CS)%CS,lz=((wz%CS)+CS)%CS,ly=Math.floor(wy);
    if(ly<0||ly>=CH)return BlockID.AIR;
    return ch.getBlock(lx,ly,lz);
  }

  getNeighborBlock(gx,gy,gz){return this.getBlockAt(Math.floor(gx),gy,Math.floor(gz));}

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
    const sx=8,sz=8,h=this.terrain.getHeight(sx,sz);
    let sy=h+3;
    if(h<=this.terrain.seaLevel)sy=this.terrain.seaLevel+3;
    return new THREE.Vector3(sx,sy,sz);
  }

  getBiomeAt(x,z){
    const b=this.terrain.getBiome(x,z);
    return {0:'Planície',1:'Floresta',2:'Deserto',3:'Neve'}[b]||'?';
  }
}
