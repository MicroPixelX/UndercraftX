/**
 * chunk.js: Chunk 16x256x16 com face culling cross-chunk corrigido
 */
import * as THREE from 'three';
import { BlockID, BlockRegistry, isBlockTransparent } from '../blocks/Block.js';

const SX = 16, SY = 256, SZ = 16;

export class Chunk {
  constructor(cx, cz) {
    this.chunkX = cx; this.chunkZ = cz;
    this.blocks = new Uint8Array(SX * SY * SZ);
    this.mesh = null; this.waterMesh = null; this.dirty = true;
  }

  idx(x, y, z) { return x + z * SX + y * SX * SZ; }

  setBlock(x, y, z, t) {
    if (x<0||x>=SX||y<0||y>=SY||z<0||z>=SZ) return;
    this.blocks[this.idx(x,y,z)] = t; this.dirty = true;
  }

  getBlock(x, y, z) {
    if (x<0||x>=SX||y<0||y>=SY||z<0||z>=SZ) return BlockID.AIR;
    return this.blocks[this.idx(x,y,z)];
  }

  generateMesh(getNeighbor) {
    const pos = [], col = [], idx = [];
    const wpos = [], wcol = [], widx = [];

    const faces = [
      { dir:[0,1,0], verts:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
      { dir:[0,-1,0], verts:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
      { dir:[1,0,0], verts:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
      { dir:[-1,0,0], verts:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
      { dir:[0,0,1], verts:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
      { dir:[0,0,-1], verts:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },
    ];

    for (let x=0;x<SX;x++) for (let y=0;y<SY;y++) for (let z=0;z<SZ;z++) {
      const block = this.getBlock(x,y,z);
      if (block === BlockID.AIR) continue;
      const data = BlockRegistry[block];
      if (!data) continue;

      const isWater = block === BlockID.WATER;
      const gx = this.chunkX * SX + x;
      const gz = this.chunkZ * SZ + z;

      for (const { dir, verts } of faces) {
        const nx=x+dir[0], ny=y+dir[1], nz=z+dir[2];
        let nb;
        if (nx<0||nx>=SX||ny<0||ny>=SY||nz<0||nz>=SZ) nb = getNeighbor(gx+dir[0], ny, gz+dir[2]);
        else nb = this.getBlock(nx,ny,nz);

        // Culling corrigido
        if (isWater) {
          if (nb === BlockID.WATER) continue;
          if (nb !== BlockID.AIR && !isBlockTransparent(nb)) continue;
        } else {
          if (nb !== BlockID.AIR && !isBlockTransparent(nb)) continue;
          if (data.transparent && nb === block) continue;
        }

        const tp = isWater ? wpos : pos;
        const tc = isWater ? wcol : col;
        const ti = isWater ? widx : idx;
        const bi = tp.length / 3;
        const c = isWater ? 0x3060c0 : 0xffffff;

        for (const v of verts) {
          tp.push(gx+v[0], y+v[1], gz+v[2]);
          tc.push(((c>>16)&255)/255, ((c>>8)&255)/255, (c&255)/255);
        }
        ti.push(bi, bi+1, bi+2, bi, bi+2, bi+3);
      }
    }
    return { solid:{pos,col,idx}, water:{pos:wpos,col:wcol,idx:widx} };
  }

  buildMesh(scene, getNeighbor) {
    this.dispose(scene);
    const d = this.generateMesh(getNeighbor);

    if (d.solid.pos.length > 0) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(d.solid.pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(d.solid.col, 3));
      g.setIndex(d.solid.idx);
      g.computeVertexNormals();
      this.mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
      scene.add(this.mesh);
    }

    if (d.water.pos.length > 0) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(d.water.pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(d.water.col, 3));
      g.setIndex(d.water.idx);
      g.computeVertexNormals();
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
      this.waterMesh = new THREE.Mesh(g, m);
      this.waterMesh.renderOrder = 1;
      scene.add(this.waterMesh);
    }
    this.dirty = false;
  }

  dispose(scene) {
    if (this.mesh) { scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh = null; }
    if (this.waterMesh) { scene.remove(this.waterMesh); this.waterMesh.geometry.dispose(); this.waterMesh.material.dispose(); this.waterMesh = null; }
  }
}

export { SX as CHUNK_SIZE_X, SY as CHUNK_SIZE_Y, SZ as CHUNK_SIZE_Z };
