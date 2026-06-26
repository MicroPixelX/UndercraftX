/**
 * Block.js: Registry central de blocos
 */

export const BlockID = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5,
  WATER: 6, SAND: 7, BEDROCK: 8, OAK_LOG: 9, PINE_LOG: 10,
  BIRCH_LOG: 11, SAKURA_LEAVES: 12, CACTUS: 13, SNOW: 14
};

export const BlockRegistry = {};

export function registerBlock(id, def) {
  BlockRegistry[id] = {
    id, name: def.name || '?', solid: def.solid ?? true,
    transparent: def.transparent || false, opacity: def.opacity ?? 1,
  };
}

export function isBlockSolid(id) {
  if (id === BlockID.AIR) return false;
  return BlockRegistry[id]?.solid ?? false;
}

export function isBlockTransparent(id) {
  if (id === BlockID.AIR) return true;
  return BlockRegistry[id]?.transparent ?? false;
}
