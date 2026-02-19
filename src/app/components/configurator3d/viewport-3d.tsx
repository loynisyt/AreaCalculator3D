import { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  TransformControls,
  PerspectiveCamera,
  Environment,
  Html,
} from "@react-three/drei";
import { Furniture3D, Room3D, Wall } from "./types";
import * as THREE from "three";
import { Room } from '../calculator/types';

interface ViewportProps {
  furniture: Furniture3D[];
  walls: Wall[];
  room: Room3D;
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

function FurnitureMesh({
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
  walls: Wall[];
  room: Room3D;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const transformRef = useRef<any>(null);

// Convert mm to meters for Three.js
  const width = (furniture.dimensions.width / 1000) * furniture.scale[0];
  const height = (furniture.dimensions.height / 1000) * furniture.scale[1];
  const depth = (furniture.dimensions.depth / 1000) * furniture.scale[2];

  // --- NOWY KOD: Funkcja blokująca na ścianach i podłodze ---
  const applyClamping = (position: THREE.Vector3): THREE.Vector3 => {
    const minX = -(room.width / 2) + (width / 2);
    const maxX = (room.width / 2) - (width / 2);
    
    const minY = height / 2; // Zablokowanie przenikania przez podłogę
    const maxY = room.height - (height / 2); // Zablokowanie wychodzenia przez sufit
    
    const minZ = -(room.depth / 2) + (depth / 2);
    const maxZ = (room.depth / 2) - (depth / 2);

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
  ): THREE.Vector3 => {
    if (!snapEnabled) return position;

    const snappedPos = position.clone();
    const currentFurniture = allFurniture.find((f) => f.id === furnitureId);
    if (!currentFurniture) return position;

    const halfWidth = width / 2;
    const halfDepth = depth / 2;

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
        }

        // Snap left side to right side of other
        if (
          Math.abs(position.z - otherPos.z) < SNAP_DISTANCE &&
          Math.abs(position.x - halfWidth - (otherPos.x + otherHalfWidth)) <
            SNAP_DISTANCE
        ) {
          snappedPos.x = otherPos.x + otherHalfWidth + halfWidth;
          snappedPos.z = otherPos.z;
        }

        // Snap back to front of other
        if (
          Math.abs(position.x - otherPos.x) < SNAP_DISTANCE &&
          Math.abs(position.z + halfDepth - (otherPos.z - otherHalfDepth)) <
            SNAP_DISTANCE
        ) {
          snappedPos.z = otherPos.z - otherHalfDepth - halfDepth;
          snappedPos.x = otherPos.x;
        }

        // Snap front to back of other
        if (
          Math.abs(position.x - otherPos.x) < SNAP_DISTANCE &&
          Math.abs(position.z - halfDepth - (otherPos.z + otherHalfDepth)) <
            SNAP_DISTANCE
        ) {
          snappedPos.z = otherPos.z + otherHalfDepth + halfDepth;
          snappedPos.x = otherPos.x;
        }
      }
    }

    // Snap to walls
    for (const wall of walls) {
      const wallPos = new THREE.Vector3(...wall.position);
      const wallHalfLength = wall.length / 2;

      // Back wall (assuming walls are at room boundaries)
      if (
        Math.abs(snappedPos.z + halfDepth - wallPos.z) < WALL_SNAP_DISTANCE &&
        currentFurniture.snapPoints.back
      ) {
        snappedPos.z = wallPos.z - halfDepth - 0.01; // Small offset
      }
    }

    return snappedPos;
  };

  // Attach transform controls when selected
  useEffect(() => {
    if (transformRef.current && meshRef.current && isSelected) {
      transformRef.current.attach(meshRef.current);
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
        <meshStandardMaterial
          color={hasCollision ? "#ff4444" : furniture.material.color}
          metalness={0.2}
          roughness={0.8}
          emissive={isSelected ? "#3498db" : hasCollision ? "#ff0000" : "#000000"}
          emissiveIntensity={isSelected ? 0.2 : hasCollision ? 0.3 : 0}
        />

        {/* Edge highlighting */}
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(width, height, depth)]}
          />
          <lineBasicMaterial
            color={
              isSelected ? "#00ffff" : hasCollision ? "#ff0000" : "#ffffff"
            }
            linewidth={isSelected ? 3 : 1}
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
              if (transformMode === "translate") {
                newPosition = applySnapping(newPosition, furniture.id);
                newPosition = applyClamping(newPosition);
                meshRef.current.position.copy(newPosition);
              }

              onTransform(
                [newPosition.x, newPosition.y, newPosition.z],
                [
                  meshRef.current.rotation.x,
                  meshRef.current.rotation.y,
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

function WallMesh({ wall }: { wall: Wall }) {
  return (
    <mesh
      position={wall.position}
      rotation={[0, wall.rotation, 0]}
      receiveShadow
    >
      <boxGeometry args={[wall.length, wall.height, wall.thickness]} />
      <meshStandardMaterial
        color="#34495e"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
      <lineSegments>
        <edgesGeometry
          args={[
            new THREE.BoxGeometry(wall.length, wall.height, wall.thickness),
          ]}
        />
        <lineBasicMaterial color="#7f8c8d" linewidth={2} />
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
        <WallMesh key={wall.id} wall={wall} />
      ))}

      {/* Furniture */}
      {furniture.map((item) => (
        <FurnitureMesh
          key={item.id}
          furniture={item}
          isSelected={item.id === selectedId}
          hasCollision={checkCollision(item.id)}
          onSelect={() => onSelectFurniture(item.id)}
          onTransform={(position, rotation, scale) =>
            onTransformFurniture(item.id, position, rotation, scale)
          }
          
          transformMode={transformMode}
          snapEnabled={snapEnabled}
          allFurniture={furniture}
          walls={walls}
          room={room} // <--- DODANE
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
    </>
  );
}

export function Viewport3D(props: ViewportProps) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Scene {...props} />
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
