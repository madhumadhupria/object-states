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
 * Architectural palette used when "color mode" is enabled. Muted, low-chroma
 * tones that read as material study models (clay, slate, ochre, sage) rather
 * than primary swatches. Each building is assigned one entry by id.
 */
export const buildingPalette = {
  tower: 0xb85c5c,    // muted brick
  midrise: 0x4a7c7e,  // slate teal
  wing: 0xc9a96e,     // warm ochre
  pavilion: 0x6e8b6f, // sage
  pylon: 0xc77b45,    // terracotta
  slab: 0x6f6989,     // slate purple
};

/**
 * In color mode, the building's identity color shows through during the
 * resting and active states; the state spec's surface tint is blended in at
 * a per-state ratio (0 = pure base color, 1 = pure spec). Background and
 * disabled states fully adopt the spec color so the scene still reads as
 * "white massing models" when something else is the focus.
 *
 * Surface opacity is overridden per state to keep colored buildings opaque
 * enough to read at rest, and to fade them properly in the recede states.
 */
export const colorModeOverlay = {
  default:    { ratio: 0.0, opacity: 1.00 },
  hover:      { ratio: 0.0, opacity: 0.60 },
  selected:   { ratio: 0.0, opacity: 0.60 },
  pressed:    { ratio: 0.0, opacity: 0.60 },
  background: { ratio: 1.0, opacity: 0.45 },
  disabled:   { ratio: 1.0, opacity: 0.20 },
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
