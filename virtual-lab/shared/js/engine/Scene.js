/**
 * Scene — shared Three.js bootstrapper.
 * Each lab calls: const scene = new LabScene(containerId); scene.init();
 * Then extends by adding objects/lights to scene.scene, scene.camera, etc.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class LabScene {
  constructor(containerId = 'canvas-container') {
    this.container = document.getElementById(containerId);
    this.scene     = null;
    this.camera    = null;
    this.renderer  = null;
    this._rafId    = null;
    this._onResize = this._onResize.bind(this);
    this._animate  = this._animate.bind(this);
    this._updateCallbacks = [];
  }

  init() {
    this._buildScene();
    this._buildCamera();
    this._buildRenderer();
    window.addEventListener('resize', this._onResize);
    return this;
  }

  _buildScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1117);
    this.scene.fog = new THREE.FogExp2(0x0f1117, 0.035);
  }

  _buildCamera() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    this.camera.position.set(0, 4, 10);
    this.camera.lookAt(0, 0, 0);
  }

  _buildRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._onResize();
    this.container.appendChild(this.renderer.domElement);
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /** Register a per-frame callback: fn(deltaSeconds, elapsedSeconds) */
  onUpdate(fn) {
    this._updateCallbacks.push(fn);
    return this;
  }

  start() {
    const clock = new THREE.Clock();
    const tick = () => {
      this._rafId = requestAnimationFrame(tick);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      this._updateCallbacks.forEach(fn => fn(delta, elapsed));
      this.renderer.render(this.scene, this.camera);
    };
    tick();
    return this;
  }

  stop() {
    cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this._onResize);
  }

  _animate() {}
}
