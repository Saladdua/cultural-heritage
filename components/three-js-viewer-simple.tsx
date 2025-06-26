"use client"

import { useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import * as THREE from "three"

interface ThreeJsViewerProps {
  modelUrl: string
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
  showTriangles?: boolean
}

function CulturalArtifactModel({
  explodeAmount,
  colorsByFace,
  onFaceSelect,
  selectedFace,
  showTriangles = false,
}: {
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
  showTriangles?: boolean
}) {
  const [hoveredFace, setHoveredFace] = useState<number | null>(null)

  // Create a sample cultural artifact (like a column or pedestal)
  const faces = [
    { position: [0, 1, 0], rotation: [0, 0, 0], color: colorsByFace[0] || "#6E56CF", id: 0 }, // Top
    { position: [0, -1, 0], rotation: [Math.PI, 0, 0], color: colorsByFace[1] || "#6E56CF", id: 1 }, // Bottom
    { position: [1, 0, 0], rotation: [0, 0, Math.PI / 2], color: colorsByFace[2] || "#6E56CF", id: 2 }, // Right
    { position: [-1, 0, 0], rotation: [0, 0, -Math.PI / 2], color: colorsByFace[3] || "#6E56CF", id: 3 }, // Left
    { position: [0, 0, 1], rotation: [Math.PI / 2, 0, 0], color: colorsByFace[4] || "#6E56CF", id: 4 }, // Front
    { position: [0, 0, -1], rotation: [-Math.PI / 2, 0, 0], color: colorsByFace[5] || "#6E56CF", id: 5 }, // Back
  ]

  return (
    <group>
      {faces.map((face) => {
        const isSelected = selectedFace === face.id
        const isHovered = hoveredFace === face.id
        const explodeOffset = explodeAmount * 0.5

        return (
          <mesh
            key={face.id}
            position={[
              face.position[0] + face.position[0] * explodeOffset,
              face.position[1] + face.position[1] * explodeOffset,
              face.position[2] + face.position[2] * explodeOffset,
            ]}
            rotation={face.rotation as [number, number, number]}
            onClick={() => onFaceSelect(face.id)}
            onPointerEnter={() => setHoveredFace(face.id)}
            onPointerLeave={() => setHoveredFace(null)}
          >
            <planeGeometry args={[1.8, 1.8]} />
            <meshStandardMaterial
              color={face.color}
              emissive={isSelected ? "#333333" : isHovered ? "#222222" : "#000000"}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}

      {/* Add a decorative element to make it look more like a cultural artifact */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 2, 8]} />
        <meshStandardMaterial color="#8B7355" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

export default function ThreeJsViewer({
  modelUrl,
  explodeAmount,
  colorsByFace,
  onFaceSelect,
  selectedFace,
  showTriangles = false,
}: ThreeJsViewerProps) {
  return (
    <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

      <CulturalArtifactModel
        explodeAmount={explodeAmount}
        colorsByFace={colorsByFace}
        onFaceSelect={onFaceSelect}
        selectedFace={selectedFace}
        showTriangles={showTriangles}
      />

      <OrbitControls makeDefault />
      <Environment preset="studio" />
    </Canvas>
  )
}
