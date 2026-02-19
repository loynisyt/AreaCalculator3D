// Debug component to test imports
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export function DebugThree() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas>
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
