import * as THREE from "three";
import { createSkyTexture } from "./textures.js";
import { buildLighting } from "./lighting.js";
import { buildCourt } from "./court.js";
import { buildHoop } from "./hoop.js";
import { buildSurroundings } from "./surroundings.js";
import { buildPropsAndFence } from "./props.js";


export function buildScene() {
  const scene = new THREE.Scene();
  
  // High quality sky backdrop + deep atmospheric fog
  scene.background = createSkyTexture();
  scene.fog = new THREE.Fog(0xe0f2f9, 25, 90);
  
  // Modular assembly
  buildLighting(scene);
  buildCourt(scene);
  buildSurroundings(scene);
  const hoop = buildHoop(scene); // This should now return netPhysics as well
  buildPropsAndFence(scene);
  
  // Log to verify net physics is attached
  if (hoop.netPhysics) {
    console.log("Net physics initialized successfully");
  } else {
    console.warn("Net physics not attached to hoop");
  }
  
  return { scene, hoop };
}