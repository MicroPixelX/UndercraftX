/**
 * main.js: Entry point
 * + Seed input para gerar mundos diferentes
 *
 * FIX #1: Seed is now passed to texture generator for deterministic textures
 * FIX-O: Double-click guard on start button — prevents creating duplicate
 *        Game/Player instances and leaking old chunk meshes from memory
 */

import '../style.css';
import { Renderer } from './renderer/renderer.js';
import { Player } from './player/player.js';
import { Game } from './game.js';
import { HUD } from './ui/hud.js';
import { setTextureSeed } from './blocks/index.js';

class UndercraftX {
  constructor() {
    this.container = document.getElementById('game-container');
    this.startScreen = document.getElementById('start-screen');
    this.startBtn = document.getElementById('start-btn');
    this.seedInput = document.getElementById('seed-input');
    this.isRunning = false; this.lastTime = 0;
    this._started = false; // FIX-O: Guard against double-click
    this._init();
  }

  async _init() {
    this.renderer = new Renderer(this.container);
    this.camera = this.renderer.camera;
    this.scene = this.renderer.scene;
    this.hud = new HUD(); this.hud.hide();
    this.startBtn.addEventListener('click', () => this._start());
    this.container.addEventListener('click', () => {
      if (this.isRunning) this.container.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      if (this.player) {
        this.player.isLocked = document.pointerLockElement === this.container;
      }
    });
    this.container.addEventListener('contextmenu', e => e.preventDefault());
  }

  _getSeed() {
    const val = this.seedInput ? this.seedInput.value.trim() : '';
    if (!val) return 42;
    const num = parseInt(val, 10);
    if (!isNaN(num) && val === String(num)) return num;
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      const ch = val.charCodeAt(i);
      hash = ((hash << 5) - hash + ch) | 0;
    }
    return Math.abs(hash) || 42;
  }

  _start() {
    // FIX-O: Prevent double-click from creating duplicate Game/Player
    if (this._started) return;
    this._started = true;

    const seed = this._getSeed();

    setTextureSeed(seed);

    // FIX-O: Dispose old game if restarting (future-proofing)
    if (this.game) {
      this.game.dispose();
      this.game = null;
    }

    this.startScreen.style.display = 'none';
    this.hud.show();
    this.game = new Game(this.scene, this.camera, this.container, seed);
    this.player = new Player(this.camera, this.container);
    const spawn = this.game.getSpawnPosition();
    this.player.position.copy(spawn);
    this.game.updateChunks(spawn.x, spawn.z);
    this.container.requestPointerLock();
    this.player.isLocked = true;
    this.isRunning = true; this.lastTime = performance.now();
    this.hud.setSeed(seed);
    requestAnimationFrame(t => this._loop(t));
  }

  _loop(now) {
    if (!this.isRunning) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.player.update(dt, (x,y,z) => this.game.getBlockAt(x,y,z));
    this.game.update(this.player.position);
    this.renderer.updateSky(this.camera.position);
    this.renderer.render();
    const pcx = Math.floor(this.player.position.x/16), pcz = Math.floor(this.player.position.z/16);
    const biome = this.game.getBiomeAt(Math.floor(this.player.position.x), Math.floor(this.player.position.z));
    this.hud.update(this.player.position, {x:pcx,z:pcz}, biome);
    requestAnimationFrame(t => this._loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => new UndercraftX());
