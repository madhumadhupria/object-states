/**
 * State coordinator.
 *
 * Tracks: which building is hovered, which is the sticky selection,
 * which is being pressed, and which are disabled. Hover and selection
 * are independent — hovering a different object doesn't clear the
 * selection. Both treatments coexist; everything else recedes.
 *
 * Per-building target state priority (highest first):
 *   disabled  →  pressed  →  hover  →  selected  →  background  →  default
 *
 * Hover beats selected only on a *different* object: the selected
 * building always reads as `selected`, so re-hovering the selection
 * does not downgrade it.
 */

import * as THREE from "three";
import { stateSpec, colorModeOverlay } from "./tokens.js";

const _scratchColor = new THREE.Color();

const LERP_SPEED = 8.0;

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
  constructor(buildings) {
    this.buildings = buildings;

    this.hoverId = null;
    this.selectedId = null;
    this.pressedId = null;
    this.disabled = new Set();
    this.colorMode = false;

    this.refresh();
  }

  setColorMode(on) {
    this.colorMode = !!on;
  }

  setHover(id) {
    if (id && this.disabled.has(id)) id = null;
    if (this.hoverId === id) return;
    this.hoverId = id;
    this.refresh();
  }

  clearHover() {
    if (this.hoverId === null) return;
    this.hoverId = null;
    this.refresh();
  }

  setSelected(id) {
    if (id && this.disabled.has(id)) return;
    this.selectedId = id;
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
      if (this.hoverId === id) this.hoverId = null;
      if (this.pressedId === id) this.pressedId = null;
    }
    this.refresh();
  }

  clearAll() {
    this.hoverId = null;
    this.selectedId = null;
    this.pressedId = null;
    this.refresh();
  }

  refresh() {
    const anyFocus =
      this.hoverId !== null || this.selectedId !== null || this.pressedId !== null;

    for (const b of this.buildings) {
      const id = b.userData.id;

      let target;
      if (this.disabled.has(id)) {
        target = "disabled";
      } else if (id === this.pressedId) {
        target = "pressed";
      } else if (id === this.selectedId) {
        // Selection sticks even when the cursor is over a different object.
        target = "selected";
      } else if (id === this.hoverId) {
        target = "hover";
      } else if (anyFocus) {
        target = "background";
      } else {
        target = "default";
      }

      b.userData.targetState = target;
    }
  }

  /**
   * Per-frame tween: nudge each building's current visual params toward
   * those of its target state. dt in seconds.
   */
  update(dt) {
    const t = 1 - Math.exp(-LERP_SPEED * dt);
    const colorMode = this.colorMode;

    for (const b of this.buildings) {
      const target = b.userData.targetState;
      const spec = stateSpec[target] ?? stateSpec.default;
      const colors = targetColors[target] ?? targetColors.default;
      const cur = b.userData.current;

      // Surface color/opacity resolution differs by mode:
      // - Monochrome: take the spec's neutral tint directly.
      // - Color mode: keep the building's identity color (ratio 0) for
      //   default/hover/selected/pressed, dimming opacity to 60% in the
      //   active states; fully replace with the spec for background and
      //   disabled so the recede behavior is preserved.
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
