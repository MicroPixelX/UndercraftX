/**
 * renderer.js: Three.js + skybox shader + day/night + fog alinhado
 * FIX-R: Sky gradient now uses camera-relative coordinates
 * FIX-V5: MSAA antialiasing disabled
 * + Enhanced sky shader: stars at night, sun glow, moon glow, sunset horizon tint
 * + Water overlay: screen-space animated wave shader (additive blend, no render target)
 * + Day/night: driven by sky shader + light color/intensity shifts (no post-process pass)
 */

import * as THREE from 'three';

const RD = 4, CS = 16;
const FOG_S = (RD-1)*CS, FOG_E = RD*CS;

const SKY_VS = `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

const SKY_FS = `
uniform vec3 topColor, botColor, sunDir, sunColor, moonColor;
uniform float exp, off, sunSize, dayMix, time;
uniform vec3 camPos;
varying vec3 vW;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}

void main(){
  vec3 rel=vW-camPos;
  vec3 dir=normalize(rel+vec3(0.,off,0.));
  float h=dir.y;

  vec3 sky=mix(botColor,topColor,max(pow(max(h,0.),exp),0.));

  float sunDot=max(dot(dir,normalize(sunDir)),0.);
  float sunGlow=pow(sunDot,8.0)*0.6;
  float sunDisk=pow(sunDot,256.0)*1.2;
  sky+=sunColor*(sunGlow+sunDisk)*dayMix;

  vec3 moonDir=normalize(-sunDir);
  float moonDot=max(dot(dir,moonDir),0.);
  float moonGlow=pow(moonDot,12.0)*0.15;
  float moonDisk=pow(moonDot,512.0)*0.8;
  sky+=moonColor*(moonGlow+moonDisk)*(1.0-dayMix);

  if(h>0.05){
    vec2 starUv=dir.xz/(dir.y+0.001)*80.0;
    float star=step(0.998,hash(floor(starUv)));
    float twinkle=0.7+0.3*sin(time*2.0+hash(floor(starUv))*6.28);
    float starBright=star*twinkle*(1.0-dayMix)*smoothstep(0.05,0.3,h);
    sky+=vec3(starBright)*0.8;
  }

  float horizonGlow=exp(-abs(h)*6.0)*(1.0-dayMix*0.5);
  vec3 sunsetColor=mix(vec3(1.0,0.3,0.05),vec3(1.0,0.6,0.2),dayMix);
  float sunsetMask=smoothstep(0.0,0.35,dayMix)*smoothstep(1.0,0.5,dayMix);
  sky+=sunsetColor*horizonGlow*sunsetMask*0.4;

  gl_FragColor=vec4(sky,1.0);
}`;

const WATER_VS = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;

const WATER_FS = `
uniform float time;
uniform float intensity;
varying vec2 vUv;

float wave(vec2 p,float t){return sin(p.x*12.0+t*2.0)*0.5+sin(p.y*10.0+t*1.5)*0.5;}

void main(){
  float w1=wave(vUv*8.0,time);
  float w2=wave(vUv*16.0+vec2(1.5,2.0),time*1.3);
  float w3=wave(vUv*4.0+vec2(3.0,1.0),time*0.7);
  float pattern=(w1*0.5+w2*0.3+w3*0.2)*0.5+0.5;

  vec3 deepColor=vec3(0.0,0.12,0.35);
  vec3 shallowColor=vec3(0.1,0.35,0.6);
  vec3 caustic=vec3(0.3,0.6,0.9);

  vec3 col=mix(deepColor,shallowColor,pattern);
  float causticMask=pow(max(0.0,sin(pattern*3.14159)),8.0);
  col+=caustic*causticMask*0.3;

  float edgeDark=1.0-length(vUv-0.5)*0.6;
  col*=edgeDark;

  gl_FragColor=vec4(col,intensity*0.4);
}`;

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
    this.isUnderwater = false;
    this._lastCycleQ = 0.5;

    this._fogDay = new THREE.Color(0x87CEEB);
    this._fogNight = new THREE.Color(0x0a0a1a);
    this._topDay = new THREE.Color(0x1a8aff);
    this._topNight = new THREE.Color(0x020210);
    this._botDay = new THREE.Color(0x87CEEB);
    this._botNight = new THREE.Color(0x0a0a1a);
    this._lastDayCycle = -1;

    this._initSky();
    this._initSunMoon();
    this._initClouds();
    this._initWaterOverlay();

    this._onResize = () => this._r();
    window.addEventListener('resize', this._onResize);
  }

  _initSky() {
    this._skyUniforms = {
      topColor: { value: new THREE.Color(0x1a8aff) },
      botColor: { value: new THREE.Color(0x87CEEB) },
      camPos: { value: new THREE.Vector3(0, 64, 0) },
      exp: { value: 0.6 },
      off: { value: 33 },
      sunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
      sunColor: { value: new THREE.Color(0xffee88) },
      moonColor: { value: new THREE.Color(0xaabbdd) },
      sunSize: { value: 0.04 },
      dayMix: { value: 1.0 },
      time: { value: 0 },
    };
    const sg = new THREE.SphereGeometry(FOG_E*1.4, 16, 8);
    const sm = new THREE.ShaderMaterial({
      uniforms: this._skyUniforms,
      vertexShader: SKY_VS,
      fragmentShader: SKY_FS,
      side: THREE.BackSide, depthWrite: false,
    });
    this.sky = new THREE.Mesh(sg, sm);
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);
  }

  _initSunMoon() {
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

  _initClouds() {
    this._cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.7,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const rng = this._cloudRng(42);
    for (let i = 0; i < 35; i++) {
      const cloudGeo = new THREE.PlaneGeometry(12 + rng() * 20, 12 + rng() * 20);
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

  _initWaterOverlay() {
    this._waterUniforms = {
      time: { value: 0 },
      intensity: { value: 0 },
    };
    const waterMat = new THREE.ShaderMaterial({
      uniforms: this._waterUniforms,
      vertexShader: WATER_VS,
      fragmentShader: WATER_FS,
      transparent: true, depthTest: false, depthWrite: false,
    });
    this._waterQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), waterMat);
    this._waterQuad.frustumCulled = false;
    this._waterRTScene = new THREE.Scene();
    this._waterRTScene.add(this._waterQuad);
    this._waterRTCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  _cloudRng(seed) {
    let s = seed | 0;
    return function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  _r() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.threeRenderer.render(this.scene, this.camera);

    if (this.isUnderwater) {
      this._waterUniforms.intensity.value = 1.0;
      this.threeRenderer.render(this._waterRTScene, this._waterRTCamera);
    }
  }

  updateSky(p) {
    this.sky.position.copy(p);
    this._skyUniforms.camPos.value.copy(p);
    this._skyUniforms.time.value = this.dayTime;

    this.dayTime += this.daySpeed;
    const cycle = (Math.sin(this.dayTime) + 1) * 0.5;
    const cycleQ = Math.round(cycle * 20) / 20;
    this._lastCycleQ = cycleQ;

    if (cycleQ !== this._lastDayCycle) {
      this._lastDayCycle = cycleQ;

      const sunI = 0.6 + cycleQ * 0.6;
      const ambI = 0.2 + cycleQ * 0.35;
      this.sun.intensity = sunI;
      this.amb.intensity = ambI;

      this.scene.fog.color.lerpColors(this._fogNight, this._fogDay, cycleQ);
      this.threeRenderer.setClearColor(this.scene.fog.color);

      this._skyUniforms.topColor.value.lerpColors(this._topNight, this._topDay, cycleQ);
      this._skyUniforms.botColor.value.lerpColors(this._botNight, this._botDay, cycleQ);
      this._skyUniforms.dayMix.value = cycleQ;

      if (cycleQ > 0.3) {
        this._skyUniforms.sunColor.value.setHex(0xffee88);
      } else if (cycleQ > 0.15) {
        this._skyUniforms.sunColor.value.set(1.0, 0.5 + cycleQ, 0.2 + cycleQ * 0.5);
      }

      if (cycleQ < 0.3) {
        this.sun.color.lerpColors(new THREE.Color(0x3344aa), new THREE.Color(0xffaa44), cycleQ / 0.3);
      } else {
        this.sun.color.set(0xffffff);
      }

      if (this._sunObj) {
        this._sunObj.visible = cycleQ > 0.1;
        this._sunObj.material.color.setHex(cycleQ > 0.3 ? 0xffee44 : 0xff8822);
      }
      if (this._moonObj) {
        this._moonObj.visible = cycleQ < 0.35;
      }
    }

    const sunAngle = this.dayTime * 0.3;
    const sunDist = FOG_E * 0.8;
    const sunDirX = Math.cos(sunAngle);
    const sunDirY = Math.sin(sunAngle);
    const sunDirZ = 0.2;
    this._skyUniforms.sunDir.value.set(sunDirX, sunDirY, sunDirZ).normalize();

    if (this._sunObj) {
      this._sunObj.position.set(p.x + sunDirX * sunDist, p.y + sunDirY * sunDist, p.z);
    }
    if (this._moonObj) {
      this._moonObj.position.set(
        p.x + Math.cos(sunAngle + Math.PI) * sunDist,
        p.y + Math.sin(sunAngle + Math.PI) * sunDist,
        p.z
      );
    }

    this._cloudTime = (this._cloudTime || 0) + 0.02;
    if (this._cloudGroup) {
      this._cloudGroup.position.set(
        p.x + Math.sin(this._cloudTime * 0.1) * 10, 0,
        p.z + Math.cos(this._cloudTime * 0.08) * 8
      );
      const cloudAlpha = 0.3 + cycleQ * 0.45;
      this._cloudGroup.traverse(c => {
        if (c.material && c.material.opacity !== undefined) c.material.opacity = cloudAlpha;
      });
    }

    this._waterUniforms.time.value = this.dayTime;
  }

  dispose() {
    this._lastDayCycle = -1;
    this._lastCycleQ = 0.5;
    this.dayTime = 0;
    this.isUnderwater = false;

    if (this._sunObj) { this._sunObj.visible = true; this._sunObj.material.color.setHex(0xffee44); }
    if (this._moonObj) { this._moonObj.visible = true; this._moonObj.material.color.setHex(0xccccee); }
    if (this._cloudGroup) { if (this._cloudGroup.parent !== this.scene) this.scene.add(this._cloudGroup); }

    this.sun.intensity = 1.2;
    this.sun.color.set(0xffffff);
    this.amb.intensity = 0.5;
    this.scene.fog.color.set(0x87CEEB);
    this.threeRenderer.setClearColor(0x87CEEB);
  }
}