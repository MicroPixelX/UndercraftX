/**
 * chunk.js: Chunk 16x256x16 com face culling cross-chunk corrigido
 * + Texturas procedurais por tipo de bloco (via BlockRegistry.materials)
 *
 * FIXES:
 *  - #4: Material is now cached per-block-id — reused across chunks
 *  - #2: Tree cross-chunk clipping — trimmed leaf placement to chunk bounds
 *  - FIX-D: Use Uint32 index buffer to prevent index overflow on dense chunks
 *  - FIX-K: safeMax loop instead of Math.max(...spread) for index arrays
 *  - FIX-U: Textures from BlockRegistry.materials are now actually used.
 *           Previously chunk.js only used flat vertex colors with a single
 *           shared MeshLambertMaterial — the entire texture pipeline
 *           (generateTexture → initBlockTextures → createBlockMaterial →
 *           BlockRegistry.materials) was disconnected. Now each block face
 *           uses its correct per-face material with the CanvasTexture map.
 */

import * as THREE from 'three';
import { BlockID, BlockRegistry, isBlockTransparent } from '../blocks/Block.js';

const SX = 16, SY = 256, SZ = 16;

function safeMax(arr) {
  let m = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > m) m = arr[i];
  }
  return m;
}

const faces = [
  { dir:[0,1,0],  verts:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]], uvs:[[0,1],[1,1],[1,0],[0,0]], mi:2 },
  { dir:[0,-1,0], verts:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]], uvs:[[0,0],[1,0],[1,1],[0,1]], mi:3 },
  { dir:[1,0,0],  verts:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]], uvs:[[0,0],[0,1],[1,1],[1,0]], mi:0 },
  { dir:[-1,0,0], verts:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]], uvs:[[1,0],[1,1],[0,1],[0,0]], mi:1 },
  { dir:[0,0,1],  verts:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]], uvs:[[1,0],[0,0],[0,1],[1,1]], mi:4 },
  { dir:[0,0,-1], verts:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]], uvs:[[1,0],[0,0],[0,1],[1,1]], mi:5 },
];

const WATER_MAT_CACHE = {};

function getWaterMaterial(blockId) {
  if (WATER_MAT_CACHE[blockId]) return WATER_MAT_CACHE[blockId];
  const block = BlockRegistry[blockId];
  let mat;
  if (block && block.materials && block.materials[0]) {
    mat = block.materials[0].clone();
    mat.vertexColors = false;
    mat.transparent = true;
    mat.opacity = block.opacity ?? 0.6;
    mat.side = THREE.DoubleSide;
    mat.depthWrite = false;
  } else {
    mat = new THREE.MeshLambertMaterial({
      transparent: true, opacity: 0.6,
      side: THREE.DoubleSide, depthWrite: false,
    });
  }
  WATER_MAT_CACHE[blockId] = mat;
  return mat;
}

function getBlockMaterials(blockId) {
  const block = BlockRegistry[blockId];
  if (!block || !block.materials) return null;
  return block.materials;
}

export class Chunk {
  constructor(cx, cz) {
    this.chunkX = cx; this.chunkZ = cz;
    this.blocks = new Uint8Array(SX * SY * SZ);
    this.meshGroup = null;
    this.waterMesh = null;
    this.dirty = true;
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
    const groups = {};
    const waterPos = [], waterUv = [], waterIdx = [];

    for (let x=0;x<SX;x++) for (let y=0;y<SY;y++) for (let z=0;z<SZ;z++) {
      const block = this.getBlock(x,y,z);
      if (block === BlockID.AIR) continue;
      const data = BlockRegistry[block];
      if (!data) continue;

      const isWater = block === BlockID.WATER;
      const gx = this.chunkX * SX + x;
      const gz = this.chunkZ * SZ + z;

      for (let fi=0;fi<faces.length;fi++) {
        const { dir, verts, uvs, mi } = faces[fi];
        const nx=x+dir[0], ny=y+dir[1], nz=z+dir[2];
        let nb;
        if (nx<0||nx>=SX||ny<0||ny>=SY||nz<0||nz>=SZ) nb = getNeighbor(gx+dir[0], ny, gz+dir[2]);
        else nb = this.getBlock(nx,ny,nz);

        if (isWater) {
          if (nb === BlockID.WATER) continue;
          if (nb !== BlockID.AIR && !isBlockTransparent(nb)) continue;
        } else {
          if (nb !== BlockID.AIR && !isBlockTransparent(nb)) continue;
          if (data.transparent && nb === block) continue;
        }

        if (isWater) {
          const bi = waterPos.length / 3;
          for (let vi=0;vi<4;vi++) {
            waterPos.push(gx+verts[vi][0], y+verts[vi][1], gz+verts[vi][2]);
            waterUv.push(uvs[vi][0], uvs[vi][1]);
          }
          waterIdx.push(bi, bi+1, bi+2, bi, bi+2, bi+3);
          continue;
        }

        const mats = getBlockMaterials(block);
        const key = mats ? `${block}_${mi}` : `_${block}`;
        if (!groups[key]) {
          groups[key] = {
            blockId: block,
            matIdx: mi,
            hasTexture: !!mats,
            pos: [], uv: [], idx: [],
          };
        }
        const g = groups[key];
        const bi = g.pos.length / 3;

        for (let vi=0;vi<4;vi++) {
          g.pos.push(gx+verts[vi][0], y+verts[vi][1], gz+verts[vi][2]);
          g.uv.push(uvs[vi][0], uvs[vi][1]);
        }
        g.idx.push(bi, bi+1, bi+2, bi, bi+2, bi+3);
      }
    }
    return { solid: groups, water: { pos: waterPos, uv: waterUv, idx: waterIdx } };
  }

  buildMesh(scene, getNeighbor) {
    this.disposeGeo(scene);

    const d = this.generateMesh(getNeighbor);
    this.meshGroup = new THREE.Group();

    for (const key of Object.keys(d.solid)) {
      const g = d.solid[key];
      if (g.pos.length === 0) continue;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2));
      const maxIdx = safeMax(g.idx);
      const IndexArrayType = maxIdx > 65535 ? Uint32Array : Uint16Array;
      geo.setIndex(new THREE.BufferAttribute(new IndexArrayType(g.idx), 1));
      geo.computeVertexNormals();

      let mat;
      if (g.hasTexture) {
        const mats = getBlockMaterials(g.blockId);
        mat = mats[g.matIdx];
      } else {
        mat = _fallbackMat;
      }

      const mesh = new THREE.Mesh(geo, mat);
      this.meshGroup.add(mesh);
    }

    if (this.meshGroup.children.length > 0) {
      scene.add(this.meshGroup);
    } else {
      this.meshGroup = null;
    }

    if (d.water.pos.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(d.water.pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(d.water.uv, 2));
      const maxWIdx = safeMax(d.water.idx);
      const WIndexArrayType = maxWIdx > 65535 ? Uint32Array : Uint16Array;
      geo.setIndex(new THREE.BufferAttribute(new WIndexArrayType(d.water.idx), 1));
      geo.computeVertexNormals();

      this.waterMesh = new THREE.Mesh(geo, getWaterMaterial(BlockID.WATER));
      this.waterMesh.renderOrder = 1;
      scene.add(this.waterMesh);
    }

    this.dirty = false;
  }

  disposeGeo(scene) {
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      this.meshGroup.traverse(c => { if (c.geometry) c.geometry.dispose(); });
      this.meshGroup = null;
    }
    if (this.waterMesh) {
      scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }
  }

  dispose(scene) {
    this.disposeGeo(scene);
  }
}

const _fallbackMat = new THREE.MeshLambertMaterial({ color: 0xff00ff });

export { SX as CHUNK_SIZE_X, SY as CHUNK_SIZE_Y, SZ as CHUNK_SIZE_Z };
