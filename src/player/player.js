/**
 * player.js: FPS + física com colisão, água, spawn seguro
 *
 * FIXES:
 *  - #5: Water detection now uses BlockID.WATER instead of hardcoded === 6
 *  - #8: Collision now uses isBlockSolid() from BlockRegistry instead of hardcoded checks
 *  - #10: X-ray glitch fix — proper AABB collision with hitNormal resolution
 *  - FIX-B: Collision now resolves penetration by pushing player to block edge
 *           instead of reverting to previous position (prevents getting stuck)
 *  - FIX-C: Y-axis collision snaps player to top of block on landing
 *  - FIX-E: Ceiling collision at Y=255 — player cannot fly above world
 *  - FIX-F: Water now slows the player (liquid friction) and allows swimming up,
 *           preventing drowning when falling into deep water
 *  - FIX-J: isInWater now checks multiple columns around the player (not just center)
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
    this.walkSpeed = 4.3; this.jumpForce = 7.5; this.gravity = 22; this.waterGravity = 6;
    this.width = 0.6; this.height = 1.8; this.eyeHeight = 1.62;
    this._setup();
  }

  _setup() {
    document.addEventListener('keydown', e => this._kd(e));
    document.addEventListener('keyup', e => this._ku(e));
    document.addEventListener('mousemove', e => this._mm(e));
  }
  _kd(e){switch(e.code){case'KeyW':this.moveForward=true;break;case'KeyS':this.moveBackward=true;break;case'KeyA':this.moveLeft=true;break;case'KeyD':this.moveRight=true;break;case'Space':this.wantJump=true;break;case'Escape':if(document.pointerLockElement)document.exitPointerLock();break;}}
  _ku(e){switch(e.code){case'KeyW':this.moveForward=false;break;case'KeyS':this.moveBackward=false;break;case'KeyA':this.moveLeft=false;break;case'KeyD':this.moveRight=false;break;case'Space':this.wantJump=false;break;}}
  _mm(e){if(!this.isLocked)return;const s=0.002;this.yaw-=e.movementX*s;this.pitch-=e.movementY*s;this.pitch=Math.max(-Math.PI/2+0.01,Math.min(Math.PI/2-0.01,this.pitch));}

  update(delta, getBlockAt) {
    const dt = Math.min(delta, 0.05);

    // FIX-J: Check water across player footprint (not just center column)
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
    const waterRatio = inWaterCount / totalChecks; // 0 = none, 1 = fully submerged

    const dir = new THREE.Vector3();
    const fwd = new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw));
    const rt = new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));
    if(this.moveForward)dir.add(fwd); if(this.moveBackward)dir.sub(fwd);
    if(this.moveRight)dir.add(rt); if(this.moveLeft)dir.sub(rt);
    if(dir.length()>0)dir.normalize();

    // FIX-F: Water reduces speed and applies heavy friction
    const speed = this.isInWater ? this.walkSpeed * (0.3 + 0.2 * (1 - waterRatio)) : this.walkSpeed;
    const accel = this.isInWater ? 12 : 50;
    const fric = this.isInWater ? 8 : 12;
    this.velocity.x += dir.x*accel*dt; this.velocity.z += dir.z*accel*dt;
    this.velocity.x *= Math.max(0,1-fric*dt); this.velocity.z *= Math.max(0,1-fric*dt);
    const hs = Math.sqrt(this.velocity.x**2+this.velocity.z**2);
    if(hs>speed){this.velocity.x=(this.velocity.x/hs)*speed;this.velocity.z=(this.velocity.z/hs)*speed;}

    // Gravity — FIX-F: reduced gravity in water
    const g = this.isInWater ? this.waterGravity : this.gravity;
    this.velocity.y -= g * dt;

    // FIX-F: Water buoyancy — if fully submerged, apply upward force to prevent sinking
    if (this.isInWater) {
      // Slow terminal velocity in water
      this.velocity.y = Math.max(this.velocity.y, -2);
      // Natural buoyancy: partially counteract gravity
      if (waterRatio > 0.5) {
        this.velocity.y += 3 * dt; // buoyancy up
        this.velocity.y = Math.min(this.velocity.y, 2);
      }
    } else {
      this.velocity.y = Math.max(this.velocity.y, -50);
    }

    // Jump / swim
    if(this.isInWater && this.wantJump){
      this.velocity.y = 3;
      this.wantJump = false;
    } else if(this.wantJump && this.onGround && !this.isInWater){
      this.velocity.y = this.jumpForce;
      this.onGround = false;
      this.wantJump = false;
    } else {
      this.wantJump = false;
    }

    // FIX-B: Per-axis collision with penetration resolution
    // Instead of reverting to previous position, push the player to the edge
    // of the colliding block. This prevents getting stuck in walls/corners.
    const np = this.position.clone();

    // X axis
    np.x += this.velocity.x * dt;
    const xHit = this._findCollision(np, hw, this.height, getBlockAt);
    if (xHit) {
      // FIX-B: Push player to the nearest block edge instead of reverting
      if (this.velocity.x > 0) {
        np.x = xHit.x - hw - 0.001;
      } else {
        np.x = xHit.x + 1 + hw + 0.001;
      }
      this.velocity.x = 0;
    }

    // Y axis
    np.y += this.velocity.y * dt;
    this.onGround = false;

    // FIX-E: World floor — clamp to Y=0
    if (np.y < 0) { np.y = 0; this.velocity.y = 0; this.onGround = true; }

    // FIX-E: World ceiling — player cannot go above Y=254
    if (np.y + this.height > 255) {
      np.y = 255 - this.height;
      this.velocity.y = Math.min(this.velocity.y, 0);
    }

    const yHit = this._findCollision(np, hw, this.height, getBlockAt);
    if (yHit) {
      if (this.velocity.y < 0) {
        // FIX-C: Snap player to top of the block they're landing on
        np.y = yHit.y + 1 + 0.001;
        this.onGround = true;
      } else {
        // Hit ceiling block — push down
        np.y = yHit.y - this.height - 0.001;
      }
      this.velocity.y = 0;
    }

    // Z axis
    np.z += this.velocity.z * dt;
    const zHit = this._findCollision(np, hw, this.height, getBlockAt);
    if (zHit) {
      // FIX-B: Push player to the nearest block edge
      if (this.velocity.z > 0) {
        np.z = zHit.z - hw - 0.001;
      } else {
        np.z = zHit.z + 1 + hw + 0.001;
      }
      this.velocity.z = 0;
    }

    this.position.copy(np);

    this.camera.position.set(this.position.x,this.position.y+this.eyeHeight,this.position.z);
    this.camera.rotation.order='YXZ';
    this.camera.rotation.y=this.yaw; this.camera.rotation.x=this.pitch;
  }

  // FIX-B: Returns the first solid block the player overlaps with, or null.
  // The returned {x, y, z} are block coordinates for penetration resolution.
  _findCollision(pos, hw, h, gb) {
    const mnX = Math.floor(pos.x - hw), mxX = Math.floor(pos.x + hw);
    const mnY = Math.floor(pos.y), mxY = Math.floor(pos.y + h);
    const mnZ = Math.floor(pos.z - hw), mxZ = Math.floor(pos.z + hw);

    // Virtual floor at Y=0
    if (mnY < 0) return { x: Math.floor(pos.x), y: -1, z: Math.floor(pos.z) };

    for (let x = mnX; x <= mxX; x++)
      for (let y = mnY; y <= mxY; y++)
        for (let z = mnZ; z <= mxZ; z++) {
          // FIX-E: Treat Y >= 255 as air (world ceiling handled above)
          if (y < 0 || y >= 255) continue;
          const b = gb(x, y, z);
          if (isBlockSolid(b)) {
            const overlapX = Math.min(pos.x + hw, x + 1) - Math.max(pos.x - hw, x);
            const overlapY = Math.min(pos.y + h, y + 1) - Math.max(pos.y, y);
            const overlapZ = Math.min(pos.z + hw, z + 1) - Math.max(pos.z - hw, z);
            if (overlapX > 0.001 && overlapY > 0.001 && overlapZ > 0.001) {
              return { x, y, z };
            }
          }
        }
    return null;
  }
}
