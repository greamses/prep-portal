import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * DragControls — raycasting-based drag for lab objects.
 * Draggable objects must be registered via controls.register(mesh).
 *
 * Events fired on the draggable mesh:
 *   'lab:pick'   — mouse down on object
 *   'lab:drag'   — object moved
 *   'lab:drop'   — mouse up
 *   'lab:hover'  — mouse entered
 *   'lab:unhover'— mouse left
 */
export class DragControls {
  constructor(camera, domElement, groundY = 0) {
    this.camera     = camera;
    this.dom        = domElement;
    this.groundY    = groundY;
    this._objects   = [];
    this._dragging  = null;
    this._hovered   = null;
    this._plane     = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
    this._raycaster = new THREE.Raycaster();
    this._mouse     = new THREE.Vector2();
    this._offset    = new THREE.Vector3();
    this._intersect = new THREE.Vector3();

    this._onDown  = this._onDown.bind(this);
    this._onMove  = this._onMove.bind(this);
    this._onUp    = this._onUp.bind(this);

    domElement.addEventListener('pointerdown', this._onDown);
    domElement.addEventListener('pointermove', this._onMove);
    domElement.addEventListener('pointerup',   this._onUp);
  }

  register(mesh) { this._objects.push(mesh); }
  unregister(mesh) { this._objects = this._objects.filter(o => o !== mesh); }

  _toNDC(e) {
    const rect = this.dom.getBoundingClientRect();
    this._mouse.set(
      ((e.clientX - rect.left) / rect.width)  *  2 - 1,
      ((e.clientY - rect.top)  / rect.height) * -2 + 1
    );
  }

  _cast() {
    this._raycaster.setFromCamera(this._mouse, this.camera);
    return this._raycaster.intersectObjects(this._objects, true);
  }

  _onDown(e) {
    this._toNDC(e);
    const hits = this._cast();
    if (!hits.length) return;

    const root = this._findRoot(hits[0].object);
    if (!root) return;

    this._dragging = root;
    this._raycaster.ray.intersectPlane(this._plane, this._intersect);
    this._offset.subVectors(root.position, this._intersect);
    this.dom.setPointerCapture(e.pointerId);
    root.dispatchEvent({ type: 'lab:pick' });
  }

  _onMove(e) {
    this._toNDC(e);

    if (this._dragging) {
      this._raycaster.setFromCamera(this._mouse, this.camera);
      this._raycaster.ray.intersectPlane(this._plane, this._intersect);
      this._dragging.position.copy(this._intersect.add(this._offset));
      this._dragging.dispatchEvent({ type: 'lab:drag', position: this._dragging.position });
      return;
    }

    const hits = this._cast();
    const hit  = hits.length ? this._findRoot(hits[0].object) : null;

    if (hit !== this._hovered) {
      this._hovered?.dispatchEvent({ type: 'lab:unhover' });
      hit?.dispatchEvent({ type: 'lab:hover' });
      this._hovered = hit;
    }
  }

  _onUp(e) {
    if (!this._dragging) return;
    this._dragging.dispatchEvent({ type: 'lab:drop', position: this._dragging.position });
    this._dragging = null;
  }

  _findRoot(obj) {
    let cur = obj;
    while (cur) {
      if (this._objects.includes(cur)) return cur;
      cur = cur.parent;
    }
    return null;
  }

  destroy() {
    this.dom.removeEventListener('pointerdown', this._onDown);
    this.dom.removeEventListener('pointermove', this._onMove);
    this.dom.removeEventListener('pointerup',   this._onUp);
  }
}
