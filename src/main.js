/**
 * main.js: entry point da aplicação
 */

import './style.css';
import { Renderer } from './renderer/renderer.js';
import { Player } from './player/player.js';
import { Game } from './game.js';
import { HUD } from './ui/hud.js';

class UndercraftX {
  constructor() {
    this.container = document.getElementById('game-container');
    this.startScreen = document.getElementById('start-screen');
    this.startBtn = document.getElementById('start-btn');

    this.isRunning = false;
    this.lastTime = 0;

    this._init();
  }

  async _init() {
    // Renderer
    this.renderer = new Renderer(this.container);
    this.camera = this.renderer.camera;
    this.scene = this.renderer.scene;

    // HUD
    this.hud = new HUD();
    this.hud.hide();

    // Não inicia ainda — espera clique
    this.startBtn.addEventListener('click', () => this._start());

    // Pointer lock no click no canvas
    this.container.addEventListener('click', () => {
      if (this.isRunning) {
        this.container.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.player.isLocked = document.pointerLockElement === this.container;
    });
  }

  _start() {
    // Esconde tela inicial
    this.startScreen.style.display = 'none';
    this.hud.show();

    // Game world
    this.game = new Game(this.scene, this.camera, this.container);

    // Player
    this.player = new Player(this.camera, this.container);
    const spawn = this.game.getSpawnPosition();
    this.player.position.copy(spawn);

    // Inicializa chunks
    this.game.updateChunks(spawn.x, spawn.z);

    // Lock pointer
    this.container.requestPointerLock();
    this.player.isLocked = true;

    // Flag + loop
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _loop(currentTime) {
    if (!this.isRunning) return;

    // Delta time (segundos)
    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Update player (com física e colisão)
    this.player.update(delta, (x, y, z) => this.game.getBlockAt(x, y, z));

    // Update world (carrega/descarrega chunks)
    this.game.update(this.player.position);

    // Update renderer
    this.renderer.updateSky(this.camera.position);
    this.renderer.render();

    // Update HUD
    const playerChunkX = Math.floor(this.player.position.x / 16);
    const playerChunkZ = Math.floor(this.player.position.z / 16);
    this.hud.update(this.player.position, { x: playerChunkX, z: playerChunkZ });

    // Next frame
    requestAnimationFrame((t) => this._loop(t));
  }
}

// Inicia quando DOM carregado
window.addEventListener('DOMContentLoaded', () => {
  new UndercraftX();
});