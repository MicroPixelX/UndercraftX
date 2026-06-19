/**
 * Block.js: Registry central de blocos com texturas procedurais
 */
import * as THREE from 'three';

export const BlockID = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5,
  WATER: 6, SAND: 7, BEDROCK: 8, OAK_LOG: 9, PINE_LOG: 10,
  BIRCH_LOG: 11, SAKURA_LEAVES: 12, CACTUS: 13, SNOW: 14
};

export const BlockRegistry = {};

export function generateTexture(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

export function createBlockMaterial(top, side, bottom, opts = {}) {
  const o = { transparent: opts.transparent || false, opacity: opts.opacity ?? 1, side: THREE.FrontSide, ...opts };
  return [
    new THREE.MeshLambertMaterial({ map: side, ...o }),
    new THREE.MeshLambertMaterial({ map: side, ...o }),
    new THREE.MeshLambertMaterial({ map: top, ...o }),
    new THREE.MeshLambertMaterial({ map: bottom, ...o }),
    new THREE.MeshLambertMaterial({ map: side, ...o }),
    new THREE.MeshLambertMaterial({ map: side, ...o }),
  ];
}

export function registerBlock(id, def) {
  BlockRegistry[id] = {
    id, name: def.name || '?', solid: def.solid ?? true,
    transparent: def.transparent || false, opacity: def.opacity ?? 1,
    materials: null, createMaterials: def.createMaterials || null,
  };
}

export function initBlockTextures() {
  for (const [id, block] of Object.entries(BlockRegistry)) {
    if (block.createMaterials) block.materials = block.createMaterials();
  }
}

export function isBlockSolid(id) {
  if (id === BlockID.AIR) return false;
  return BlockRegistry[id]?.solid ?? false;
}

export function isBlockTransparent(id) {
  if (id === BlockID.AIR) return true;
  return BlockRegistry[id]?.transparent ?? false;
}
