/**
 * Game: gerencia mundo, chunks e game loop
 */

import * as THREE from 'three';
import { Chunk } from './world/chunk.js';
import { TerrainGenerator } from './world/terrain.js';
import { BlockType } from './world/block-types.js';

const RENDER_DISTANCE = 4; // Raio em chunks
const CHUNK_SIZE = 16;

export class Game {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.chunks = new Map(); // key: "x,y,z" → Chunk
    this.terrain = new TerrainGenerator(42);

    // Centro do mundo (onde começa o jogador)
    this.centerChunkX = 0;
    this.centerChunkZ = 0;

    this.lastUpdateTime = 0;
  }

  /**
   * Gera key única para chunk
   */
  chunkKey(cx, cy, cz) {
    return `${cx},${cy},${cz}`;
  }

  /**
   * Obtém chunk num ponto global
   */
  getChunkAt(worldX, worldY, worldZ) {
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cy = Math.floor(worldY / CHUNK_SIZE);
    const cz = Math.floor(worldZ / CHUNK_SIZE);
    return this.chunks.get(this.chunkKey(cx, cy, cz));
  }

  /**
   * Obtém bloco num ponto global
   */
  getBlockAt(worldX, worldY, worldZ) {
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cy = Math.floor(worldY / CHUNK_SIZE);
    const cz = Math.floor(worldZ / CHUNK_SIZE);
    const chunk = this.chunks.get(this.chunkKey(cx, cy, cz));
    
    if (!chunk) return BlockType.AIR;

    const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    return chunk.getBlock(lx, ly, lz);
  }

  /**
   * Callback para chunk buscar vizinho (usado no mesh generation)
   */
  getNeighborForChunk(chunk, localX, localY, localZ) {
    const globalX = chunk.chunkX * CHUNK_SIZE + localX;
    const globalY = chunk.chunkY * CHUNK_SIZE + localY;
    const globalZ = chunk.chunkZ * CHUNK_SIZE + localZ;
    return this.getBlockAt(globalX, globalY, globalZ);
  }

  /**
   * Atualiza chunks carregados ao redor do jogador
   */
  updateChunks(playerX, playerZ) {
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE);
    const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE);

    // Se mudou de chunk, recarrega
    if (playerChunkX !== this.centerChunkX || playerChunkZ !== this.centerChunkZ) {
      this.centerChunkX = playerChunkX;
      this.centerChunkZ = playerChunkZ;
      this._loadChunks();
    }
  }

  /**
   * Carrega todos os chunks no render distance
   */
  _loadChunks() {
    const loaded = new Set();

    // Gera chunks num grid ao redor do centro
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const cx = this.centerChunkX + dx;
        const cz = this.centerChunkZ + dz;

        const key = this.chunkKey(cx, 0, cz);
        loaded.add(key);

        if (!this.chunks.has(key)) {
          const chunk = new Chunk(cx, 0, cz);
          this.terrain.generateChunk(chunk);
          this.chunks.set(key, chunk);
        }
      }
    }

    // Descarrega chunks distantes
    for (const [key, chunk] of this.chunks) {
      if (!loaded.has(key)) {
        chunk.dispose(this.scene);
        this.chunks.delete(key);
      }
    }

    // Rebuild meshes
    for (const [key, chunk] of this.chunks) {
      chunk.buildMesh(this.scene, (lx, ly, lz) => this.getNeighborForChunk(chunk, lx, ly, lz));
    }
  }

  /**
   * Atualiza chunks periodicamente (para physics)
   */
  update(playerPosition) {
    this.updateChunks(playerPosition.x, playerPosition.z);
  }

  /**
   * Verifica se há bloco solido nas cords
   */
  isSolidAt(worldX, worldY, worldZ) {
    const block = this.getBlockAt(
      Math.floor(worldX),
      Math.floor(worldY),
      Math.floor(worldZ)
    );
    const solidBlocks = [1, 2, 3, 4, 5, 7, 8];
    return solidBlocks.includes(block);
  }

  /**
   * Posição inicial do spawn
   */
  getSpawnPosition() {
    const height = this.terrain.getHeight(8, 8);
    return new THREE.Vector3(8, height + 3, 8);
  }
}