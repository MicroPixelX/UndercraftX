/**
 * Block.js: Registry central de blocos com texturas procedurais
 *
 * FIX #1: generateTexture now accepts a seeded RNG so textures are deterministic.
 *   - Old: all block textures used Math.random() — same seed produced different textures every reload
 *   - New: generateTexture uses a seeded mulberry32 PRNG per texture
 *
 * FIX #11: Texture generation is now lazy (deferred until initBlockTextures is called).
 *   - Old: block modules called generateTexture() at module-evaluation time, BEFORE setTextureSeed()
 *   - New: block modules register a drawFn factory; textures are created inside initBlockTextures()
 *          which runs AFTER setTextureSeed(seed) in main.js — making the seed actually effective.
 */

import * as THREE from 'three';

export const BlockID = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5,
  WATER: 6, SAND: 7, BEDROCK: 8, OAK_LOG: 9, PINE_LOG: 10,
  BIRCH_LOG: 11, SAKURA_LEAVES: 12, CACTUS: 13, SNOW: 14
};

export const BlockRegistry = {};

// FIX #1: Seeded texture RNG — each block file gets a deterministic sequence
let _textureSeed = 42;

export function setTextureSeed(seed) {
  _textureSeed = seed;
}

function _texRng() {
  _textureSeed = (_textureSeed + 0x6D2B79F5) | 0;
  let t = Math.imul(_textureSeed ^ _textureSeed >>> 15, 1 | _textureSeed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// FIX #11: generateTexture now returns a lazy descriptor instead of creating the
// texture immediately. The actual CanvasTexture is created in initBlockTextures()
// after setTextureSeed() has been called with the player's chosen seed.
export function generateTexture(w, h, drawFn) {
  // Return a descriptor object that will be resolved later
  return { _lazy: true, w, h, drawFn };
}

// Internal: actually create a THREE.CanvasTexture from a lazy descriptor
function _resolveTexture(desc) {
  if (!desc || !desc._lazy) return desc; // already resolved or null
  const c = document.createElement('canvas');
  c.width = desc.w; c.height = desc.h;
  const ctx = c.getContext('2d');
  desc.drawFn(ctx, desc.w, desc.h, _texRng);
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
    // FIX #11: Store lazy texture descriptors for deferred resolution
    _lazyTextures: def._lazyTextures || null,
  };
}

export function initBlockTextures() {
  // FIX #11: Walk every registered block and resolve lazy texture descriptors
  // before calling createMaterials(). This ensures the seeded RNG is used.
  for (const [, block] of Object.entries(BlockRegistry)) {
    if (block._lazyTextures) {
      // Resolve each lazy texture descriptor into a real THREE.Texture
      const resolved = {};
      for (const [key, desc] of Object.entries(block._lazyTextures)) {
        resolved[key] = _resolveTexture(desc);
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
