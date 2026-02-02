import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Line2 } from 'three-stdlib';

interface Connection3DProps {
  start: [number, number, number];
  end: [number, number, number];
  strength: number; // 0-1, affects opacity and thickness
  active?: boolean;
}

export function Connection3D({ start, end, strength, active = false }: Connection3DProps) {
  const lineRef = useRef<Line2>(null!);

  useFrame((state) => {
    if (lineRef.current && lineRef.current.material) {
      // Animate opacity with pulse effect
      const baseMaterial = lineRef.current.material as THREE.Material & { opacity: number };
      const pulseSpeed = 2;
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.2 + 0.8;
      baseMaterial.opacity = (strength * 0.3 + (active ? 0.3 : 0)) * pulse;
    }
  });

  // Calculate color based on strength
  const color = new THREE.Color().setHSL(0.6, 1, 0.3 + strength * 0.3);

  // Create curved line points
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 1,
      (start[2] + end[2]) / 2
    ),
    new THREE.Vector3(...end)
  );

  const points = curve.getPoints(20);

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={active ? 3 : 1.5}
      transparent
      opacity={strength * 0.3}
    />
  );
}
