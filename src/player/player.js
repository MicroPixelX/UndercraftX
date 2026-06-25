/**
 * player.js: FPS + física com colisão, água, spawn seguro
 *
 * FIXES:
 *  - #5: Water detection uses BlockID.WATER
 *  - #8: Collision uses isBlockSolid()
 *  - #10: X-ray glitch fix — proper AABB collision
 *  - FIX-B: Collision resolves penetration by pushing player to block edge
 *  - FIX-C: Y-axis collision snaps player to top of block on landing
 *  - FIX-E: Ceiling collision at Y=255
 *  - FIX-F: Water slows the player and allows swimming up
 *  - FIX-J: isInWater checks multiple columns around the player
 *  - FIX-L: wantJump is now reset on Space keyup
 *  - FIX-M: _findCollisionAxis finds block with smallest penetration on tested axis
 *  - FIX-N: Virtual floor at Y=0 handled by simple clamp
 *  - FIX-V1: dispose() removes event listeners — prevents leak + duplicate input on restart
 *  - FIX-V7: Water jump uses Math.max instead of hard-set — smoother swimming
 */

import * as THREE from 'three';
import { BlockID, isBlockSolid, isBlockTransparent } from '../blocks/Block.js';

export class Player {
  constructor(camera, dom) {
    this.camera = camera; this.domElement = dom;
    this.position = new THREE.Vector3(8, 50, 8);
    this.velocity = new THREE.Vector3();
    this.pitch = 0; this.yaw = 0;
    this.moveForward = this.moveBackward = this.moveLeft = this.moveRight = false;
    this.wantJump = false; this.isLocked = false; this.onGround = false; this.isInWater = false;
    this.sprinting = false;
    this.walkSpeed = 4.3; this.sprintSpeed = 6.5; this.jumpForce = 7.5; this.gravity = 22; this.waterGravity = 6;
    this.width = 0.6; this.height = 1.8; this.eyeHeight = 1.62;
    this._np = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._fwd = new THREE.Vector3();
    this._rt = new THREE.Vector3();
    // FIX-V1: Store bound references so we can remove them in dispose()
    this._kd = this._onKeyDown.bind(this);
    this._ku = this._onKeyUp.bind(this);
    this._mm = this._onMouseMove.bind(this);
    this._setup();
  }

  _setup() {
    document.addEventListener('keydown', this._kd);
    document.addEventListener('keyup', this._ku);
    document.addEventListener('mousemove', this._mm);
  }

  // FIX-V1: Remove all event listeners — call before creating a new Player
  dispose() {
    document.removeEventListener('keydown', this._kd);
    document.removeEventListener('keyup', this._ku);
    document.removeEventListener('mousemove', this._mm);
    this.isLocked = false;
  }

  _onKeyDown(e) {
    switch(e.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'Space': this.wantJump = true; break;
      case 'ShiftLeft': case 'ShiftRight': this.sprinting = true; break;
      case 'Escape': if (document.pointerLockElement) document.exitPointerLock(); break;
    }
  }

  _onKeyUp(e) {
    switch(e.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
      case 'Space': this.wantJump = false; break;
      case 'ShiftLeft': case 'ShiftRight': this.sprinting = false; break;
    }
  }

  _onMouseMove(e) {
    if (!this.isLocked) return;
    const s = 0.002;
    this.yaw -= e.movementX * s;
    this.pitch -= e.movementY * s;
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
  }

  update(delta, getBlockAt) {
    const dt = Math.min(delta, 0.05);

    const hw = this.width / 2;
    const feetY = Math.floor(this.position.y);
    const bodyY = Math.floor(this.position.y + 1);
    const mnX = Math.floor(this.position.x - hw);
    const mxX = Math.floor(this.position.x + hw);
    const mnZ = Math.floor(this.position.z - hw);
    const mxZ = Math.floor(this.position.z + hw);
    let inWaterCount = 0;
    for (let wx = mnX; wx <= mxX; wx++)
      for (let wz = mnZ; wz <= mxZ; wz++) {
        if (getBlockAt(wx, feetY, wz) === BlockID.WATER) inWaterCount++;
        if (getBlockAt(wx, bodyY, wz) === BlockID.WATER) inWaterCount++;
      }
    const totalChecks = (mxX - mnX + 1) * (mxZ - mnZ + 1) * 2;
    this.isInWater = inWaterCount > 0;
    const waterRatio = inWaterCount / totalChecks;

    const dir = this._dir.set(0,0,0);
    const fwd = this._fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const rt = this._rt.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    if (this.moveForward) dir.add(fwd);
    if (this.moveBackward) dir.sub(fwd);
    if (this.moveRight) dir.add(rt);
    if (this.moveLeft) dir.sub(rt);
    if (dir.length() > 0) dir.normalize();

    const speed = this.sprinting ? this.sprintSpeed : (this.isInWater ? this.walkSpeed * (0.3 + 0.2 * (1 - waterRatio)) : this.walkSpeed);
    const accel = this.isInWater ? 12 : 50;
    const fric = this.isInWater ? 8 : 12;
    this.velocity.x += dir.x * accel * dt;
    this.velocity.z += dir.z * accel * dt;
    this.velocity.x *= Math.max(0, 1 - fric * dt);
    this.velocity.z *= Math.max(0, 1 - fric * dt);
    const hs = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (hs > speed) { this.velocity.x = (this.velocity.x / hs) * speed; this.velocity.z = (this.velocity.z / hs) * speed; }

    const g = this.isInWater ? this.waterGravity : this.gravity;
    this.velocity.y -= g * dt;

    if (this.isInWater) {
      this.velocity.y = Math.max(this.velocity.y, -2);
      if (waterRatio > 0.5) {
        this.velocity.y += 3 * dt;
        this.velocity.y = Math.min(this.velocity.y, 2);
      }
    } else {
      this.velocity.y = Math.max(this.velocity.y, -50);
    }

    // FIX-V7: Water jump uses Math.max instead of hard-set — smoother swimming
    if (this.isInWater && this.wantJump) {
      this.velocity.y = Math.max(this.velocity.y, 3);
    } else if (this.wantJump && this.onGround && !this.isInWater) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }

    const np = this._np.copy(this.position);

    np.x += this.velocity.x * dt;
    const xHit = this._findCollisionAxis(np, hw, this.height, getBlockAt, 'x');
    if (xHit) {
      if (this.velocity.x > 0) {
        np.x = xHit.blockCoord - hw - 0.001;
      } else {
        np.x = xHit.blockCoord + 1 + hw + 0.001;
      }
      this.velocity.x = 0;
    }

    np.y += this.velocity.y * dt;
    this.onGround = false;

    if (np.y < 0) { np.y = 0; this.velocity.y = 0; this.onGround = true; }

    if (np.y + this.height > 255) {
      np.y = 255 - this.height;
      this.velocity.y = Math.min(this.velocity.y, 0);
    }

    const yHit = this._findCollisionAxis(np, hw, this.height, getBlockAt, 'y');
    if (yHit) {
      if (this.velocity.y < 0) {
        np.y = yHit.blockCoord + 1 + 0.001;
        this.onGround = true;
      } else {
        np.y = yHit.blockCoord - this.height - 0.001;
      }
      this.velocity.y = 0;
    }

    np.z += this.velocity.z * dt;
    const zHit = this._findCollisionAxis(np, hw, this.height, getBlockAt, 'z');
    if (zHit) {
      if (this.velocity.z > 0) {
        np.z = zHit.blockCoord - hw - 0.001;
      } else {
        np.z = zHit.blockCoord + 1 + hw + 0.001;
      }
      this.velocity.z = 0;
    }

    this.position.copy(np);

    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  _findCollisionAxis(pos, hw, h, gb, axis) {
    const mnX = Math.floor(pos.x - hw), mxX = Math.floor(pos.x + hw);
    const mnY = Math.floor(pos.y), mxY = Math.floor(pos.y + h);
    const mnZ = Math.floor(pos.z - hw), mxZ = Math.floor(pos.z + hw);

    let bestBlock = null;
    let bestPen = Infinity;

    for (let x = mnX; x <= mxX; x++)
      for (let y = mnY; y <= mxY; y++)
        for (let z = mnZ; z <= mxZ; z++) {
          if (y < 0 || y >= 256) continue;
          const b = gb(x, y, z);
          if (isBlockSolid(b)) {
            const overlapX = Math.min(pos.x + hw, x + 1) - Math.max(pos.x - hw, x);
            const overlapY = Math.min(pos.y + h, y + 1) - Math.max(pos.y, y);
            const overlapZ = Math.min(pos.z + hw, z + 1) - Math.max(pos.z - hw, z);
            if (overlapX > 0.001 && overlapY > 0.001 && overlapZ > 0.001) {
              let pen;
              if (axis === 'x') pen = overlapX;
              else if (axis === 'y') pen = overlapY;
              else pen = overlapZ;

              if (pen < bestPen) {
                bestPen = pen;
                bestBlock = { blockCoord: axis === 'x' ? x : axis === 'y' ? y : z };
              }
            }
          }
        }
    return bestBlock;
  }

  _findCollision(pos, hw, h, gb) {
    return this._findCollisionAxis(pos, hw, h, gb, 'y');
  }
}
