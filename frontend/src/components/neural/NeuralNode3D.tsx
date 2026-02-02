import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh } from 'three';

interface NeuralNode3DProps {
  id: string;
  position: [number, number, number];
  name: string;
  type: 'alpha' | 'beta' | 'gamma' | 'delta';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  connections: number;
  onClick?: (id: string) => void;
}

const statusColors = {
  healthy: '#3fb950',
  warning: '#d29922',
  critical: '#f85149',
  offline: '#8b949e',
};

const typeColors = {
  alpha: '#58a6ff',
  beta: '#a371f7',
  gamma: '#39c5cf',
  delta: '#ff7b42',
};

const typeSizes = {
  alpha: 0.5,
  beta: 0.4,
  gamma: 0.3,
  delta: 0.25,
};

export function NeuralNode3D({ id, position, name, type, status, connections, onClick }: NeuralNode3DProps) {
  const meshRef = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
      
      // Gentle rotation
      meshRef.current.rotation.y += 0.005;
      
      // Scale on hover
      const targetScale = hovered ? 1.3 : active ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const handleClick = () => {
    setActive(!active);
    onClick?.(id);
  };

  const baseColor = typeColors[type];
  const glowColor = statusColors[status];
  const size = typeSizes[type];

  return (
    <group position={position}>
      {/* Outer glow */}
      <Sphere args={[size * 1.5, 16, 16]}>
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={hovered ? 0.4 : 0.2}
          depthWrite={false}
        />
      </Sphere>

      {/* Main node */}
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshPhongMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          shininess={100}
        />
      </Sphere>

      {/* Pulsing ring effect */}
      {status !== 'offline' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.2, size * 1.4, 32]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Label on hover */}
      {hovered && (
        <Html distanceFactor={10} position={[0, size + 0.5, 0]}>
          <div className="bg-neural-panel border border-neural-border rounded px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <div className="font-semibold text-neural-text">{name}</div>
            <div className="text-neutral-text-secondary">
              {type.toUpperCase()} • {connections} connections
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
