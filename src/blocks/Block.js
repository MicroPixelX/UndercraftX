/**
 * Block.js: Registry central de blocos com texturas procedurais
 *
 * FIXES:
 *  - #1: generateTexture now accepts a seeded RNG so textures are deterministic.
 *  - #11: Texture generation is now lazy (deferred until initBlockTextures is called).
 *  - FIX-A: initBlockTextures iterates in sorted numeric order by BlockID.
 *  - FIX-V3: initBlockTextures now disposes old GPU textures/materials before
 *           re-creating them — prevents GPU memory leak on game restart.
 */

import * as THREE from 'three';

export const BlockID = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5,
  WATER: 6, SAND: 7, BEDROCK: 8, OAK_LOG: 9, PINE_LOG: 10,
  BIRCH_LOG: 11, SAKURA_LEAVES: 12, CACTUS: 13, SNOW: 14,
  ROSE: 15, DANDELION: 16, TALL_GRASS: 17, COAL_ORE: 18, IRON_ORE: 19
};

export const BlockRegistry = {};

let _textureSeed = 42;

export function setTextureSeed(seed) {
  _textureSeed = seed;
}

function _makeBlockRng(blockId) {
  let s = (_textureSeed + blockId * 2654435761) | 0;
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateTexture(w, h, drawFn) {
  return { _lazy: true, w, h, drawFn };
}

function _resolveTexture(desc, rng) {
  if (!desc || !desc._lazy) return desc;
  const c = document.createElement('canvas');
  c.width = desc.w; c.height = desc.h;
  const ctx = c.getContext('2d');
  desc.drawFn(ctx, desc.w, desc.h, rng);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

function _disposeBlockResources(block) {
  if (block.materials) {
    for (const mat of block.materials) {
      if (mat.map && mat.map !== mat._sharedMap) mat.map.dispose();
      mat.dispose();
    }
    block.materials = null;
  }
  if (block._resolvedTextures) {
    for (const key of Object.keys(block._resolvedTextures)) {
      const tex = block._resolvedTextures[key];
      if (tex && tex.isTexture) tex.dispose();
    }
    block._resolvedTextures = null;
  }
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
  // FIX-V3: Dispose old resources if re-registering over an existing block
  if (BlockRegistry[id]) {
    _disposeBlockResources(BlockRegistry[id]);
  }
  BlockRegistry[id] = {
    id, name: def.name || '?', solid: def.solid ?? true,
    transparent: def.transparent || false, opacity: def.opacity ?? 1,
    materials: null, createMaterials: def.createMaterials || null,
    _lazyTextures: def._lazyTextures || null,
  };
}

export function initBlockTextures() {
  const sortedIds = Object.keys(BlockRegistry).map(Number).sort((a, b) => a - b);
  for (const id of sortedIds) {
    const block = BlockRegistry[id];

    // FIX-V3: Dispose old GPU resources before creating new ones
    _disposeBlockResources(block);

    if (block._lazyTextures) {
      const rng = _makeBlockRng(id);
      const resolved = {};
      const texKeys = Object.keys(block._lazyTextures).sort();
      for (const key of texKeys) {
        resolved[key] = _resolveTexture(block._lazyTextures[key], rng);
      }
      block._resolvedTextures = resolved;
    }
    if (block.createMaterials) {
      block.materials = block.createMaterials(block._resolvedTextures || {});
    }
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
