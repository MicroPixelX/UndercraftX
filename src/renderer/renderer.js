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

    const sg = new THREE.SphereGeometry(FOG_E*1.4, 32, 15);
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

    this._onResize = () => this._r();
    window.addEventListener('resize', this._onResize);
  }

  _r(){this.camera.aspect=window.innerWidth/window.innerHeight;this.camera.updateProjectionMatrix();this.threeRenderer.setSize(window.innerWidth,window.innerHeight);}
  render(){this.threeRenderer.render(this.scene,this.camera);}
  updateSky(p){
    this.sky.position.copy(p);
    this.sky.material.uniforms.camPos.value.copy(p);

    this.dayTime += this.daySpeed;
    const cycle = (Math.sin(this.dayTime) + 1) * 0.5;
    const sunI = 0.6 + cycle * 0.6;
    const ambI = 0.2 + cycle * 0.35;
    this.sun.intensity = sunI;
    this.amb.intensity = ambI;

    const fogDay = new THREE.Color(0x87CEEB);
    const fogNight = new THREE.Color(0x1a1a3e);
    this.scene.fog.color.lerpColors(fogNight, fogDay, cycle);
    this.threeRenderer.setClearColor(this.scene.fog.color);

    const topDay = new THREE.Color(0x0077ff);
    const topNight = new THREE.Color(0x0a0a2a);
    const botDay = new THREE.Color(0x87CEEB);
    const botNight = new THREE.Color(0x1a1a3e);
    this.sky.material.uniforms.top.value.lerpColors(topNight, topDay, cycle);
    this.sky.material.uniforms.bot.value.lerpColors(botNight, botDay, cycle);
  }
  dispose(){window.removeEventListener('resize',this._onResize);}
}
