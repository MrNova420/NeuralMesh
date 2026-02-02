import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { NeuralNode3D } from './NeuralNode3D';
import { Connection3D } from './Connection3D';
import * as THREE from 'three';

interface NodeData {
  id: string;
  name: string;
  type: 'alpha' | 'beta' | 'gamma' | 'delta';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  position: [number, number, number];
  connections: string[];
}

interface NeuralGraph3DProps {
  nodes: NodeData[];
  onNodeClick?: (nodeId: string) => void;
}

// Generate force-directed layout positions
function generateLayout(nodes: NodeData[]): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  const radius = 8;
  
  // Arrange nodes in a 3D sphere
  nodes.forEach((node, i) => {
    const phi = Math.acos(-1 + (2 * i) / nodes.length);
    const theta = Math.sqrt(nodes.length * Math.PI) * phi;
    
    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);
    
    positions.set(node.id, [x, y, z]);
  });
  
  return positions;
}

function Scene({ nodes, onNodeClick }: NeuralGraph3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Generate node positions
  const positions = useMemo(() => generateLayout(nodes), [nodes]);

  // Slow rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
    onNodeClick?.(nodeId);
  };

  // Generate connections
  const connections = useMemo(() => {
    const conns: Array<{
      start: [number, number, number];
      end: [number, number, number];
      strength: number;
      active: boolean;
    }> = [];

    nodes.forEach((node) => {
      const startPos = positions.get(node.id);
      if (!startPos) return;

      node.connections.forEach((targetId) => {
        const endPos = positions.get(targetId);
        if (!endPos) return;

        // Calculate connection strength based on distance
        const distance = Math.sqrt(
          Math.pow(endPos[0] - startPos[0], 2) +
          Math.pow(endPos[1] - startPos[1], 2) +
          Math.pow(endPos[2] - startPos[2], 2)
        );
        const strength = Math.max(0.3, 1 - distance / 20);

        conns.push({
          start: startPos,
          end: endPos,
          strength,
          active: selectedNode === node.id || selectedNode === targetId,
        });
      });
    });

    return conns;
  }, [nodes, positions, selectedNode]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#58a6ff" />

      {/* Stars background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Neural network group */}
      <group ref={groupRef}>
        {/* Render connections first (behind nodes) */}
        {connections.map((conn, i) => (
          <Connection3D
            key={`conn-${i}`}
            start={conn.start}
            end={conn.end}
            strength={conn.strength}
            active={conn.active}
          />
        ))}

        {/* Render nodes */}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          return (
            <NeuralNode3D
              key={node.id}
              id={node.id}
              position={pos}
              name={node.name}
              type={node.type}
              status={node.status}
              connections={node.connections.length}
              onClick={handleNodeClick}
            />
          );
        })}
      </group>

      {/* Camera and controls */}
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={60} />
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        minDistance={10}
        maxDistance={50}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export function NeuralGraph3D({ nodes, onNodeClick }: NeuralGraph3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas>
        <Scene nodes={nodes} onNodeClick={onNodeClick} />
      </Canvas>
    </div>
  );
}
