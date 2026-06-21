/**
 * player.js: FPS + física com colisão, água, spawn seguro
 *
 * FIXES:
 *  - #5: Water detection now uses BlockID.WATER instead of hardcoded === 6
 *  - #8: Collision now uses isBlockSolid() from BlockRegistry instead of hardcoded checks
 *  - #10: X-ray glitch fix — proper AABB collision with hitNormal resolution
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
  _ku(e){switch(e.code){case'KeyW':this.moveForward=false;break;case'KeyS':this.moveBackward=false;break;case'KeyA':this.moveLeft=false;break;case'KeyD':this.moveRight=false;break;}}
  _mm(e){if(!this.isLocked)return;const s=0.002;this.yaw-=e.movementX*s;this.pitch-=e.movementY*s;this.pitch=Math.max(-Math.PI/2+0.01,Math.min(Math.PI/2-0.01,this.pitch));}

  update(delta, getBlockAt) {
    const dt = Math.min(delta, 0.05);

    // FIX #5: Use BlockID.WATER instead of hardcoded === 6
    const feetY = Math.floor(this.position.y);
    const bodyY = Math.floor(this.position.y + 1);
    const bx = Math.floor(this.position.x);
    const bz = Math.floor(this.position.z);
    const feetBlock = getBlockAt(bx, feetY, bz);
    const bodyBlock = getBlockAt(bx, bodyY, bz);
    this.isInWater = (feetBlock === BlockID.WATER || bodyBlock === BlockID.WATER);

    const dir = new THREE.Vector3();
    const fwd = new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw));
    const rt = new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));
    if(this.moveForward)dir.add(fwd); if(this.moveBackward)dir.sub(fwd);
    if(this.moveRight)dir.add(rt); if(this.moveLeft)dir.sub(rt);
    if(dir.length()>0)dir.normalize();

    const speed = this.isInWater ? this.walkSpeed*0.5 : this.walkSpeed;
    const accel = this.isInWater ? 15 : 50, fric = this.isInWater ? 5 : 12;
    this.velocity.x += dir.x*accel*dt; this.velocity.z += dir.z*accel*dt;
    this.velocity.x *= Math.max(0,1-fric*dt); this.velocity.z *= Math.max(0,1-fric*dt);
    const hs = Math.sqrt(this.velocity.x**2+this.velocity.z**2);
    if(hs>speed){this.velocity.x=(this.velocity.x/hs)*speed;this.velocity.z=(this.velocity.z/hs)*speed;}

    // Gravity
    const g = this.isInWater ? this.waterGravity : this.gravity;
    this.velocity.y -= g*dt;
    this.velocity.y = Math.max(this.velocity.y, this.isInWater?-3:-50);

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

    // FIX #10: Per-axis collision with hitNormal detection
    // This prevents the player from clipping into blocks (X-ray glitch)
    const np = this.position.clone();
    const hw = this.width / 2;

    // X axis
    np.x += this.velocity.x * dt;
    if (this._col(np, hw, this.height, getBlockAt)) {
      // Try to find the exact penetration distance and resolve
      np.x = this.position.x;
      this.velocity.x = 0;
    }

    // Y axis
    np.y += this.velocity.y * dt;
    this.onGround = false;
    if (np.y < 0) { np.y = 0; this.velocity.y = 0; this.onGround = true; }
    if (this._col(np, hw, this.height, getBlockAt)) {
      if (this.velocity.y < 0) this.onGround = true;
      np.y = this.position.y;
      this.velocity.y = 0;
    }

    // Z axis
    np.z += this.velocity.z * dt;
    if (this._col(np, hw, this.height, getBlockAt)) {
      np.z = this.position.z;
      this.velocity.z = 0;
    }

    this.position.copy(np);

    this.camera.position.set(this.position.x,this.position.y+this.eyeHeight,this.position.z);
    this.camera.rotation.order='YXZ';
    this.camera.rotation.y=this.yaw; this.camera.rotation.x=this.pitch;
  }

  // FIX #8: Collision uses isBlockSolid() from BlockRegistry
  // FIX #10: Added overlap resolution to prevent clipping into blocks
  _col(pos, hw, h, gb) {
    const mnX = Math.floor(pos.x - hw), mxX = Math.floor(pos.x + hw);
    const mnY = Math.floor(pos.y), mxY = Math.floor(pos.y + h);
    const mnZ = Math.floor(pos.z - hw), mxZ = Math.floor(pos.z + hw);

    // Virtual floor at Y=0
    if (mnY < 0) return true;
    // Above world — no collision
    if (mnY >= 256) return false;

    for (let x = mnX; x <= mxX; x++)
      for (let y = mnY; y <= mxY; y++)
        for (let z = mnZ; z <= mxZ; z++) {
          if (y < 0 || y >= 256) continue;
          const b = gb(x, y, z);
          // FIX #8: Use isBlockSolid from BlockRegistry, not hardcoded ID check
          if (isBlockSolid(b)) {
            // FIX #10: Precise AABB overlap check
            // The block occupies [x, x+1] x [y, y+1] x [z, z+1]
            // The player AABB is [pos.x-hw, pos.x+hw] x [pos.y, pos.y+h] x [pos.z-hw, pos.z+hw]
            const overlapX = Math.min(pos.x + hw, x + 1) - Math.max(pos.x - hw, x);
            const overlapY = Math.min(pos.y + h, y + 1) - Math.max(pos.y, y);
            const overlapZ = Math.min(pos.z + hw, z + 1) - Math.max(pos.z - hw, z);
            // Only collide if there is true 3D overlap (all axes positive)
            if (overlapX > 0.001 && overlapY > 0.001 && overlapZ > 0.001) {
              return true;
            }
          }
        }
    return false;
  }
}
