/**
 * Definição dos tipos de blocos do voxel engine
 */

export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  WATER: 6,
  SAND: 7,
  BEDROCK: 8
};

export const BlockData = {
  [BlockType.AIR]: {
    name: 'Ar',
    solid: false,
    transparent: true
  },
  [BlockType.GRASS]: {
    name: 'Grama',
    color: 0x4a8f29,
    topColor: 0x5da32e,
    solid: true,
    transparent: false
  },
  [BlockType.DIRT]: {
    name: 'Terra',
    color: 0x8b5a2b,
    solid: true,
    transparent: false
  },
  [BlockType.STONE]: {
    name: 'Pedra',
    color: 0x808080,
    solid: true,
    transparent: false
  },
  [BlockType.WOOD]: {
    name: 'Madeira',
    color: 0x8b4513,
    solid: true,
    transparent: false
  },
  [BlockType.LEAVES]: {
    name: 'Folhas',
    color: 0x228b22,
    solid: true,
    transparent: true
  },
  [BlockType.WATER]: {
    name: 'Água',
    color: 0x4169e1,
    solid: false,
    transparent: true
  },
  [BlockType.SAND]: {
    name: 'Areia',
    color: 0xc2b280,
    solid: true,
    transparent: false
  },
  [BlockType.BEDROCK]: {
    name: 'Bedrock',
    color: 0x1a1a1a,
    solid: true,
    transparent: false
  }
};

/**
 * Retorna a cor de um bloco para uma face específica
 */
export function getBlockColor(blockType, face = 'all') {
  const data = BlockData[blockType];
  if (!data) return 0xffffff;
  
  if (face === 'top' && data.topColor) {
    return data.topColor;
  }
  return data.color;
}

export function isBlockSolid(blockType) {
  return BlockData[blockType]?.solid ?? false;
}

export function isBlockTransparent(blockType) {
  return BlockData[blockType]?.transparent ?? true;
}