/**
 * State coordinator.
 *
 * Owns: which building (if any) is the focus, which buildings are
 * disabled, and the per-frame interpolation that drives every
 * material toward its target state's visual spec.
 *
 * Single rule: at most one building is "focused" (hover or selected
 * or pressed). Every other non-disabled building is "background".
 * Disabled buildings stay disabled regardless of focus.
 */

import * as THREE from "three";
import { stateSpec, colorModeOverlay } from "./tokens.js";

// Scratch color reused inside the per-frame tween — keeps the loop allocation-free.
const _scratchColor = new THREE.Color();

const LERP_SPEED = 8.0; // higher = snappier; tuned to feel calm but responsive

// Precomputed target colors per state — avoids allocating in the render loop.
const targetColors = Object.fromEntries(
  Object.entries(stateSpec).map(([name, spec]) => [
    name,
    {
      surface: new THREE.Color(spec.surfaceColor),
      outline: new THREE.Color(spec.outlineColor),
    },
  ]),
);

export class StateController {
  constructor(buildings, panelEls) {
    this.buildings = buildings;
    this.panel = panelEls;

    this.focusId = null;       // currently hovered or selected
    this.selectedId = null;    // sticky selection (click)
    this.pressedId = null;     // mousedown active
    this.disabled = new Set(); // ids that are non-interactive
    this.colorMode = false;    // when true, buildings show identity colors at rest

    this.refresh();
  }

  setColorMode(on) {
    this.colorMode = !!on;
    // No state change needed — the tween loop reads colorMode each frame.
  }

  setHover(id) {
    // Hover only matters if nothing is selected — selection wins.
    if (this.selectedId) return;
    if (this.focusId === id) return;
    this.focusId = id;
    this.refresh();
  }

  clearHover() {
    if (this.selectedId) return;
    if (this.focusId === null) return;
    this.focusId = null;
    this.refresh();
  }

  setSelected(id) {
    if (id && this.disabled.has(id)) return;
    this.selectedId = id;
    this.focusId = id;
    this.refresh();
  }

  setPressed(id) {
    if (id && this.disabled.has(id)) return;
    this.pressedId = id;
    this.refresh();
  }

  toggleDisabled(id) {
    if (this.disabled.has(id)) this.disabled.delete(id);
    else {
      this.disabled.add(id);
      if (this.selectedId === id) this.selectedId = null;
      if (this.focusId === id) this.focusId = null;
    }
    this.refresh();
  }

  clearAll() {
    this.focusId = null;
    this.selectedId = null;
    this.pressedId = null;
    this.refresh();
  }

  /**
   * Resolve the visual state for every building based on current focus.
   * Called whenever the input state changes — actual material updates
   * happen in update() each frame, which lerps toward these targets.
   */
  refresh() {
    const focus = this.focusId; // hover or selected (selected pinned in setSelected)
    const pressed = this.pressedId;
    const anyFocus = focus !== null && focus !== undefined;

    for (const b of this.buildings) {
      const id = b.userData.id;

      let target;
      if (this.disabled.has(id)) {
        target = "disabled";
      } else if (id === pressed) {
        target = "pressed";
      } else if (id === this.selectedId) {
        target = "selected";
      } else if (id === focus) {
        target = "hover";
      } else if (anyFocus) {
        target = "background";
      } else {
        target = "default";
      }

      b.userData.targetState = target;
    }

    this.updatePanel();
  }

  updatePanel() {
    if (!this.panel) return;
    const active = this.selectedId ?? this.focusId;
    const activeName = active
      ? this.buildings.find((b) => b.userData.id === active)?.userData.label ?? active
      : "—";
    this.panel.active.textContent = activeName;

    let mode = "idle";
    if (this.pressedId) mode = "pressed";
    else if (this.selectedId) mode = "selected";
    else if (this.focusId) mode = "hover";
    this.panel.mode.textContent = mode;
  }

  /**
   * Per-frame tween: nudge every building's current visual params
   * toward those of its target state spec. dt in seconds.
   */
  update(dt) {
    const t = 1 - Math.exp(-LERP_SPEED * dt);
    const colorMode = this.colorMode;

    for (const b of this.buildings) {
      const target = b.userData.targetState;
      const spec = stateSpec[target] ?? stateSpec.default;
      const colors = targetColors[target] ?? targetColors.default;
      const cur = b.userData.current;

      // Resolve target surface color & opacity:
      // - Monochrome mode: take spec values directly.
      // - Color mode: blend the building's identity color with the spec's
      //   tint per the colorModeOverlay ratio. This lets accent treatments
      //   (hover/selected/pressed) still read while the building's identity
      //   stays visible at rest, and lets background/disabled fully recede.
      let targetSurface = colors.surface;
      let targetOpacity = spec.surfaceOpacity;
      if (colorMode) {
        const overlay = colorModeOverlay[target] ?? colorModeOverlay.default;
        targetSurface = _scratchColor
          .copy(b.userData.baseColor)
          .lerp(colors.surface, overlay.ratio);
        targetOpacity = overlay.opacity;
      }

      cur.surfaceColor.lerp(targetSurface, t);
      cur.surfaceOpacity = lerp(cur.surfaceOpacity, targetOpacity, t);
      cur.outlineColor.lerp(colors.outline, t);
      cur.outlineWidth = lerp(cur.outlineWidth, spec.outlineWidth, t);
      cur.outlineOpacity = lerp(cur.outlineOpacity, spec.outlineOpacity, t);

      const fillMat = b.userData.fill.material;
      fillMat.color.copy(cur.surfaceColor);
      fillMat.opacity = cur.surfaceOpacity;
      fillMat.needsUpdate = true;

      const lineMat = b.userData.outline.material;
      lineMat.color.copy(cur.outlineColor);
      lineMat.linewidth = cur.outlineWidth;
      lineMat.opacity = cur.outlineOpacity;
      lineMat.needsUpdate = true;
    }
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
