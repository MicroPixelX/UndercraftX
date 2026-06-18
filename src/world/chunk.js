/**
 * Chunk:bloco 16x16x16
 * Responsável por armazenar blocos e gerar mesh
 */

import * as THREE from 'three';
import { BlockData, isBlockSolid, getBlockColor, BlockType } from './block-types.js';

const CHUNK_SIZE = 16;

export class Chunk {
  constructor(chunkX, chunkY, chunkZ) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.chunkZ = chunkZ;
    
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
    this.mesh = null;
    this.dirty = true;
  }

  /**
   * Converte coords locais (0-15) → índice único
   */
  localToIndex(x, y, z) {
    return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
  }

  /**
   * Converte coords locais → coords globais (float)
   */
  localToGlobal(x, y, z) {
    return {
      x: this.chunkX * CHUNK_SIZE + x,
      y: this.chunkY * CHUNK_SIZE + y,
      z: this.chunkZ * CHUNK_SIZE + z
    };
  }

  /**
   * Define tipo de bloco em coords locais
   */
  setBlock(x, y, z, blockType) {
    if (x < 0 || x >= CHUNK_SIZE || 
        y < 0 || y >= CHUNK_SIZE || 
        z < 0 || z >= CHUNK_SIZE) return;
    
    this.blocks[this.localToIndex(x, y, z)] = blockType;
    this.dirty = true;
  }

  /**
   * Obtém tipo de bloco em coords locais
   */
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || 
        y < 0 || y >= CHUNK_SIZE || 
        z < 0 || z >= CHUNK_SIZE) return BlockType.AIR;
    
    return this.blocks[this.localToIndex(x, y, z)];
  }

  /**
   * Verifica se bloco é visível (tem face exposta)
   */
  hasExposedFace(x, y, z, getNeighbor) {
    const block = this.getBlock(x, y, z);
    if (block === BlockType.AIR) return false;
    if (!isBlockSolid(block)) return false;

    // Verifica as 6 direções
    const neighbors = [
      [x - 1, y, z],
      [x + 1, y, z],
      [x, y - 1, z],
      [x, y + 1, z],
      [x, y, z - 1],
      [x, y, z + 1]
    ];

    for (const [nx, ny, nz] of neighbors) {
      const neighborBlock = getNeighbor(nx, ny, nz);
      if (neighborBlock === BlockType.AIR || !isBlockSolid(neighborBlock)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gera buffer geometry otimizado (apenas faces visíveis)
   */
  generateMesh(getNeighbor) {
    const positions = [];
    const colors = [];
    const indices = [];

    // Geometria do cubo (6 faces, 4 vértices cada)
    const faceOffsets = [
      { dir: [0, 1, 0], face: 'top', vertices: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },    // Top
      { dir: [0, -1, 0], face: 'bottom', vertices: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] }, // Bottom
      { dir: [1, 0, 0], face: 'side', vertices: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },    // Right
      { dir: [-1, 0, 0], face: 'side', vertices: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },   // Left
      { dir: [0, 0, 1], face: 'side', vertices: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },    // Front
      { dir: [0, 0, -1], face: 'side', vertices: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] }    // Back
    ];

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = this.getBlock(x, y, z);
          if (block === BlockType.AIR) continue;
          if (!isBlockSolid(block)) continue;

          const blockData = BlockData[block];
          if (!blockData) continue;

          const gx = this.chunkX * CHUNK_SIZE + x;
          const gy = this.chunkY * CHUNK_SIZE + y;
          const gz = this.chunkZ * CHUNK_SIZE + z;

          // Para cada face do cubo
          for (let f = 0; f < 6; f++) {
            const { dir, face, vertices } = faceOffsets[f];
            const nx = x + dir[0];
            const ny = y + dir[1];
            const nz = z + dir[2];

            const neighborBlock = getNeighbor(nx, ny, nz);

            // Se vizinho é sólido e não transparente, skipa essa face
            if (isBlockSolid(neighborBlock) && !blockData.transparent) {
              continue;
            }

            // Se bloco atual é transparente MAS vizinho também é, skipa
            if (blockData.transparent && neighborBlock !== BlockType.AIR) {
              continue;
            }

            const baseIndex = positions.length / 3;
            const color = getBlockColor(block, face);

            // 4 vértices da face
            for (const v of vertices) {
              positions.push(gx + v[0], gy + v[1], gz + v[2]);
              colors.push((color >> 16 & 255) / 255, (color >> 8 & 255) / 255, (color & 255) / 255);
            }

            // 2 triângulos (4 vértices em Winding order)
            indices.push(
              baseIndex, baseIndex + 1, baseIndex + 2,
              baseIndex, baseIndex + 2, baseIndex + 3
            );
          }
        }
      }
    }

    if (positions.length === 0) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Desenha o chunk (cria ou atualiza mesh)
   */
  buildMesh(scene, getNeighbor) {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    const geometry = this.generateMesh(getNeighbor);
    if (!geometry) return;

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.FrontSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    scene.add(this.mesh);
    this.dirty = false;
  }

  /**
   * Remove mesh da cena
   */
  dispose(scene) {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
  }
}