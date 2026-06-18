/**
 * Player: movimento FPS + física simples
 */

import * as THREE from 'three';

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Posição e movimento
    this.position = new THREE.Vector3(8, 30, 8);
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    // Rotação (Euler)
    this.pitch = 0;
    this.yaw = 0;

    // Controles
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.jump = false;
    this.canJump = true;
    this.isLocked = false;

    // Config física
    this.speed = 5;
    this.jumpForce = 8;
    this.gravity = 20;
    this.onGround = false;

    this._setupControls();
  }

  _setupControls() {
    document.addEventListener('keydown', (e) => this._onKeyDown(e));
    document.addEventListener('keyup', (e) => this._onKeyUp(e));
    document.addEventListener('mousemove', (e) => this._onMouseMove(e));
  }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'Space':
        this.jump = true;
        break;
      case 'Escape':
        this.isLocked = false;
        this.domElement.requestPointerLock?.();
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
    }
  }

  _onMouseMove(e) {
    if (!this.isLocked) return;

    const sensitivity = 0.002;
    this.yaw -= e.movementX * sensitivity;
    this.pitch -= e.movementY * sensitivity;
    
    // Clamp pitch
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
  }

  /**
   * Atualiza câmera com rotação
   */
  updateRotation() {
    // Yaw → rotação no eixo Y
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  /**
   * Atualiza física e movimento
   */
  update(delta, getBlockAt) {
    // --- Movimento horizontal ---
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );
    const right = new THREE.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );

    if (this.moveForward) direction.add(forward);
    if (this.moveBackward) direction.sub(forward);
    if (this.moveRight) direction.add(right);
    if (this.moveLeft) direction.sub(right);

    if (direction.length() > 0) {
      direction.normalize();
    }

    // Aceleração
    const accel = 50;
    const friction = 10;

    this.velocity.x += direction.x * accel * delta;
    this.velocity.z += direction.z * accel * delta;

    // Fricção
    this.velocity.x *= Math.max(0, 1 - friction * delta);
    this.velocity.z *= Math.max(0, 1 - friction * delta);

    // Limita velocidade
    const horizSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (horizSpeed > this.speed) {
      this.velocity.x = (this.velocity.x / horizSpeed) * this.speed;
      this.velocity.z = (this.velocity.z / horizSpeed) * this.speed;
    }

    // --- Gravidade ---
    this.velocity.y -= this.gravity * delta;
    this.velocity.y = Math.max(this.velocity.y, -50);

    // --- Pulo ---
    if (this.jump && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }
    this.jump = false;

    // --- Colisão simples ---
    const newPos = this.position.clone();
    const playerWidth = 0.3;
    const playerHeight = 1.7;

    // X
    newPos.x += this.velocity.x * delta;
    if (this._checkCollision(newPos, playerWidth, playerHeight, getBlockAt)) {
      newPos.x = this.position.x;
      this.velocity.x = 0;
    }

    // Y
    newPos.y += this.velocity.y * delta;
    this.onGround = false;
    if (this._checkCollision(newPos, playerWidth, playerHeight, getBlockAt)) {
      if (this.velocity.y < 0) {
        // Caindo → grounded
        this.onGround = true;
      }
      newPos.y = this.position.y;
      this.velocity.y = 0;
    }

    // Z
    newPos.z += this.velocity.z * delta;
    if (this._checkCollision(newPos, playerWidth, playerHeight, getBlockAt)) {
      newPos.z = this.position.z;
      this.velocity.z = 0;
    }

    // Aplica
    this.position.copy(newPos);

    // Posição câmera (olhos a 1.6m do chão)
    this.camera.position.set(this.position.x, this.position.y + 1.5, this.position.z);
    this.updateRotation();
  }

  /**
   * Verifica colisão com blocos sólidos num raio
   */
  _checkCollision(pos, halfWidth, height, getBlockAt) {
    const minX = Math.floor(pos.x - halfWidth);
    const maxX = Math.floor(pos.x + halfWidth);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + height);
    const minZ = Math.floor(pos.z - halfWidth);
    const maxZ = Math.floor(pos.z + halfWidth);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = getBlockAt(x, y, z);
          if (this._isSolid(block)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  _isSolid(blockType) {
    const solidBlocks = [1, 2, 3, 4, 5, 7, 8];
    return solidBlocks.includes(blockType);
  }

  /**
   * Posição dos pés (para raycasting)
   */
  getFeetPosition() {
    return this.position.clone();
  }

  /**
   * Posição dos olhos
   */
  getEyePosition() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + 1.5,
      this.position.z
    );
  }

  /**
   * Direção do olhar
   */
  getLookDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(this.camera.rotation);
    return dir;
  }
}