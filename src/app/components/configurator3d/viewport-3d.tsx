import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  TransformControls,
  PerspectiveCamera,
  Environment,
  Html,
  useTexture,
  Preload
} from "@react-three/drei";
import { Furniture3D, Room3D, FURNITURE_CATALOG } from "./types";
import { Wall2D, useProjectStore } from "../../store/project-store";
import { calculate3DWallProperties, getWallsBoundingBoxCenter } from "../../utils/geometry-2d";
import { LoadingScreen } from "./loading-screen";
import * as THREE from "three";
// Import typu Room zostawiam, jeśli używasz go gdzieś indziej, 
// choć w tym pliku używasz Room3D z "./types"
import { Room } from '../calculator/types';

interface ViewportProps {
  furniture: Furniture3D[];
  walls: Wall2D[];
  room: Room3D;
  canvasCenterPx: [number, number];
  selectedId: string | null;
  transformMode: "translate" | "rotate" | "scale";
  snapEnabled: boolean;
  onSelectFurniture: (id: string | null) => void;
  onTransformFurniture: (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
}

// Snapping configuration
const SNAP_DISTANCE = 0.05; // 5cm in meters
const WALL_SNAP_DISTANCE = 0.1; // 10cm

function FurnitureContent({
  furniture,
  isSelected,
  hasCollision,
  onSelect,
  onTransform,
  transformMode,
  snapEnabled,
  allFurniture,
  walls,
  room,
  canvasCenterPx,
}: {
  furniture: Furniture3D;
  isSelected: boolean;
  hasCollision: boolean;
  onSelect: () => void;
  onTransform: (
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
  transformMode: "translate" | "rotate" | "scale";
  snapEnabled: boolean;
  allFurniture: Furniture3D[];
  walls: Wall2D[];
  room: Room3D;
  canvasCenterPx: [number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const transformRef = useRef<any>(null);
  const [isSnapped, setIsSnapped] = useState(false);

  // Convert mm to meters for Three.js
  const width = (furniture.dimensions.width / 1000) * furniture.scale[0];
  const height = (furniture.dimensions.height / 1000) * furniture.scale[1];
  const depth = (furniture.dimensions.depth / 1000) * furniture.scale[2];

  // --- ŁADOWANIE TEKSTUR ---
  // Uwaga: fallback to np. szara textura w przypadku braku pliku. 
  // Upewnij się, że masz jakiś plik domyślny lub obsłuż brak ścieżki w inny sposób.
 const textures = useTexture({
  map: furniture.material.textures?.baseColor || "/textures/Wood094_1K-JPG_Color.jpg",
  frontMap: furniture.material.textures?.frontColor || furniture.material.textures?.baseColor || "/textures/Wood094_1K-JPG_Color.jpg",
  normalMap: furniture.material.textures?.normal || "/textures/Wood094_1K-JPG_NormalDX.jpg",
  roughnessMap: furniture.material.textures?.roughness || "/textures/Wood094_1K-JPG_Roughness.jpg",
});

  // Ustawienie powtarzalności tekstury, aby uniknąć rozciągania (UV Mapping)
  useEffect(() => {
    [textures.map, textures.frontMap].forEach((t) => {
      if (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        // Powtarzaj teksturę np. co 50cm. Dopasuj te wartości do skali swojej tekstury.
        t.repeat.set(width / 0.5, height / 0.5);
      }
    });
  }, [textures, width, height]);

  // --- NOWY KOD: Funkcja blokująca na ś  // --- ZAKTUALIZOWANY KOD: Funkcja blokująca na ścianach z uwzględnieniem obrotu ---
  const applyClamping = (position: THREE.Vector3): THREE.Vector3 => {
    // 1. Pobieramy kąt obrotu na osi Y (w radianach)
    const rotY = furniture.rotation[1];
    
    // 2. Obliczamy efektywne wymiary pudełka brzegowego (Bounding Box)
    const cos = Math.abs(Math.cos(rotY));
    const sin = Math.abs(Math.sin(rotY));
    
    const boundingWidth = width * cos + depth * sin;
    const boundingDepth = depth * cos + width * sin;

    // 3. Obliczamy faktyczne granice pokoju na podstawie narysowanych ścian
    let roomMinX = -(room.width / 2);
    let roomMaxX = (room.width / 2);
    let roomMinZ = -(room.depth / 2);
    let roomMaxZ = (room.depth / 2);

    if (walls.length > 0) {
      roomMinX = Infinity;
      roomMaxX = -Infinity;
      roomMinZ = Infinity;
      roomMaxZ = -Infinity;

      // Współczynnik 10mm na 1 pixel
      const PX_TO_M = 10 / 1000;

      walls.forEach(w => {
        const sx = (w.startNode[0] - canvasCenterPx[0]) * PX_TO_M;
        const sz = (w.startNode[1] - canvasCenterPx[1]) * PX_TO_M;
        const ex = (w.endNode[0] - canvasCenterPx[0]) * PX_TO_M;
        const ez = (w.endNode[1] - canvasCenterPx[1]) * PX_TO_M;

        roomMinX = Math.min(roomMinX, sx, ex);
        roomMaxX = Math.max(roomMaxX, sx, ex);
        roomMinZ = Math.min(roomMinZ, sz, ez);
        roomMaxZ = Math.max(roomMaxZ, sz, ez);
      });
      
      // Dodajemy margines dla grubości ścian (np. połowa ze standardowych 10cm)
      roomMinX -= 0.05;
      roomMaxX += 0.05;
      roomMinZ -= 0.05;
      roomMaxZ += 0.05;
    }

    // 4. Używamy zaktualizowanych wymiarów do blokowania
    let minX = roomMinX + (boundingWidth / 2);
    let maxX = roomMaxX - (boundingWidth / 2);
    
    const minY = height / 2; 
    const maxY = room.height - (height / 2); 
    
    let minZ = roomMinZ + (boundingDepth / 2);
    let maxZ = roomMaxZ - (boundingDepth / 2);
    
    // Zabezpieczenie przed sytuacją gdy mebel jest większy niż cały pokój
    if (minX > maxX) {
      const mid = (minX + maxX) / 2;
      minX = mid; maxX = mid;
    }
    if (minZ > maxZ) {
      const mid = (minZ + maxZ) / 2;
      minZ = mid; maxZ = mid;
    }

    return new THREE.Vector3(
      Math.max(minX, Math.min(maxX, position.x)),
      Math.max(minY, Math.min(maxY, position.y)),
      Math.max(minZ, Math.min(maxZ, position.z))
    );
  };

  // Intelligent snapping logic
  const applySnapping = (
    position: THREE.Vector3,
    furnitureId: string
  ): { position: THREE.Vector3; rotationY?: number; isSnapped: boolean } => {
    if (!snapEnabled) return { position, isSnapped: false };

    const snappedPos = position.clone();
    let snappedRotY = furniture.rotation[1];
    const currentFurniture = allFurniture.find((f) => f.id === furnitureId);
    if (!currentFurniture) return { position, isSnapped: false };

    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    let isSnapped = false;
    let snappedToOther = false;

    // Snap to other furniture (side-by-side)
    for (const other of allFurniture) {
      if (other.id === furnitureId) continue;

      const otherWidth = (other.dimensions.width / 1000) * other.scale[0];
      const otherDepth = (other.dimensions.depth / 1000) * other.scale[2];
      const otherHalfWidth = otherWidth / 2;
      const otherHalfDepth = otherDepth / 2;

      const otherPos = new THREE.Vector3(...other.position);

      // Check if Y positions are similar (same level)
      if (Math.abs(position.y - otherPos.y) < 0.2) {
        // Snap right side to left side of other
        if (
          Math.abs(position.z - otherPos.z) < SNAP_DISTANCE &&
          Math.abs(position.x + halfWidth - (otherPos.x - otherHalfWidth)) <
            SNAP_DISTANCE
        ) {
          snappedPos.x = otherPos.x - otherHalfWidth - halfWidth;
          snappedPos.z = otherPos.z;
          snappedToOther = true;
          isSnapped = true;
        }

        // Snap left side to right side of other
        if (
          Math.abs(position.z - otherPos.z) < SNAP_DISTANCE &&
          Math.abs(position.x - halfWidth - (otherPos.x + otherHalfWidth)) <
            SNAP_DISTANCE
        ) {
          snappedPos.x = otherPos.x + otherHalfWidth + halfWidth;
          snappedPos.z = otherPos.z;
          snappedToOther = true;
          isSnapped = true;
        }

        // Snap back to front of other
        if (
          Math.abs(position.x - otherPos.x) < SNAP_DISTANCE &&
          Math.abs(position.z + halfDepth - (otherPos.z - otherHalfDepth)) <
            SNAP_DISTANCE
        ) {
          snappedPos.z = otherPos.z - otherHalfDepth - halfDepth;
          snappedPos.x = otherPos.x;
          snappedToOther = true;
          isSnapped = true;
        }

        // Snap front to back of other
        if (
          Math.abs(position.x - otherPos.x) < SNAP_DISTANCE &&
          Math.abs(position.z - halfDepth - (otherPos.z + otherHalfDepth)) <
            SNAP_DISTANCE
        ) {
          snappedPos.z = otherPos.z + otherHalfDepth + halfDepth;
          snappedPos.x = otherPos.x;
          snappedToOther = true;
          isSnapped = true;
        }
      }
    }

    // Snap to walls
    if (!snappedToOther && currentFurniture.snapPoints.back) {
      // Much more robust wall locking logic 
      let minWallDist = WALL_SNAP_DISTANCE * 4; // allow generous grab distance
      for (const wall of walls) {
        if (!wall.startNode || !wall.endNode) continue;
        
        const wallProps = calculate3DWallProperties(wall.startNode, wall.endNode, wall.height, wall.thickness, canvasCenterPx);
        const wallPos = new THREE.Vector3(...wallProps.position);
        
        // Math to find distance to wall segment in 3D XZ plane
        const dx = position.x - wallPos.x;
        const dz = position.z - wallPos.z;
        
        // Rotate point to wall's local space
        const cos = Math.cos(wallProps.rotation);
        const sin = Math.sin(wallProps.rotation);
        
        const localX = dx * cos - dz * sin;
        const localZ = dx * sin + dz * cos;
        
        // Closest point on wall segment
        const halfLen = wallProps.length / 2;
        const clampX = Math.max(-halfLen, Math.min(halfLen, localX));
        const distToSegmentSq = Math.pow(localX - clampX, 2) + Math.pow(localZ, 2);
        const distToSegment = Math.sqrt(distToSegmentSq);
        
        // If within snap physics distance
        if (distToSegment < minWallDist) {
            minWallDist = distToSegment;
            
            // We want to snap furniture's back to the wall.
            // Which side of the wall are we on?
            const side = localZ >= 0 ? 1 : -1;
            // 0.1 is wall thickness, added 0.01 for z-fighting
            const targetLocalZ = side * (halfDepth + 0.01 + 0.1 / 2); 
            
            const targetWorldX = wallPos.x + clampX * cos + targetLocalZ * sin;
            const targetWorldZ = wallPos.z - clampX * sin + targetLocalZ * cos;
            
            snappedPos.x = targetWorldX;
            snappedPos.z = targetWorldZ;
            
            // Align rotation to face interior (normal of the wall face we snapped to)
            snappedRotY = wallProps.rotation + (side === 1 ? 0 : Math.PI);
            isSnapped = true;
        }
      }
    }

    return { position: snappedPos, rotationY: snappedRotY, isSnapped };
  };

  // Attach transform controls when selected
  useEffect(() => {
    if (transformRef.current && meshRef.current && isSelected) {
      transformRef.current.attach(meshRef.current);
    }
  }, [isSelected]);

  // Reset glow when deselected
  useEffect(() => {
    if (!isSelected) {
      setIsSnapped(false);
    }
  }, [isSelected]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={furniture.position}
        rotation={furniture.rotation}
        scale={furniture.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height, depth]} />
        
        {/* --- MAPOWANIE MATERIAŁÓW (Boki osobno, Front osobno) --- */}
        {/* Kolejność: [Prawy, Lewy, Góra, Dół, FRONT, Tył] */}
        
        {/* Bok Prawy (0) */}
        <meshStandardMaterial attach="material-0" map={textures.map} color={furniture.material.color} />
        {/* Bok Lewy (1) */}
        <meshStandardMaterial attach="material-1" map={textures.map} color={furniture.material.color} />
        {/* Góra (2) */}
        <meshStandardMaterial attach="material-2" map={textures.map} color={furniture.material.color} />
        {/* Dół (3) */}
        <meshStandardMaterial attach="material-3" map={textures.map} color={furniture.material.color} />
        
        {/* FRONT (4) */}
        <meshStandardMaterial 
          attach="material-4" 
          map={textures.frontMap}
          color={hasCollision ? "#ff4444" : furniture.material.color}
          metalness={0.2}
          roughness={0.8}
          emissive={isSelected ? (isSnapped ? "#10b981" : "#3498db") : hasCollision ? "#ff0000" : "#000000"}
          emissiveIntensity={isSelected ? (isSnapped ? 0.4 : 0.2) : hasCollision ? 0.3 : 0}
        />

        {/* Tył (5) */}
        <meshStandardMaterial attach="material-5" map={textures.map} color={furniture.material.color} />

        {/* Edge highlighting */}
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(width, height, depth)]}
          />
          <lineBasicMaterial
            color={
              isSelected ? (isSnapped ? "#10b981" : "#00ffff") : hasCollision ? "#ff0000" : "#ffffff"
            }
            linewidth={isSelected ? (isSnapped ? 4 : 2) : 1}
            transparent
            opacity={isSelected ? 0.8 : 0.3}
          />
        </lineSegments>
      </mesh>

      {/* Dimension label */}
      {isSelected && (
        <Html position={[0, height / 2 + 0.3, 0]} center>
          <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded text-xs text-white font-mono whitespace-nowrap">
            {furniture.dimensions.width} × {furniture.dimensions.height} ×{" "}
            {furniture.dimensions.depth} mm
          </div>
        </Html>
      )}

      {/* Unity-style Gizmo (Transform Controls) */}
      {isSelected && (
        <TransformControls
          ref={transformRef}
          mode={transformMode}
          translationSnap={snapEnabled ? 0.01 : undefined}
          rotationSnap={snapEnabled ? Math.PI / 4 : undefined}
          scaleSnap={snapEnabled ? 0.1 : undefined}
          onObjectChange={() => {
            if (meshRef.current) {
              let newPosition = meshRef.current.position.clone();

              // Apply snapping
              let newRotY = meshRef.current.rotation.y;
              if (transformMode === "translate") {
                const snapResult = applySnapping(newPosition, furniture.id);
                newPosition = snapResult.position;
                if (snapResult.rotationY !== undefined) newRotY = snapResult.rotationY;
                
                setIsSnapped(snapResult.isSnapped);
                newPosition = applyClamping(newPosition);
                meshRef.current.position.copy(newPosition);
                meshRef.current.rotation.y = newRotY;
              } else {
                setIsSnapped(false);
              }

              onTransform(
                [newPosition.x, newPosition.y, newPosition.z],
                [
                  meshRef.current.rotation.x,
                  newRotY,
                  meshRef.current.rotation.z,
                ],
                [
                  meshRef.current.scale.x,
                  meshRef.current.scale.y,
                  meshRef.current.scale.z,
                ]
              );
            }
          }}
        />
      )}
    </group>
  );
}

function WallMesh({ wall, isClosest, canvasCenterPx }: { wall: Wall2D, isClosest: boolean, canvasCenterPx: [number, number] }) {
  const doors = useProjectStore(state => state.doors);
  const wallDoors = doors.filter(d => d.wallId === wall.id);
  
  // Convert 2D to 3D properties
  const wallProps = useMemo(() => {
     return calculate3DWallProperties(wall.startNode, wall.endNode, wall.height, wall.thickness, canvasCenterPx);
  }, [wall, canvasCenterPx]);

  const height = wall.isSemiWall ? wall.height / 2 : wall.height;
  const heightM = height / 1000;
  const thicknessM = 0.1; // 100mm wall thickness

  // Material Opacity Logic
  // If it's one of the 2 closest walls, we make it transparent to see inside
  const opacity = isClosest ? 0.1 : 1.0;
  const transparent = isClosest;

  // We need to cut out doors if they exist
  // For simplicity without using CSG, we can draw the wall as a combination of smaller boxes if there are doors.
  // Assuming a single door for now:
  
  if (wallDoors.length > 0) {
     const sortedDoors = [...wallDoors].sort((a,b) => a.distanceFromStart - b.distanceFromStart);
     let lastXM = 0;
     const segments = [];
     
     sortedDoors.forEach((door, idx) => {
         const doorStartM = door.distanceFromStart / 1000;
         const doorWidthM = door.width / 1000;
         const doorHeightM = door.height / 1000;
         
         // Left solid segment before door
         const leftLen = doorStartM - lastXM;
         if (leftLen > 0) {
            const cx = -wallProps.length/2 + lastXM + leftLen/2;
            segments.push(
               <mesh key={`solid-${idx}`} position={[cx, 0, 0]} receiveShadow>
                 <boxGeometry args={[leftLen, heightM, thicknessM]} />
                 <meshStandardMaterial color="#34495e" transparent={transparent} opacity={opacity} />
               </mesh>
            );
         }
         
         // Top segment above door
         if (heightM > doorHeightM) {
            const topHeight = heightM - doorHeightM;
            const tcy = (heightM - doorHeightM)/2 + doorHeightM/2;
            const tcx = -wallProps.length/2 + doorStartM + doorWidthM/2;
            segments.push(
               <mesh key={`top-${idx}`} position={[tcx, tcy, 0]} receiveShadow>
                 <boxGeometry args={[doorWidthM, topHeight, thicknessM]} />
                 <meshStandardMaterial color="#34495e" transparent={transparent} opacity={opacity} />
               </mesh>
            );
         }
         
         lastXM = doorStartM + doorWidthM;
     });
     
     // Final segment after the last door
     const finalLen = wallProps.length - lastXM;
     if (finalLen > 0) {
        const cx = -wallProps.length/2 + lastXM + finalLen/2;
        segments.push(
           <mesh key="final-solid" position={[cx, 0, 0]} receiveShadow>
             <boxGeometry args={[finalLen, heightM, thicknessM]} />
             <meshStandardMaterial color="#34495e" transparent={transparent} opacity={opacity} />
           </mesh>
        );
     }
     
     return (
        <group position={wallProps.position} rotation={[0, wallProps.rotation, 0]}>
           {segments}
        </group>
     )
  }

  return (
    <mesh
      position={wallProps.position}
      rotation={[0, wallProps.rotation, 0]}
      receiveShadow
    >
      <boxGeometry args={[wallProps.length, heightM, thicknessM]} />
      <meshStandardMaterial
        color="#34495e"
        transparent={transparent}
        opacity={opacity}
        side={THREE.DoubleSide}
      />
      <lineSegments>
        <edgesGeometry
          args={[
            new THREE.BoxGeometry(wallProps.length, heightM, thicknessM),
          ]}
        />
        <lineBasicMaterial color="#7f8c8d" linewidth={2} transparent={transparent} opacity={opacity} />
      </lineSegments>
    </mesh>
  );
}

function Scene({
  furniture,
  walls,
  room,
  selectedId,
  transformMode,
  snapEnabled,
  onSelectFurniture,
  onTransformFurniture,
  canvasCenterPx
}: ViewportProps) {
  // Collision detection
 const checkCollision = (id: string, testPosition?: THREE.Vector3): boolean => {
  const current = furniture.find((f) => f.id === id);
  if (!current) return false;

  const pos = testPosition || new THREE.Vector3(...current.position);

  const currentBox = new THREE.Box3().setFromCenterAndSize(
    pos,
    new THREE.Vector3(
      (current.dimensions.width / 1000) * current.scale[0],
      (current.dimensions.height / 1000) * current.scale[1],
      (current.dimensions.depth / 1000) * current.scale[2]
    )
  );

  for (const other of furniture) {
    if (other.id === id) continue;

    const otherBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(...other.position),
      new THREE.Vector3(
        (other.dimensions.width / 1000) * other.scale[0],
        (other.dimensions.height / 1000) * other.scale[1],
        (other.dimensions.depth / 1000) * other.scale[2]
      )
    );

    // .intersectsBox zwraca true TYLKO gdy szafki nachodzą na siebie. 
    // Jeśli tylko się dotykają krawędziami, zwróci false.
    if (currentBox.intersectsBox(otherBox)) {
      // Dodatkowe sprawdzenie: jeśli boxy się tylko dotykają, intersectsBox może zwrócić true 
      // w zależności od precyzji zmiennoprzecinkowej. 
      // Sprawdzamy czy faktycznie na siebie nachodzą (overlap > 0)
      const intersection = new THREE.Box3();
      intersection.copy(currentBox).intersect(otherBox);
      
      // Jeśli objętość części wspólnej jest mniejsza niż błąd precyzji, ignorujemy to jako "styk"
      if (!intersection.isEmpty()) {
        const size = new THREE.Vector3();
        intersection.getSize(size);
        if (size.x > 0.0001 && size.y > 0.0001 && size.z > 0.0001) {
          return true;
        }
      }
    }
  }
  return false;
};

  // State to track closest walls
  const [closestWallIds, setClosestWallIds] = useState<string[]>([]);

  // Calculate Camera Distance for walls to handle transparency
  useFrame(({ camera }) => {
     if (walls.length < 3) return; // Only apply if we have a room shape
     
     const distances = walls.map(wall => {
        const props = calculate3DWallProperties(wall.startNode, wall.endNode, wall.height, wall.thickness, canvasCenterPx);
        const wallPos = new THREE.Vector3(...props.position);
        return {
           id: wall.id,
           distance: camera.position.distanceTo(wallPos)
        };
     });
     
     // Sort by distance ascending
     distances.sort((a, b) => a.distance - b.distance);
     
     // Take the 2 closest
     const closest = distances.slice(0, 2).map(d => d.id);
     
     // Update state only if changed to prevent re-renders
     if (closest[0] !== closestWallIds[0] || closest[1] !== closestWallIds[1]) {
        setClosestWallIds(closest);
     }
  });

  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />

      {/* Environment */}
      <Environment preset="warehouse" />

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={50} />

      {/* Orbit Controls */}
      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
      />

      {/* Floor Grid */}
      <Grid
        args={[room.width * 2, room.depth * 2]}
        cellSize={0.1}
        cellThickness={0.6}
        cellColor="#6e6e6e"
        sectionSize={1}
        sectionThickness={1.5}
        sectionColor="#3498db"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Floor plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[room.width * 2, room.depth * 2]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>

      {/* Walls */}
      {walls.map((wall) => (
        <WallMesh key={wall.id} wall={wall} isClosest={closestWallIds.includes(wall.id)} canvasCenterPx={canvasCenterPx} />
      ))}

      {/* Furniture */}
      {furniture.map((item) => (
        <FurnitureContent
          key={item.id}
          furniture={item}
          isSelected={item.id === selectedId}
          hasCollision={checkCollision(item.id)}
          onSelect={() => onSelectFurniture(item.id)}
          onTransform={(position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) =>
            onTransformFurniture(item.id, position, rotation, scale)
          }
          
          transformMode={transformMode}
          snapEnabled={snapEnabled}
          allFurniture={furniture}
          walls={walls}
          room={room} 
          canvasCenterPx={canvasCenterPx}
        />
      ))}

      {/* Background click to deselect */}
      <mesh
        position={[0, -0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => onSelectFurniture(null)}
      >
        <planeGeometry args={[room.width * 3, room.depth * 3]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      
      {/* Pre-compile all mounted shapes so no runtime shutter */}
      <Preload all />
    </>
  );
}

// Preload standard catalog textures before anything renders
const preloadCatalogTextures = () => {
  const uniqueUrls = new Set<string>();

  // Extract URLs safely handling optionals and type mapping
  Object.values(FURNITURE_CATALOG).forEach((categoryItems: any[]) => {
    categoryItems.forEach((item: any) => {
      const textures = item.material?.textures;
      if (textures) {
        if (textures.baseColor) uniqueUrls.add(textures.baseColor);
        if (textures.frontColor) uniqueUrls.add(textures.frontColor);
        if (textures.normal) uniqueUrls.add(textures.normal);
        if (textures.roughness) uniqueUrls.add(textures.roughness);
        if (textures.ambientOcclusion) uniqueUrls.add(textures.ambientOcclusion);
      }
    });
  });

  // Unique list ensures we don't spam threejs with preload attempts
  uniqueUrls.forEach((url) => {
    if (url) {
      useTexture.preload(url);
    }
  });
};

// Run preload once when module starts
preloadCatalogTextures();

export function Viewport3D(props: ViewportProps) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <LoadingScreen />
      
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>

      {/* Transform mode indicator */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
          Transform Mode
        </div>
        <div className="flex gap-2">
          <div
            className={`px-3 py-1 rounded text-sm font-medium ${
              props.transformMode === "translate"
                ? "bg-red-600 text-white"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            <span className="font-bold">G</span> Move
          </div>
          <div
            className={`px-3 py-1 rounded text-sm font-medium ${
              props.transformMode === "rotate"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            <span className="font-bold">R</span> Rotate
          </div>
          <div
            className={`px-3 py-1 rounded text-sm font-medium ${
              props.transformMode === "scale"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            <span className="font-bold">S</span> Scale
          </div>
        </div>
      </div>

      {/* Snap indicator */}
      {props.snapEnabled && (
        <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-purple-400/50 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-white uppercase tracking-wide">
            Snap Active
          </span>
        </div>
      )}
    </div>
  );
}
