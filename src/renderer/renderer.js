/**
 * renderer.js: Three.js + skybox shader + fog alinhado
 * FIX-R: Sky gradient now uses camera-relative coordinates
 * FIX-V5: MSAA antialiasing disabled — contradicts the pixelated
 *         NearestFilter aesthetic of the voxel textures
 */

import * as THREE from 'three';

const RD = 4, CS = 16;
const FOG_S = (RD-1)*CS, FOG_E = RD*CS;

export class Renderer {
  constructor(container) {
    this.container = container;
    this.threeRenderer = new THREE.WebGLRenderer({ antialias: false });
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
    this.threeRenderer.setClearColor(0x87CEEB);
    container.appendChild(this.threeRenderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, FOG_E*1.5);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87CEEB, FOG_S, FOG_E);

    this.amb = new THREE.AmbientLight(0x8899bb, 0.5); this.scene.add(this.amb);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.2); this.sun.position.set(100,200,100); this.scene.add(this.sun);
    this.hemi = new THREE.HemisphereLight(0x87CEEB, 0x8b5a2b, 0.3); this.scene.add(this.hemi);

    this.dayTime = 0;
    this.daySpeed = 0.008;

    this._fogDay = new THREE.Color(0x87CEEB);
    this._fogNight = new THREE.Color(0x1a1a3e);
    this._topDay = new THREE.Color(0x0077ff);
    this._topNight = new THREE.Color(0x0a0a2a);
    this._botDay = new THREE.Color(0x87CEEB);
    this._botNight = new THREE.Color(0x1a1a3e);
    this._lastDayCycle = -1;

    const sg = new THREE.SphereGeometry(FOG_E*1.4, 16, 8);
    const sm = new THREE.ShaderMaterial({
      uniforms: {
        top:{value:new THREE.Color(0x0077ff)},
        bot:{value:new THREE.Color(0x87CEEB)},
        off:{value:33},
        exp:{value:0.6},
        camPos: {value: new THREE.Vector3(0, 64, 0)}
      },
      vertexShader: `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform vec3 top,bot,camPos;uniform float off,exp;varying vec3 vW;void main(){vec3 rel=vW-camPos;float h=normalize(rel+vec3(0.,off,0.)).y;gl_FragColor=vec4(mix(bot,top,max(pow(max(h,0.),exp),0.)),1.);}`,
      side: THREE.BackSide, depthWrite: false
    });
    this.sky = new THREE.Mesh(sg, sm);
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);

    this._sunObj = null;
    this._moonObj = null;
    this._createSun();

    this._cloudGroup = null;
    this._cloudTime = 0;
    this._createClouds();

    this._onResize = () => this._r();
    window.addEventListener('resize', this._onResize);
  }

  _createSun() {
    const sunGeo = new THREE.SphereGeometry(8, 8, 8);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffee44 });
    this._sunObj = new THREE.Mesh(sunGeo, sunMat);
    this._sunObj.renderOrder = -2;
    this.scene.add(this._sunObj);

    const moonGeo = new THREE.SphereGeometry(5, 8, 8);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xccccee });
    this._moonObj = new THREE.Mesh(moonGeo, moonMat);
    this._moonObj.renderOrder = -2;
    this.scene.add(this._moonObj);
  }

  _createClouds() {
    this._cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.7,
      side: THREE.DoubleSide, depthWrite: false,
    });

    const rng = this._cloudRng(42);
    for (let i = 0; i < 35; i++) {
      const cloudGeo = new THREE.PlaneGeometry(
        12 + rng() * 20,
        12 + rng() * 20
      );
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (rng() - 0.5) * FOG_E * 2,
        100 + rng() * 20,
        (rng() - 0.5) * FOG_E * 2
      );
      cloud.rotation.x = -Math.PI / 2;
      cloud.renderOrder = -1;
      this._cloudGroup.add(cloud);
    }
    this.scene.add(this._cloudGroup);
  }

  _cloudRng(seed) {
    let s = seed | 0;
    return function() {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  _r(){this.camera.aspect=window.innerWidth/window.innerHeight;this.camera.updateProjectionMatrix();this.threeRenderer.setSize(window.innerWidth,window.innerHeight);}
  render(){this.threeRenderer.render(this.scene,this.camera);}
  updateSky(p){
    this.sky.position.copy(p);
    this.sky.material.uniforms.camPos.value.copy(p);

    this.dayTime += this.daySpeed;
    const cycle = (Math.sin(this.dayTime) + 1) * 0.5;
    const cycleQ = Math.round(cycle * 20) / 20;
    if (cycleQ !== this._lastDayCycle) {
      this._lastDayCycle = cycleQ;
      const sunI = 0.6 + cycleQ * 0.6;
      const ambI = 0.2 + cycleQ * 0.35;
      this.sun.intensity = sunI;
      this.amb.intensity = ambI;
      this.scene.fog.color.lerpColors(this._fogNight, this._fogDay, cycleQ);
      this.threeRenderer.setClearColor(this.scene.fog.color);
      this.sky.material.uniforms.top.value.lerpColors(this._topNight, this._topDay, cycleQ);
      this.sky.material.uniforms.bot.value.lerpColors(this._botNight, this._botDay, cycleQ);

      if (this._sunObj) {
        this._sunObj.visible = cycleQ > 0.15;
        this._sunObj.material.color.setHex(cycleQ > 0.3 ? 0xffee44 : 0xff8822);
      }
      if (this._moonObj) {
        this._moonObj.visible = cycleQ < 0.4;
      }
    }

    const sunAngle = this.dayTime * 0.3;
    const sunDist = FOG_E * 0.8;
    if (this._sunObj) {
      this._sunObj.position.set(
        p.x + Math.cos(sunAngle) * sunDist,
        p.y + Math.sin(sunAngle) * sunDist,
        p.z
      );
    }
    if (this._moonObj) {
      this._moonObj.position.set(
        p.x + Math.cos(sunAngle + Math.PI) * sunDist,
        p.y + Math.sin(sunAngle + Math.PI) * sunDist,
        p.z
      );
    }

    this._cloudTime += 0.02;
    if (this._cloudGroup) {
      this._cloudGroup.position.set(
        p.x + Math.sin(this._cloudTime * 0.1) * 10,
        0,
        p.z + Math.cos(this._cloudTime * 0.08) * 8
      );
      const cloudAlpha = 0.3 + cycleQ * 0.45;
      this._cloudGroup.traverse(c => {
        if (c.material && c.material.opacity !== undefined) c.material.opacity = cloudAlpha;
      });
    }
  }
  dispose(){
    window.removeEventListener('resize',this._onResize);
    if (this._sunObj) { this.scene.remove(this._sunObj); this._sunObj.geometry.dispose(); this._sunObj.material.dispose(); this._sunObj = null; }
    if (this._moonObj) { this.scene.remove(this._moonObj); this._moonObj.geometry.dispose(); this._moonObj.material.dispose(); this._moonObj = null; }
    if (this._cloudGroup) {
      this._cloudGroup.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
      this.scene.remove(this._cloudGroup);
      this._cloudGroup = null;
    }
  }
}
