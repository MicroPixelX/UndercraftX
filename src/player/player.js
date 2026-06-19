/**
 * player.js: FPS + física com colisão, água, spawn seguro
 */
import * as THREE from 'three';

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
    const fb = getBlockAt(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));
    this.isInWater = fb === 6;

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

    const g = this.isInWater ? this.waterGravity : this.gravity;
    this.velocity.y -= g*dt;
    this.velocity.y = Math.max(this.velocity.y, this.isInWater?-3:-50);

    if(this.isInWater&&this.wantJump){this.velocity.y=3;this.wantJump=false;}
    if(this.wantJump&&this.onGround&&!this.isInWater){this.velocity.y=this.jumpForce;this.onGround=false;}
    this.wantJump=false;

    const np = this.position.clone(), hw = this.width/2;
    np.x += this.velocity.x*dt;
    if(this._col(np,hw,this.height,getBlockAt)){np.x=this.position.x;this.velocity.x=0;}
    np.y += this.velocity.y*dt; this.onGround=false;
    if(this._col(np,hw,this.height,getBlockAt)){if(this.velocity.y<0)this.onGround=true;np.y=this.position.y;this.velocity.y=0;}
    np.z += this.velocity.z*dt;
    if(this._col(np,hw,this.height,getBlockAt)){np.z=this.position.z;this.velocity.z=0;}
    this.position.copy(np);

    this.camera.position.set(this.position.x,this.position.y+this.eyeHeight,this.position.z);
    this.camera.rotation.order='YXZ';
    this.camera.rotation.y=this.yaw; this.camera.rotation.x=this.pitch;
  }

  _col(pos,hw,h,gb){
    const mnX=Math.floor(pos.x-hw),mxX=Math.floor(pos.x+hw),mnY=Math.floor(pos.y),mxY=Math.floor(pos.y+h),mnZ=Math.floor(pos.z-hw),mxZ=Math.floor(pos.z+hw);
    for(let x=mnX;x<=mxX;x++)for(let y=mnY;y<=mxY;y++)for(let z=mnZ;z<=mxZ;z++){const b=gb(x,y,z);if(b!==0&&b!==6)return true;}
    return false;
  }
}
