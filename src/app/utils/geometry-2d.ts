// Math helpers to convert 2D coordinates to 3D properties

import { Wall2D } from "../store/project-store";

// Snap distance in pixels
export const SNAP_DISTANCE = 15;

/**
 * Scale factor: how many millimeters one pixel represents
 * For example, if 1 pixel = 10mm, a 300px line is 3000mm (3m)
 */
export const PX_TO_MM = 10;
export const MM_TO_PX = 1 / PX_TO_MM;

/**
 * Calculate the Euclidean distance between two 2D points
 */
export function distance(p1: [number, number], p2: [number, number]): number {
  return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

/**
 * Normalizes an angle to be between 0 and 360 degrees
 */
export function normalizeAngle(degrees: number): number {
  let angle = degrees % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Snaps an angle (in radians) to the nearest common angle if within threshold
 * Common angles: 0, 90, 180, 270 (in degrees)
 */
export function snapAngle(radians: number, thresholdDegrees: number = 5): number {
  let degrees = radians * (180 / Math.PI);
  degrees = normalizeAngle(degrees);
  
  const snapAngles = [0, 90, 180, 270, 360];
  
  for (const snap of snapAngles) {
    if (Math.abs(degrees - snap) <= thresholdDegrees) {
      return (snap === 360 ? 0 : snap) * (Math.PI / 180);
    }
  }
  
  return radians;
}

/**
 * Calculates the bounding box of a set of 2D walls.
 * Returns the center coordinates of this bounding box.
 */
export function getWallsBoundingBoxCenter(walls: Wall2D[]): [number, number] {
  if (walls.length === 0) return [0, 0];
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const wall of walls) {
    minX = Math.min(minX, wall.startNode[0], wall.endNode[0]);
    maxX = Math.max(maxX, wall.startNode[0], wall.endNode[0]);
    minY = Math.min(minY, wall.startNode[1], wall.endNode[1]);
    maxY = Math.max(maxY, wall.startNode[1], wall.endNode[1]);
  }

  return [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2];
}

/**
 * Calculates Wall properties (position, rotation Y, length) needed for Three.js
 * from a 2D start and end node
 */
export function calculate3DWallProperties(
  startNode: [number, number],
  endNode: [number, number],
  heightMm: number,
  thicknessMm: number = 0.0,
  // the center of the canvas in pixels, used to offset to 0,0,0 in 3D
  canvasCenterPx: [number, number] 
): { position: [number, number, number]; rotation: number; length: number } {
  const lengthPx = distance(startNode, endNode);
  const lengthMeters = (lengthPx * PX_TO_MM) / 1000;
  
  // Angle in 2D (canvas Y is down, so we adjust for 3D where Z is depth)
  const angle = Math.atan2(endNode[1] - startNode[1], endNode[0] - startNode[0]);

  // Center point of the wall in 2D (pixels)
  const centerX = (startNode[0] + endNode[0]) / 2;
  const centerY = (startNode[1] + endNode[1]) / 2;

  // Convert pixel offsets from center to meters offsets
  // In 3D: X is horizontal, Z is depth (corresponding to canvas Y)
  const posX = ((centerX - canvasCenterPx[0]) * PX_TO_MM) / 1000;
  const posZ = ((centerY - canvasCenterPx[1]) * PX_TO_MM) / 1000;
  
  // Y position in 3D is half height
  const posY = (heightMm / 1000) / 2;

  // In three.js, rotation Y is negative angle of 2D
  return {
    position: [posX, posY, posZ],
    rotation: -angle, 
    length: lengthMeters
  };
}

/**
 * Adjusts a wall's endNode to force it to a specific length in MM,
 * keeping the startNode fixed and the angle identical.
 */
export function resizeWallByLength(wall: Wall2D, newLengthMm: number): Wall2D {
  const currentLengthPx = distance(wall.startNode, wall.endNode);
  
  // Avoid division by zero
  if (currentLengthPx === 0) return wall;

  const newLengthPx = newLengthMm * MM_TO_PX;
  const ratio = newLengthPx / currentLengthPx;

  const dx = wall.endNode[0] - wall.startNode[0];
  const dy = wall.endNode[1] - wall.startNode[1];

  const newEndNode: [number, number] = [
    wall.startNode[0] + dx * ratio,
    wall.startNode[1] + dy * ratio
  ];

  return {
    ...wall,
    endNode: newEndNode
  };
}

/**
 * Modifies the endNode of a wall to match a specific angle 
 * (relative to right/0 degrees), keeping the current length intact.
 */
export function resizeWallByAngle(wall: Wall2D, newAngleDegrees: number): Wall2D {
  const currentLengthPx = distance(wall.startNode, wall.endNode);
  if (currentLengthPx === 0) return wall;

  const radians = newAngleDegrees * (Math.PI / 180);
  
  const newEndNode: [number, number] = [
    wall.startNode[0] + currentLengthPx * Math.cos(radians),
    wall.startNode[1] + currentLengthPx * Math.sin(radians)
  ];

  return {
    ...wall,
    endNode: newEndNode
  };
}
