/**
 * chunk.js: Chunk 16x256x16 com face culling cross-chunk corrigido
 * + Aplicação correta de cores/texturas por tipo de bloco
 */
import * as THREE from 'three';
import { BlockID, BlockRegistry, isBlockTransparent, isBlockSolid } from '../blocks/Block.js';

const SX = 16, SY = 256, SZ = 16;

// Cores base por tipo de bloco (fallback quando não há textura na mesh procedural)
const BLOCK_COLORS = {
  [BlockID.GRASS]:         { top: [0.36,0.64,0.18], side: [0.55,0.35,0.17], bottom: [0.55,0.35,0.17] },
  [BlockID.DIRT]:          { top: [0.55,0.35,0.17], side: [0.55,0.35,0.17], bottom: [0.55,0.35,0.17] },
  [BlockID.STONE]:         { top: [0.50,0.50,0.50], side: [0.50,0.50,0.50], bottom: [0.50,0.50,0.50] },
  [BlockID.WOOD]:          { top: [0.71,0.54,0.31], side: [0.54,0.41,0.08], bottom: [0.71,0.54,0.31] },
  [BlockID.LEAVES]:        { top: [0.13,0.55,0.13], side: [0.13,0.55,0.13], bottom: [0.13,0.55,0.13] },
  [BlockID.WATER]:         { top: [0.19,0.38,0.75], side: [0.19,0.38,0.75], bottom: [0.19,0.38,0.75] },
  [BlockID.SAND]:          { top: [0.76,0.70,0.50], side: [0.76,0.70,0.50], bottom: [0.76,0.70,0.50] },
  [BlockID.BEDROCK]:       { top: [0.10,0.10,0.10], side: [0.10,0.10,0.10], bottom: [0.10,0.10,0.10] },
  [BlockID.OAK_LOG]:       { top: [0.71,0.54,0.31], side: [0.36,0.23,0.12], bottom: [0.71,0.54,0.31] },
  [BlockID.PINE_LOG]:      { top: [0.66,0.47,0.25], side: [0.42,0.23,0.10], bottom: [0.66,0.47,0.25] },
  [BlockID.BIRCH_LOG]:     { top: [0.91,0.86,0.78], side: [0.91,0.88,0.82], bottom: [0.91,0.86,0.78] },
  [BlockID.SAKURA_LEAVES]: { top: [1.0,0.72,0.77], side: [1.0,0.72,0.77], bottom: [1.0,0.72,0.77] },
  [BlockID.CACTUS]:        { top: [0.18,0.42,0.12], side: [0.18,0.42,0.12], bottom: [0.18,0.42,0.12] },
  [BlockID.SNOW]:          { top: [0.94,0.96,1.0], side: [0.94,0.96,1.0], bottom: [0.94,0.96,1.0] },
};

// Mapeamento de dir índice -> face: 0=+Y(top), 1=-Y(bottom), 2=+X, 3=-X, 4=+Z, 5=-Z
function getBlockColor(blockId, faceDir) {
  const c = BLOCK_COLORS[blockId];
  if (!c) return [1, 1, 1];
  // faceDir: 0=top(+Y), 1=bottom(-Y), 2-5=sides
  if (faceDir === 0) return c.top;
  if (faceDir === 1) return c.bottom;
  return c.side;
}

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
      { dir:[0,1,0],  verts:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },   // 0: top (+Y)
      { dir:[0,-1,0], verts:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },   // 1: bottom (-Y)
      { dir:[1,0,0],  verts:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },   // 2: right (+X)
      { dir:[-1,0,0], verts:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },   // 3: left (-X)
      { dir:[0,0,1],  verts:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },   // 4: front (+Z)
      { dir:[0,0,-1], verts:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },   // 5: back (-Z)
    ];

    for (let x=0;x<SX;x++) for (let y=0;y<SY;y++) for (let z=0;z<SZ;z++) {
      const block = this.getBlock(x,y,z);
      if (block === BlockID.AIR) continue;
      const data = BlockRegistry[block];
      if (!data) continue;

      const isWater = block === BlockID.WATER;
      const gx = this.chunkX * SX + x;
      const gz = this.chunkZ * SZ + z;

      for (let fi=0;fi<faces.length;fi++) {
        const { dir, verts } = faces[fi];
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

        // Cor correta por tipo de bloco e face
        const [cr, cg, cb] = getBlockColor(block, fi);

        for (const v of verts) {
          tp.push(gx+v[0], y+v[1], gz+v[2]);
          tc.push(cr, cg, cb);
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

      // Material com vertexColors — agora as cores vêm por bloco
      const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
      scene.add(mesh);
      this.mesh = mesh;
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
