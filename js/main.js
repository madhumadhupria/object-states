/**
 * Entry point — wires the scene, picks objects under the cursor,
 * and advances the state controller every frame.
 */

import * as THREE from "three";
import {
  createRenderer,
  createCamera,
  createSceneRoot,
  createLighting,
  bindResize,
} from "./scene.js";
import { createScene, createGround, getOutlineResolution } from "./buildings.js";
import { StateController } from "./states.js";

const stage = document.getElementById("stage");
const panel = {
  active: document.querySelector("[data-active]"),
  mode: document.querySelector("[data-mode]"),
};

const renderer = createRenderer(stage);
const camera = createCamera();
const scene = createSceneRoot();
createLighting(scene);

const ground = createGround();
scene.add(ground);

const buildings = createScene();
for (const b of buildings) scene.add(b);

const controller = new StateController(buildings, panel);

bindResize(renderer, camera, getOutlineResolution());

/* ---------- Picking ---------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerInside = false;

function pick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  // Only consider the fill meshes — outlines aren't pickable targets.
  const fills = buildings.map((b) => b.userData.fill);
  const hits = raycaster.intersectObjects(fills, false);
  if (hits.length === 0) return null;

  // Walk up to the building Group.
  let obj = hits[0].object;
  while (obj && obj.userData.kind !== "building") obj = obj.parent;
  return obj;
}

stage.addEventListener("pointermove", (e) => {
  pointerInside = true;
  const hit = pick(e);
  if (hit) {
    controller.setHover(hit.userData.id);
    document.body.style.cursor = "pointer";
  } else {
    controller.clearHover();
    document.body.style.cursor = "default";
  }
});

stage.addEventListener("pointerleave", () => {
  pointerInside = false;
  controller.clearHover();
  document.body.style.cursor = "default";
});

stage.addEventListener("pointerdown", (e) => {
  const hit = pick(e);
  if (!hit) return;
  controller.setPressed(hit.userData.id);
});

stage.addEventListener("pointerup", (e) => {
  const wasPressed = controller.pressedId;
  controller.setPressed(null);

  const hit = pick(e);
  if (!hit) {
    // Click on empty space: clear selection.
    controller.setSelected(null);
    return;
  }

  if (e.shiftKey) {
    controller.toggleDisabled(hit.userData.id);
    return;
  }

  // Toggle selection on the hit object.
  if (controller.selectedId === hit.userData.id) {
    controller.setSelected(null);
  } else {
    controller.setSelected(hit.userData.id);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    controller.clearAll();
    document.body.style.cursor = "default";
  }
});

/* ---------- Render loop ---------- */

const clock = new THREE.Clock();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.1);
  controller.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
