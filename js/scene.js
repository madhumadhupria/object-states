/**
 * Scene wiring — Three.js renderer, camera, lighting, and the static
 * camera framing. Camera is fixed on purpose: this prototype is about
 * object state, not navigation.
 */

import * as THREE from "three";
import { tokens } from "./tokens.js";

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(tokens.surface.level250, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    36,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  // Slightly elevated 3/4 view — reads as an architectural massing model.
  camera.position.set(8.5, 6.2, 9.0);
  camera.lookAt(0, 1.2, 0);
  return camera;
}

export function createSceneRoot() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(tokens.surface.level250);
  // A faint fog softens distant edges and reinforces the "diagrammatic" feel.
  scene.fog = new THREE.Fog(tokens.surface.level250, 22, 60);
  return scene;
}

export function createLighting(scene) {
  // Ambient — keeps shaded faces readable without crushing them.
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  // Soft hemisphere — sky/ground tint.
  const hemi = new THREE.HemisphereLight(0xffffff, tokens.surface.level300, 0.45);
  scene.add(hemi);

  // Key light, low and warm — produces the soft architectural shadow.
  const key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(8, 12, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  scene.add(key);

  // Fill — opposite side, dimmer, no shadow.
  const fill = new THREE.DirectionalLight(0xffffff, 0.25);
  fill.position.set(-6, 4, -4);
  scene.add(fill);

  return { ambient, hemi, key, fill };
}

/**
 * Resize handler — keeps renderer, camera, and (importantly) the
 * LineMaterial resolution uniform in sync with the viewport.
 */
export function bindResize(renderer, camera, lineResolution) {
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    lineResolution.set(w, h);
  };
  window.addEventListener("resize", onResize);
  return onResize;
}
