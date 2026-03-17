import { Wall2D } from "../store/project-store";

export interface PresetWall {
  length: number; // in mm
  angle: number; // in degrees
}

export class PresetManager {
  /**
   * Converts a list of lengths and angles into a list of absolute Wall2D objects.
   * Useful for generating predefined shapes or importing from simple JSON.
   */
  static generateWallsFromLengthsAndAngles(wallsData: PresetWall[]): Wall2D[] {
    const generatedWalls: Wall2D[] = [];
    
    // Start from an arbitrary center point on canvas, e.g., [400, 300]
    let currentPoint: [number, number] = [400, 300];

    wallsData.forEach((wallDef, index) => {
      const radians = wallDef.angle * (Math.PI / 180);
      
      // Calculate length in pixels
      const lengthPx = wallDef.length / 10; 

      const nextPoint: [number, number] = [
        currentPoint[0] + lengthPx * Math.cos(radians),
        currentPoint[1] + lengthPx * Math.sin(radians)
      ];

      generatedWalls.push({
        id: `wall-preset-${Date.now()}-${index}`,
        startNode: currentPoint,
        endNode: nextPoint,
        isSemiWall: false,
        position: [0, 0, 0], // Re-calculated later in 3D
        rotation: 0,
        length: 0,
        height: 3000,
        thickness: 100
      });

      currentPoint = nextPoint;
    });

    return generatedWalls;
  }
}
