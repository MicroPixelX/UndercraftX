/**
 * main.js: Entry point
 * + Seed input para gerar mundos diferentes
 * + Loading bar + async world building via separate modules
 *
 * FIX #1: Seed is now passed to texture generator for deterministic textures
 * FIX-O: Double-click guard on start button
 * FIX-V2: _started flag is reset after disposal so true restart is possible
 * FIX-V1: Old Player is disposed (event listeners removed) before creating new one
 */

import '../style.css';
import { Renderer } from './renderer/renderer.js';
import { Player } from './player/player.js';
import { Game } from './game.js';
import { HUD } from './ui/hud.js';
import { LoadingBar } from './ui/loadingBar.js';
import { WorldBuilder } from './world/worldBuilder.js';
import { setTextureSeed } from './blocks/index.js';
import { clearWaterMaterialCache } from './world/chunk.js';

class UndercraftX {
  constructor() {
    this.container = document.getElementById('game-container');
    this.startScreen = document.getElementById('start-screen');
    this.startBtn = document.getElementById('start-btn');
    this.seedInput = document.getElementById('seed-input');
    this.isRunning = false;
    this.lastTime = 0;
    this._started = false;
    this._init();
  }

  async _init() {
    this.renderer = new Renderer(this.container);
    this.camera = this.renderer.camera;
    this.scene = this.renderer.scene;
    this.hud = new HUD(); this.hud.hide();
    this.loadingBar = new LoadingBar();
    this.worldBuilder = new WorldBuilder(this.scene, this.renderer, this.camera);
    this.startBtn.addEventListener('click', () => this._start());
    this._onContainerClick = () => {
      if (this.isRunning) this.container.requestPointerLock();
    };
    this.container.addEventListener('click', this._onContainerClick);
    this._onPointerLockChange = () => {
      if (this.player) {
        this.player.isLocked = document.pointerLockElement === this.container;
      }
    };
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    this._onContextMenu = e => e.preventDefault();
    this.container.addEventListener('contextmenu', this._onContextMenu);
  }

  _getSeed() {
    const val = this.seedInput ? this.seedInput.value.trim() : '';
    if (!val) return 42;
    const num = parseInt(val, 10);
    return isNaN(num) ? 42 : num;
  }

  _start() {
    if (this._started) return;
    this._started = true;

    this.isRunning = false;

    const seed = this._getSeed();
    setTextureSeed(seed);

    if (this.game) {
      this.game.dispose();
      this.game = null;
    }

    if (this.player) {
      this.player.dispose();
      this.player = null;
    }

    clearWaterMaterialCache();

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.container.removeEventListener('click', this._onContainerClick);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this.container.removeEventListener('contextmenu', this._onContextMenu);

    this.startScreen.style.display = 'none';

    this.loadingBar.show(0, 'Gerando terreno...');

    this.game = new Game(this.scene, this.camera, this.container, seed);
    this.player = new Player(this.camera, this.container);

    this.container.addEventListener('click', this._onContainerClick);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    this.container.addEventListener('contextmenu', this._onContextMenu);

    const spawn = this.game.getSpawnPosition();
    this.player.spawnAt(spawn);
    this.game.updateChunks(spawn.x, spawn.z);

    this.worldBuilder.buildAsync(this.game, this.loadingBar, () => this._finishStart(seed));
  }

  _finishStart(seed) {
    this.loadingBar.hide();
    this.hud.show();
    this.hud.setSeed(seed);
    this.container.requestPointerLock();
    this.player.isLocked = true;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
    this._started = false;
  }

  _loop(now) {
    if (!this.isRunning) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.player.update(dt, (x, y, z) => this.game.getBlockAt(x, y, z));
    this.game.update(this.player.position);

    const breakResult = this.player.updateBreaking(dt, this.game);
    if (breakResult) {
      if (breakResult.action === 'break') {
        this.game.breakBlock(breakResult.x, breakResult.y, breakResult.z);
      } else if (breakResult.action === 'place') {
        const origin = this.player.getRayOrigin();
        const direction = this.player.getLookDirection();
        const hit = this.game.raycastBlock(origin, direction);
        if (hit) {
          this.game.placeBlock(hit.x, hit.y, hit.z, hit.face);
        }
      }
    }

    this.renderer.updateSky(this.camera.position);
    this.renderer.render();

    this.renderer.isUnderwater = this.player.isInWater;

    const pcx = Math.floor(this.player.position.x / 16);
    const pcz = Math.floor(this.player.position.z / 16);
    const biome = this.game.getBiomeAt(Math.floor(this.player.position.x), Math.floor(this.player.position.z));
    const breakInfo = this.player.breakTarget ? (() => {
      const origin = this.player.getRayOrigin();
      const direction = this.player.getLookDirection();
      const hit = this.game.raycastBlock(origin, direction);
      if (hit) {
        const bt = this.player.BREAK_TIMES[hit.block] ?? 1.5;
        return { progress: this.player.breakProgress, time: bt };
      }
      return null;
    })() : null;
    this.hud.update(this.player.position, { x: pcx, z: pcz }, biome, breakInfo);
    requestAnimationFrame(t => this._loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => new UndercraftX());
