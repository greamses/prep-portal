import * as THREE from "three";

export function buildHoop(scene) {
  const HOOP_Z = -8;
  const RIM_Y = 3.05;
  const RIM_R = 0.2286;

  // Weathered metal pole
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x7c858f, metalness: 0.7, roughness: 0.6,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.9), poleMat);
  base.position.set(0, 0.09, HOOP_Z - 1.1);
  base.castShadow = true; base.receiveShadow = true;
  scene.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 4.0, 20), poleMat);
  pole.position.set(0, 2.0, HOOP_Z - 1.1);
  pole.castShadow = true;
  scene.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.0), poleMat);
  arm.position.set(0, 3.55, HOOP_Z - 0.6);
  arm.castShadow = true;
  scene.add(arm);

  // Backboard glass material
  const boardGlassMat = new THREE.MeshStandardMaterial({
    color: 0xc8e8ff,
    metalness: 0.05,
    roughness: 0.08,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    envMapIntensity: 1.2,
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, 0.04), boardGlassMat);
  board.position.set(0, 3.55, HOOP_Z - 0.1);
  board.castShadow = false;
  board.receiveShadow = true;
  scene.add(board);

  // Thick cyan/blue metal frame
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1d8cc2, metalness: 0.5, roughness: 0.4,
  });
  const trimT = 0.07; const trimD = 0.06;
  const trimTop = new THREE.Mesh(new THREE.BoxGeometry(1.94, trimT, trimD), trimMat);
  trimTop.position.set(0, 3.55 + 1.05 / 2 + trimT / 2, HOOP_Z - 0.1);
  scene.add(trimTop);

  const trimBot = trimTop.clone();
  trimBot.position.y = 3.55 - 1.05 / 2 - trimT / 2;
  scene.add(trimBot);

  const trimL = new THREE.Mesh(new THREE.BoxGeometry(trimT, 1.05 + trimT * 2, trimD), trimMat);
  trimL.position.set(-1.8 / 2 - trimT / 2, 3.55, HOOP_Z - 0.1);
  scene.add(trimL);
  const trimR = trimL.clone();
  trimR.position.x = 1.8 / 2 + trimT / 2;
  scene.add(trimR);

  // Shooter's square
  const sqMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const sqOuter = new THREE.Mesh(new THREE.PlaneGeometry(0.59, 0.45), sqMat);
  sqOuter.position.set(0, 3.30, HOOP_Z - 0.079);
  scene.add(sqOuter);

  const sqInner = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.41),
    new THREE.MeshBasicMaterial({ color: 0x000000, colorWrite: false, depthWrite: true })
  );
  sqInner.position.set(0, 3.30, HOOP_Z - 0.078);
  scene.add(sqInner);

  // Rim and Mount
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xeb481a, metalness: 0.5, roughness: 0.4 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM_R, 0.022, 16, 48), rimMat);
  rim.position.set(0, RIM_Y, HOOP_Z + RIM_R + 0.12);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  scene.add(rim);

  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.18), rimMat);
  mount.position.set(0, RIM_Y, HOOP_Z + 0.0);
  mount.castShadow = true;
  scene.add(mount);

  // Create net with physics support
  const netResult = buildDynamicNet(RIM_R);
  const net = netResult.group;
  const netPhysics = netResult.physics;
  
  net.position.set(0, RIM_Y, HOOP_Z + RIM_R + 0.12);
  scene.add(net);

  const hoopData = {
    rimCenter: new THREE.Vector3(0, RIM_Y, HOOP_Z + RIM_R + 0.12),
    rimRadius: RIM_R,
    rimTubeRadius: 0.022,
    backboard: {
      center: new THREE.Vector3(0, 3.55, HOOP_Z - 0.1),
      halfWidth: 0.9,
      halfHeight: 0.525,
      z: HOOP_Z - 0.08,
    },
    net: net,
    netPhysics: netPhysics,
  };
  
  return hoopData;
}

function buildDynamicNet(rimRadius) {
  const group = new THREE.Group();
  const segments = 32; 
  const rings = 16;    
  // 1. Restored normal visual height of the net
  const netHeight = 0.55; 
  const mat = new THREE.LineBasicMaterial({ color: 0xeaeaea, transparent: true, opacity: 0.85 });
  
  const netPhysics = new NetPhysics(rimRadius, segments, rings, netHeight);
  
  for (let i = 0; i < segments; i++) {
    const points =[];
    for (let r = 0; r <= rings; r++) {
      points.push(new THREE.Vector3()); 
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    group.add(new THREE.Line(geometry, mat));
  }
  
  for (let r = 1; r <= rings; r += 2) {
    const points =[];
    for (let i = 0; i <= segments; i++) {
      points.push(new THREE.Vector3()); 
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    group.add(new THREE.Line(geometry, mat));
  }
  
  netPhysics.attachToNet(group);
  netPhysics.resetToOriginal(); 
  netPhysics.updateGeometry();
  
  return { group, physics: netPhysics };
}

/* 
 * Advanced Verlet Mass-Spring System
 */
class NetPhysics {
  constructor(rimRadius, segments = 32, rings = 16, netHeight = 0.55) {
    this.segments = segments;
    this.rings = rings;
    this.netHeight = netHeight;
    this.rimRadius = rimRadius;
    
    this.points =[];
    this.prevPoints =[];
    this.initPointsData = [];
    this.constraints =[];
    
    this.waving = false;
    this.waveTime = 0;
    this.netGroup = null;
    this.activeBall = null; 
    
    // 2. NATURAL SWING PHYSICS:
    this.DAMPING = 0.96; // Smooth, pendulum-like air resistance
    this.GRAVITY = -14.0; // Natural falling weight
    this.CONSTRAINT_ITERATIONS = 5; // Higher precision = rigid, non-stretchy nylon strings
    
    this.initSystem();
  }
  
  initSystem() {
    for (let r = 0; r <= this.rings; r++) {
      const t = r / this.rings;
      const taper = 1 - t * 0.6;
      const radius = this.rimRadius * taper;
      const y = -t * this.netHeight;
      
      const ringPoints = [];
      const ringPrev =[];
      const ringInit =[];
      
      for (let i = 0; i < this.segments; i++) {
        const angle = (i / this.segments) * Math.PI * 2;
        const pos = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        
        ringPoints.push(pos.clone());
        ringPrev.push(pos.clone());
        ringInit.push(pos.clone());
      }
      
      this.points.push(ringPoints);
      this.prevPoints.push(ringPrev);
      this.initPointsData.push(ringInit);
    }
    
    for (let r = 0; r <= this.rings; r++) {
      for (let i = 0; i < this.segments; i++) {
        const nextI = (i + 1) % this.segments;
        
        // Horizontal Rings: A bit stretchy so the ball can actually bulge through it
        const hDist = this.points[r][i].distanceTo(this.points[r][nextI]);
        const hStiff = 0.6 - (r / this.rings) * 0.3; 
        this.constraints.push({ r1: r, i1: i, r2: r, i2: nextI, rest: hDist, stiff: hStiff });
        
        if (r < this.rings) {
          // 3. RESTRICT DOWNWARD STRETCH: Vertical strings are extremely rigid (stiff: 1.0)
          const vDist = this.points[r][i].distanceTo(this.points[r+1][i]);
          this.constraints.push({ r1: r, i1: i, r2: r+1, i2: i, rest: vDist, stiff: 1.0 }); 
          
          // Diagonals keep the mesh from collapsing in on itself
          const dDist1 = this.points[r][i].distanceTo(this.points[r+1][nextI]);
          this.constraints.push({ r1: r, i1: i, r2: r+1, i2: nextI, rest: dDist1, stiff: 0.9 });
          
          const prevI = (i - 1 + this.segments) % this.segments;
          const dDist2 = this.points[r][i].distanceTo(this.points[r+1][prevI]);
          this.constraints.push({ r1: r, i1: i, r2: r+1, i2: prevI, rest: dDist2, stiff: 0.9 });
        }
      }
    }
  }
  
  startWave(impactVelocity, ballPos) {
    this.waving = true;
    this.waveTime = 0;
    
    const netTop = this.getNetTopPosition();
    const localPos = ballPos.clone().sub(netTop);
    
    // Natural fall speed for the phantom ball
    let fallSpeed = impactVelocity.y * 0.6;
    if (fallSpeed > -4.5) fallSpeed = -4.5; 
    if (fallSpeed < -7.0) fallSpeed = -7.0; 
    
    const phantomVel = impactVelocity.clone().multiplyScalar(0.15);
    phantomVel.y = fallSpeed;
    
    this.activeBall = {
      pos: localPos,
      vel: phantomVel,
      radius: 0.135 // Standard size to bulge the net smoothly
    };
  }
  
  getNetTopPosition() {
    return new THREE.Vector3(0, 3.05, -8 + 0.2286 + 0.12);
  }
  
  update(deltaTime) {
    if (!this.waving) return;
    
    const dt = Math.min(deltaTime, 0.03);
    
    if (this.activeBall) {
      this.activeBall.vel.y += this.GRAVITY * dt;
      this.activeBall.pos.x += this.activeBall.vel.x * dt;
      this.activeBall.pos.y += this.activeBall.vel.y * dt;
      this.activeBall.pos.z += this.activeBall.vel.z * dt;
      
      // Let go slightly below the net
      if (this.activeBall.pos.y < -this.netHeight - 0.15) {
        this.activeBall = null; 
      }
    }
    
    for (let r = 1; r <= this.rings; r++) { 
      for (let i = 0; i < this.segments; i++) {
        const p = this.points[r][i];
        const prevP = this.prevPoints[r][i];
        const initP = this.initPointsData[r][i];
        
        const vx = (p.x - prevP.x) * this.DAMPING;
        const vy = (p.y - prevP.y) * this.DAMPING;
        const vz = (p.z - prevP.z) * this.DAMPING;
        
        prevP.copy(p); 
        
        p.x += vx;
        p.y += vy + (this.GRAVITY * dt * dt);
        p.z += vz;
        
        // Removed the harsh "snap back" force. Replaced with an extremely gentle
        // shape-keeper (0.015) so it sways like real resting cloth.
        const shapeKeep = 0.015 * (1 - (r / this.rings) * 0.5);
        p.x += (initP.x - p.x) * shapeKeep;
        p.z += (initP.z - p.z) * shapeKeep;
        
        // Collision with the ball
        if (this.activeBall) {
          const dx = p.x - this.activeBall.pos.x;
          const dy = p.y - this.activeBall.pos.y;
          const dz = p.z - this.activeBall.pos.z;
          const distSq = dx*dx + dy*dy + dz*dz;
          const colRad = this.activeBall.radius;
          
          if (distSq < colRad * colRad && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const pushFactor = (colRad - dist) / dist;
            p.x += dx * pushFactor;
            p.y += dy * pushFactor;
            p.z += dz * pushFactor;
          }
        }
      }
    }
    
    // Constraint solver ensures the strings don't stretch vertically like rubber bands
    for (let it = 0; it < this.CONSTRAINT_ITERATIONS; it++) {
      for (let c = 0; c < this.constraints.length; c++) {
        const constraint = this.constraints[c];
        const p1 = this.points[constraint.r1][constraint.i1];
        const p2 = this.points[constraint.r2][constraint.i2];
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist === 0) continue;
        
        const diff = (dist - constraint.rest) / dist;
        const correction = diff * 0.5 * constraint.stiff;
        
        const cx = dx * correction;
        const cy = dy * correction;
        const cz = dz * correction;
        
        if (constraint.r1 !== 0) { p1.x += cx; p1.y += cy; p1.z += cz; }
        if (constraint.r2 !== 0) { p2.x -= cx; p2.y -= cy; p2.z -= cz; }
      }
    }
    
    if (this.netGroup) {
      this.updateGeometry();
    }
    
    this.waveTime += dt;
    // Increased settle time to allow the pendulum swing to finish beautifully
    if (this.waveTime > 2.5 && !this.activeBall) {
      this.waving = false;
      this.resetToOriginal();
    }
  }
  
  resetToOriginal() {
    for (let r = 0; r <= this.rings; r++) {
      for (let i = 0; i < this.segments; i++) {
        this.points[r][i].copy(this.initPointsData[r][i]);
        this.prevPoints[r][i].copy(this.initPointsData[r][i]);
      }
    }
    if (this.netGroup) this.updateGeometry();
  }
  
  updateGeometry() {
    if (!this.netGroup || this.netGroup.children.length === 0) return;
    
    let childIdx = 0;
    
    for (let i = 0; i < this.segments; i++) {
      const line = this.netGroup.children[childIdx++];
      if (!line) continue;
      
      const positions = line.geometry.attributes.position.array;
      let posIdx = 0;
      
      for (let r = 0; r <= this.rings; r++) {
        const idx = (r % 2 === 0) ? i : (i + 1) % this.segments;
        const p = this.points[r][idx];
        
        positions[posIdx++] = p.x;
        positions[posIdx++] = p.y;
        positions[posIdx++] = p.z;
      }
      line.geometry.attributes.position.needsUpdate = true;
    }
    
    for (let r = 1; r <= this.rings; r += 2) {
      const line = this.netGroup.children[childIdx++];
      if (!line) continue;
      
      const positions = line.geometry.attributes.position.array;
      let posIdx = 0;
      
      for (let i = 0; i <= this.segments; i++) {
        const idx = i % this.segments;
        const p = this.points[r][idx];
        
        positions[posIdx++] = p.x;
        positions[posIdx++] = p.y;
        positions[posIdx++] = p.z;
      }
      line.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  attachToNet(netGroup) {
    this.netGroup = netGroup;
  }
}
