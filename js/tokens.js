/**
 * Design tokens — pulled from Figma node 44:3082
 * (Component testing dump → Object States)
 *
 * Each token mirrors a Figma variable. THREE.Color expects values
 * either as hex strings or as numeric literals; we expose both
 * forms so they can be used in CSS-style and material code paths.
 */

export const tokens = {
  surface: {
    level100: 0xffffff,
    level250: 0xeeeeee,
    level300: 0xd9d9d9,
  },
  border: {
    base: 0x808080,
    accent: 0x0696d7,
  },
  pressed: {
    line: 0x006eaf,
    fill: 0x6ac0e7,
  },
  hover: {
    fill: 0x9bd5ef,
  },
  selected: {
    fill: 0xcdeaf7,
  },
  text: 0x3c3c3c,
};

/**
 * Visual specification per state — outline color, outline weight,
 * surface tint, and surface opacity. Numbers map directly into the
 * material/line params used by buildings.js.
 *
 * Outline weights reflect Figma's px values; in WebGL we approximate
 * via LineMaterial linewidth (world units, scaled).
 */
export const stateSpec = {
  default: {
    outlineColor: tokens.border.base,
    outlineWidth: 1.0,
    outlineOpacity: 1.0,
    surfaceColor: tokens.surface.level100,
    surfaceOpacity: 1.0,
  },
  hover: {
    outlineColor: tokens.border.accent,
    outlineWidth: 1.4,
    outlineOpacity: 1.0,
    surfaceColor: tokens.hover.fill,
    surfaceOpacity: 0.30,
  },
  selected: {
    outlineColor: tokens.border.accent,
    outlineWidth: 2.0,
    outlineOpacity: 1.0,
    surfaceColor: tokens.selected.fill,
    surfaceOpacity: 0.60,
  },
  pressed: {
    outlineColor: tokens.pressed.line,
    outlineWidth: 2.4,
    outlineOpacity: 1.0,
    surfaceColor: tokens.pressed.fill,
    surfaceOpacity: 0.5,
  },
  background: {
    outlineColor: tokens.surface.level300,
    outlineWidth: 0.5,
    outlineOpacity: 0.5,
    surfaceColor: tokens.surface.level100,
    surfaceOpacity: 0.45,
  },
  disabled: {
    outlineColor: tokens.surface.level300,
    outlineWidth: 0.5,
    outlineOpacity: 0.25,
    surfaceColor: tokens.surface.level250,
    surfaceOpacity: 0.20,
  },
};
