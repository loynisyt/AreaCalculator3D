import * as THREE from "three";
import { Furniture3D, FurnitureCategory, FURNITURE_CATALOG } from "../components/configurator3d/types";

export class CountertopManager {
  /**
   * Generates countertops that perfectly span adjacent row sequences of "Szafki dolne"
   */
  static generateCountertops(existingFurniture: Furniture3D[]): Furniture3D[] {
    // 1. Filter existing layout
    const baseCabinets = existingFurniture.filter(f => f.category === "Szafki dolne");
    
    // We only keep non-automated furniture from the scene to begin with
    const cleanedFurniture = existingFurniture.filter(f => f.category !== "Blaty" || !f.name.includes("Auto Blat"));

    if (baseCabinets.length === 0) return cleanedFurniture;

    // 2. Identify grouped segments based on identical rotations and touching bounding boxes
    const groups: Furniture3D[][] = [];
    let visited = new Set<string>();

    for (const cabinet of baseCabinets) {
      if (visited.has(cabinet.id)) continue;

      const currentGroup = [cabinet];
      visited.add(cabinet.id);

      // Perform a flood-fill to find all touching pieces
      let added = true;
      while (added) {
        added = false;
        
        for (const candidate of baseCabinets) {
          if (visited.has(candidate.id)) continue;
          
          // Must face the exact same direction to be considered same row
          if (Math.abs(candidate.rotation[1] - cabinet.rotation[1]) > 0.01) continue;

          // Check if candidate touches any cabinet in the current group
          const touches = currentGroup.some(member => this.areCabinetsTouching(member, candidate));
          
          if (touches) {
            currentGroup.push(candidate);
            visited.add(candidate.id);
            added = true;
          }
        }
      }

      groups.push(currentGroup);
    }

    // 3. For each group, construct a spanning countertop
    const newCountertops: Furniture3D[] = [];
    const blatTemplate = FURNITURE_CATALOG["Blaty"][0] as Partial<Furniture3D>; // Use 60cm blat as base material

    groups.forEach((group, index) => {
      // Find min/max bounds in local space of the row
      const rotationY = group[0].rotation[1];
      const cos = Math.cos(-rotationY);
      const sin = Math.sin(-rotationY);

      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      let maxHeight = -Infinity;

      group.forEach(cab => {
        // Find cabinet center in local space (rotated back to non-rotated alignment)
        const localX = cab.position[0] * cos - cab.position[2] * sin;
        const localZ = cab.position[0] * sin + cab.position[2] * cos;

        const w = cab.dimensions.width / 1000;
        const d = cab.dimensions.depth / 1000;
        
        minX = Math.min(minX, localX - w / 2);
        maxX = Math.max(maxX, localX + w / 2);
        minZ = Math.min(minZ, localZ - d / 2); // Depth matching
        maxZ = Math.max(maxZ, localZ + d / 2);

        // Top edge of the cabinet in meters
        const topY = cab.position[1] + (cab.dimensions.height / 2000);
        maxHeight = Math.max(maxHeight, topY);
      });

      const spanWidth = (maxX - minX) * 1000; // back to mm
      const spanDepth = (maxZ - minZ) * 1000; // max depth
      
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;

      // Rotate center back into world space
      const worldX = centerX * Math.cos(rotationY) - centerZ * Math.sin(rotationY);
      const worldZ = centerX * Math.sin(rotationY) + centerZ * Math.cos(rotationY);

      // We place the blat exactly on top of the max height of the cabinets
      // Countertop height sits half above that line
      const blatHeight = blatTemplate.dimensions?.height || 40;
      const worldY = maxHeight + (blatHeight / 2000); 

      newCountertops.push({
        id: `auto-blat-${Date.now()}-${index}`,
        name: `Auto Blat ${Math.round(spanWidth)}x${Math.round(spanDepth)}`,
        category: "Blaty",
        position: [worldX, worldY, worldZ],
        rotation: [0, rotationY, 0],
        scale: [1, 1, 1],
        dimensions: {
          width: spanWidth,
          height: blatHeight,
          depth: spanDepth
        },
        material: blatTemplate.material!,
        frontType: blatTemplate.frontType!,
        basePrice: (blatTemplate.basePrice || 100) * (spanWidth / 1000), // scale price
        hardware: [],
        snapPoints: {
          left: false, right: false, top: false, bottom: true, back: false
        },
        isAppliance: false,
        requiresSupport: false,
        shelfCount: 0
      });
    });

    return [...cleanedFurniture, ...newCountertops];
  }

  private static areCabinetsTouching(a: Furniture3D, b: Furniture3D): boolean {
    const TOLERANCE = 0.05; // 5cm snap tolerance
    
    // To check if they touch, calculate distance between centers. 
    // They must touch along the local X or local Z axis.
    const dx = a.position[0] - b.position[0];
    const dz = a.position[2] - b.position[2];
    const dist = Math.sqrt(dx*dx + dz*dz);
    
    // Calculate expected center-to-center distance if perfectly adjacent
    const widthA = (a.dimensions.width / 1000) * a.scale[0];
    const widthB = (b.dimensions.width / 1000) * b.scale[0];
    const depthA = (a.dimensions.depth / 1000) * a.scale[2];
    const depthB = (b.dimensions.depth / 1000) * b.scale[2];

    const expectedDistX = (widthA + widthB) / 2;
    const expectedDistZ = (depthA + depthB) / 2;

    // We check if the distance matches either side-by-side or front-to-back
    // For countertops, usually we want side-by-side (X axis distance matches, Z axis distance is ~0)
    // Or back-to-back islands (Z axis matches, X axis ~0)
    
    // Since they share the same rotation, we can project the distance to local space
    const rotationY = a.rotation[1];
    const localDx = Math.abs(dx * Math.cos(-rotationY) - dz * Math.sin(-rotationY));
    const localDz = Math.abs(dx * Math.sin(-rotationY) + dz * Math.cos(-rotationY));

    const touchesX = Math.abs(localDx - expectedDistX) < TOLERANCE && localDz < TOLERANCE;
    const touchesZ = Math.abs(localDz - expectedDistZ) < TOLERANCE && localDx < TOLERANCE;

    return touchesX || touchesZ;
  }
}
