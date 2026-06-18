/**
 * Renderer: configuração Three.js + iluminação
 */

import * as THREE from 'three';

export class Renderer {
  constructor(container) {
    this.container = container;

    // Three.js renderer
    this.threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.threeRenderer.setPixelRatio(window.devicePixelRatio);
    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
    this.threeRenderer.setClearColor(0x87CEEB); // Sky blue
    container.appendChild(this.threeRenderer.domElement);

    // Câmera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.up.set(0, 1, 0);

    // Cena
    this.scene = new THREE.Scene();

    // Névoa (distância)
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);

    // Iluminação
    this._setupLighting();

    // Skybox simples (gradiente)
    this._setupSky();

    // Resize handler
    window.addEventListener('resize', () => this._onResize());
  }

  _setupLighting() {
    // Luz ambiente suave
    const ambient = new THREE.AmbientLight(0x6688cc, 0.4);
    this.scene.add(ambient);

    // Luz direcional (sol)
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(50, 100, 50);
    this.scene.add(sun);

    // Luz fillsubdirecional fraca
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-50, 50, -50);
    this.scene.add(fill);
  }

  _setupSky() {
    // Skybox com gradiente simples (3 planos de cor)
    // Horizonte azul claro
    const skyGeo = new THREE.SphereGeometry(400, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Renderiza um frame
   */
  render() {
    this.threeRenderer.render(this.scene, this.camera);
  }

  /**
   * Atualiza skybox para seguir câmera
   */
  updateSky(position) {
    this.sky.position.copy(position);
  }

  /**
   * Libera recursos
   */
  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.threeRenderer.dispose();
  }
}