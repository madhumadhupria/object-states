/**
 * Building factory.
 *
 * A "building" is a small Three.js Group composed of:
 *   - a translucent solid mesh (the "fill")
 *   - an edge-based line wrapping every silhouette edge (the "outline")
 *
 * The fill carries the surface tint; the outline carries the line treatment.
 * Both are driven by stateSpec entries from tokens.js, animated by states.js.
 */

import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { stateSpec, tokens } from "./tokens.js";

const RESOLUTION = new THREE.Vector2(window.innerWidth, window.innerHeight);

/**
 * Convert a BufferGeometry into a fat-line outline that traces only its
 * silhouette edges (45° threshold matches what looks right on cubes,
 * prisms, and chamfered shapes).
 */
function buildOutline(geometry, color, width) {
  const edges = new THREE.EdgesGeometry(geometry, 30);
  const positions = edges.attributes.position.array;
  const lineGeo = new LineSegmentsGeometry();
  lineGeo.setPositions(positions);

  const mat = new LineMaterial({
    color,
    linewidth: width,
    transparent: true,
    opacity: 1,
    depthTest: true,
    resolution: RESOLUTION,
  });

  const segments = new Line2(lineGeo, mat);
  segments.computeLineDistances();
  return segments;
}

function buildFill(geometry, color, opacity) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity,
    roughness: 0.95,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  return new THREE.Mesh(geometry, mat);
}

/**
 * Wrap a geometry into a state-aware "building" object.
 * Returns a Group whose .userData carries the live state machine hooks.
 */
function makeBuilding({ id, geometry, position, rotationY = 0, label }) {
  const group = new THREE.Group();
  group.name = id;
  group.position.copy(position);
  group.rotation.y = rotationY;

  const spec = stateSpec.default;
  const fill = buildFill(geometry, spec.surfaceColor, spec.surfaceOpacity);
  const outline = buildOutline(geometry, spec.outlineColor, spec.outlineWidth);

  fill.castShadow = true;
  fill.receiveShadow = true;

  group.add(fill);
  group.add(outline);

  group.userData = {
    kind: "building",
    id,
    label: label ?? id,
    fill,
    outline,
    state: "default",
    targetState: "default",
    // Animated values — interpolated each frame toward the target state's spec.
    current: {
      surfaceColor: new THREE.Color(spec.surfaceColor),
      surfaceOpacity: spec.surfaceOpacity,
      outlineColor: new THREE.Color(spec.outlineColor),
      outlineWidth: spec.outlineWidth,
      outlineOpacity: spec.outlineOpacity,
    },
  };

  return group;
}

/**
 * Build an L-shaped massing block by extruding a 2D L-shape footprint.
 * ExtrudeGeometry produces clean silhouette edges with no internal seams.
 */
function lShapedGeometry(a = 1, b = 1, h = 1, t = 0.5) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(a, 0);
  shape.lineTo(a, t);
  shape.lineTo(t, t);
  shape.lineTo(t, b);
  shape.lineTo(0, b);
  shape.lineTo(0, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
    curveSegments: 1,
  });

  // ExtrudeGeometry extrudes along +Z; rotate so height is along Y, and
  // recenter so the building's footprint origin is at its centroid.
  geo.rotateX(-Math.PI / 2);
  geo.translate(-a / 2, 0, -b / 2);
  return geo;
}

/**
 * Compose the architectural scene: a small cluster of building forms
 * arranged on a neutral ground plane. Returns the array of building
 * groups along with the static scene props (ground, road lines, etc.)
 * which animate alongside selected/de-emphasized objects.
 */
export function createScene() {
  const buildings = [];

  // Tower (tall slim block)
  buildings.push(
    makeBuilding({
      id: "tower",
      label: "Tower",
      geometry: new THREE.BoxGeometry(1.6, 4.2, 1.6).translate(0, 2.1, 0),
      position: new THREE.Vector3(-3.0, 0, -1.2),
    }),
  );

  // Mid-rise (medium box)
  buildings.push(
    makeBuilding({
      id: "midrise",
      label: "Mid-rise",
      geometry: new THREE.BoxGeometry(2.4, 2.0, 2.0).translate(0, 1.0, 0),
      position: new THREE.Vector3(-0.2, 0, -0.6),
    }),
  );

  // L-shaped wing
  const lGeo = lShapedGeometry(2.6, 2.0, 1.6, 0.9);
  buildings.push(
    makeBuilding({
      id: "wing",
      label: "L-wing",
      geometry: lGeo,
      position: new THREE.Vector3(2.6, 0, -0.5),
      rotationY: Math.PI * 0.5,
    }),
  );

  // Pavilion (low wide block)
  buildings.push(
    makeBuilding({
      id: "pavilion",
      label: "Pavilion",
      geometry: new THREE.BoxGeometry(2.8, 0.7, 1.6).translate(0, 0.35, 0),
      position: new THREE.Vector3(-1.6, 0, 2.2),
    }),
  );

  // Hex pylon — cylinder, 6 sides, reads as a polygonal column form
  buildings.push(
    makeBuilding({
      id: "pylon",
      label: "Hex pylon",
      geometry: new THREE.CylinderGeometry(0.55, 0.55, 2.6, 6).translate(0, 1.3, 0),
      position: new THREE.Vector3(2.1, 0, 2.4),
    }),
  );

  // Slab (low wide rectangular volume — sits behind to add depth)
  buildings.push(
    makeBuilding({
      id: "slab",
      label: "Slab",
      geometry: new THREE.BoxGeometry(4.0, 1.2, 1.0).translate(0, 0.6, 0),
      position: new THREE.Vector3(0.4, 0, -3.6),
    }),
  );

  return buildings;
}

/**
 * Ground plane + perimeter line. Stays static (not part of the state system),
 * but tinted in line with the Figma "context" treatment.
 */
export function createGround() {
  const group = new THREE.Group();

  const geo = new THREE.PlaneGeometry(40, 40);
  const mat = new THREE.MeshStandardMaterial({
    color: tokens.surface.level250,
    roughness: 1.0,
    metalness: 0.0,
  });
  const plane = new THREE.Mesh(geo, mat);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  group.add(plane);

  // Subtle grid overlay — diagrammatic, low contrast.
  const grid = new THREE.GridHelper(40, 40, tokens.surface.level300, tokens.surface.level300);
  grid.position.y = 0.001;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  group.add(grid);

  // A few "road" lines, picking up the 50% opacity background treatment
  // called out in the Figma annotations.
  const roadPositions = [
    [-8, 0.01, 0, 8, 0.01, 0],
    [0, 0.01, -8, 0, 0.01, 8],
    [-8, 0.01, 3.6, 8, 0.01, 3.6],
  ];
  for (const [x1, y1, z1, x2, y2, z2] of roadPositions) {
    const lineGeo = new LineSegmentsGeometry();
    lineGeo.setPositions([x1, y1, z1, x2, y2, z2]);
    const mat = new LineMaterial({
      color: tokens.border.base,
      linewidth: 1.0,
      transparent: true,
      opacity: 0.5,
      resolution: RESOLUTION,
    });
    const line = new Line2(lineGeo, mat);
    line.computeLineDistances();
    line.userData.kind = "road";
    group.add(line);
  }

  return group;
}

export function getOutlineResolution() {
  return RESOLUTION;
}
