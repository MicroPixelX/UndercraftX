/**
 * Block.js: Registry central de blocos com texturas procedurais
 *
 * FIXES:
 *  - #1: generateTexture now accepts a seeded RNG so textures are deterministic.
 *  - #11: Texture generation is now lazy (deferred until initBlockTextures is called).
 *  - FIX-A: initBlockTextures now iterates in sorted numeric order by BlockID
 *           instead of relying on Object.entries() order (which is not guaranteed by spec).
 *           Each block also gets its own independent seeded RNG derived from (seed + blockID),
 *           so adding/removing blocks does NOT change textures of existing blocks.
 */

import * as THREE from 'three';

export const BlockID = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5,
  WATER: 6, SAND: 7, BEDROCK: 8, OAK_LOG: 9, PINE_LOG: 10,
  BIRCH_LOG: 11, SAKURA_LEAVES: 12, CACTUS: 13, SNOW: 14
};

export const BlockRegistry = {};

// FIX-A: Global seed stored for per-block RNG derivation
let _textureSeed = 42;

export function setTextureSeed(seed) {
  _textureSeed = seed;
}

// FIX-A: Per-block seeded RNG — each block ID gets its own deterministic sequence
// derived from the global seed + block ID, so block order does not matter.
function _makeBlockRng(blockId) {
  // mulberry32 seeded with (globalSeed + blockId * large-prime)
  let s = (_textureSeed + blockId * 2654435761) | 0;
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// FIX #11: generateTexture now returns a lazy descriptor instead of creating the
// texture immediately. The actual CanvasTexture is created in initBlockTextures()
// after setTextureSeed() has been called with the player's chosen seed.
export function generateTexture(w, h, drawFn) {
  return { _lazy: true, w, h, drawFn };
}

// Internal: actually create a THREE.CanvasTexture from a lazy descriptor
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
    _lazyTextures: def._lazyTextures || null,
  };
}

export function initBlockTextures() {
  // FIX-A: Iterate in sorted numeric order by BlockID instead of Object.entries()
  // which is not guaranteed to be in insertion/numeric order by the JS spec.
  const sortedIds = Object.keys(BlockRegistry).map(Number).sort((a, b) => a - b);
  for (const id of sortedIds) {
    const block = BlockRegistry[id];
    if (block._lazyTextures) {
      // FIX-A: Each block gets its own RNG derived from (seed + blockId)
      // This ensures adding/removing blocks doesn't shift textures of other blocks
      const rng = _makeBlockRng(id);
      const resolved = {};
      // Also iterate texture keys in sorted order for determinism
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
