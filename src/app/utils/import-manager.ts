import { Wall2D } from "../store/project-store";
import { PresetManager, PresetWall } from "./preset-manager";

import { validateRoomBounds } from "./geometry-2d";

export class ImportManager {
  /**
   * Parses a JSON string containing either simple lengths/angles
   * or a full exported project state and returns generated walls or full state.
   */
  static parseProjectJSON(jsonString: string): any {
    try {
      const data = JSON.parse(jsonString);

      // Check for simple format: { "walls": [ { "length": 4, "angle": 0 } ] }
      if (data.walls && Array.isArray(data.walls)) {
        
        // Is it the full exported format? (contains startNode/endNode)
        if (data.walls.length > 0 && "startNode" in data.walls[0]) {
           if (!validateRoomBounds(data.walls)) {
              throw new Error("Projekt przekracza maksymalne dozwolone wymiary 10x10m.");
           }
           return data; // Return full object so UI can check for furniture
        }
        
        // Simple preset format
        const presetWalls: PresetWall[] = data.walls.map((w: any) => {
          if (typeof w.length !== "number" || typeof w.angle !== "number") {
            throw new Error("Invalid wall format in JSON. Expected length and angle numbers.");
          }
          return { length: w.length, angle: w.angle };
        });

        const generatedWalls = PresetManager.generateWallsFromLengthsAndAngles(presetWalls);
        
        if (!validateRoomBounds(generatedWalls)) {
           throw new Error("Wygenerowany szkic wgrywanego pliku przekracza dozwolone wymiary 10x10m.");
        }

        return { walls: generatedWalls };
      }
      
      throw new Error("JSON must contain a 'walls' array.");

    } catch (e: any) {
       console.error("Import failed: ", e.message);
       throw e; // Rethrow to be caught by UI and shown as toast
    }
  }
}
