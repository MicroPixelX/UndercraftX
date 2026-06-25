/**
 * renderer.js: Three.js + skybox shader + fog alinhado
 * FIX-R: Sky gradient now uses camera-relative coordinates so it doesn't
 *        shift color unnaturally when the player is at high Y levels
 */

import * as THREE from 'three';

const RD = 4, CS = 16;
const FOG_S = (RD-1)*CS, FOG_E = RD*CS;

export class Renderer {
  constructor(container) {
    this.container = container;
    this.threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
    this.threeRenderer.setClearColor(0x87CEEB);
    container.appendChild(this.threeRenderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, FOG_E*1.5);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87CEEB, FOG_S, FOG_E);

    const amb = new THREE.AmbientLight(0x8899bb, 0.5); this.scene.add(amb);
    const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(100,200,100); this.scene.add(sun);
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x8b5a2b, 0.3); this.scene.add(hemi);

    const sg = new THREE.SphereGeometry(FOG_E*1.4, 32, 15);
    // FIX-R: Added camPos uniform so sky shader computes camera-relative direction
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

    window.addEventListener('resize', () => this._r());
  }

  _r(){this.camera.aspect=window.innerWidth/window.innerHeight;this.camera.updateProjectionMatrix();this.threeRenderer.setSize(window.innerWidth,window.innerHeight);}
  render(){this.threeRenderer.render(this.scene,this.camera);}
  updateSky(p){this.sky.position.copy(p);this.sky.material.uniforms.camPos.value.copy(p);}
}
