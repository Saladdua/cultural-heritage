"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import * as THREE from "three"

interface ThreeJsViewerProps {
  modelUrl: string
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
}

function Model({
  url,
  explodeAmount,
  colorsByFace,
  onFaceSelect,
  selectedFace,
}: {
  url: string
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
}) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)
  const { raycaster, camera, gl } = useThree()
  const [originalGeometries, setOriginalGeometries] = useState<THREE.BufferGeometry[]>([])
  const [explodedMeshes, setExplodedMeshes] = useState<THREE.Mesh[]>([])
  const [hoveredFace, setHoveredFace] = useState<number | null>(null)

  // Clone the model and prepare it for explosion
  useEffect(() => {
    if (!modelRef.current) return

    // Clear previous meshes
    if (explodedMeshes.length > 0) {
      explodedMeshes.forEach((mesh) => {
        modelRef.current?.remove(mesh)
      })
    }

    const newExplodedMeshes: THREE.Mesh[] = []
    const newOriginalGeometries: THREE.BufferGeometry[] = []

    // Process all meshes in the model
    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        // Store original geometry
        const originalGeometry = child.geometry.clone()
        newOriginalGeometries.push(originalGeometry)

        // Create individual face meshes for explosion
        const geometry = new THREE.BufferGeometry()
        const position = child.geometry.getAttribute("position")
        const normal = child.geometry.getAttribute("normal")
        const uv = child.geometry.getAttribute("uv")

        const indices = child.geometry.index ? Array.from(child.geometry.index.array) : []

        // If we have indices, use them to create triangles
        if (indices.length > 0) {
          for (let i = 0; i < indices.length; i += 3) {
            const faceIndex = i / 3

            // Create a new geometry for this face
            const faceGeometry = new THREE.BufferGeometry()

            // Extract the vertices for this face
            const vertices = new Float32Array(9) // 3 vertices * 3 components (x,y,z)
            const normals = new Float32Array(9)
            const uvs = new Float32Array(6) // 3 vertices * 2 components (u,v)

            for (let j = 0; j < 3; j++) {
              const vertexIndex = indices[i + j]

              vertices[j * 3] = position.getX(vertexIndex)
              vertices[j * 3 + 1] = position.getY(vertexIndex)
              vertices[j * 3 + 2] = position.getZ(vertexIndex)

              if (normal) {
                normals[j * 3] = normal.getX(vertexIndex)
                normals[j * 3 + 1] = normal.getY(vertexIndex)
                normals[j * 3 + 2] = normal.getZ(vertexIndex)
              }

              if (uv) {
                uvs[j * 2] = uv.getX(vertexIndex)
                uvs[j * 2 + 1] = uv.getY(vertexIndex)
              }
            }

            faceGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
            faceGeometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))
            if (uv) {
              faceGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
            }

            // Calculate face center for explosion
            const center = new THREE.Vector3()
            for (let j = 0; j < 3; j++) {
              center.x += vertices[j * 3] / 3
              center.y += vertices[j * 3 + 1] / 3
              center.z += vertices[j * 3 + 2] / 3
            }

            // Create material for this face
            const material = new THREE.MeshStandardMaterial({
              color: colorsByFace[faceIndex] || child.material.color,
              side: THREE.DoubleSide,
              emissive:
                faceIndex === selectedFace
                  ? new THREE.Color(0x333333)
                  : faceIndex === hoveredFace
                    ? new THREE.Color(0x222222)
                    : new THREE.Color(0x000000),
            })

            // Create mesh for this face
            const faceMesh = new THREE.Mesh(faceGeometry, material)
            faceMesh.userData = {
              faceIndex,
              center,
              originalPosition: center.clone(),
            }

            newExplodedMeshes.push(faceMesh)
            modelRef.current?.add(faceMesh)
          }
        }

        // Hide the original mesh
        child.visible = false
      }
    })

    setExplodedMeshes(newExplodedMeshes)
    setOriginalGeometries(newOriginalGeometries)
  }, [colorsByFace, selectedFace])

  // Handle mouse interactions
  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!modelRef.current) return

      // Calculate mouse position in normalized device coordinates
      const mouse = new THREE.Vector2()
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1

      // Update the raycaster
      raycaster.setFromCamera(mouse, camera)

      // Check for intersections with our exploded meshes
      const intersects = raycaster.intersectObjects(explodedMeshes)

      if (intersects.length > 0) {
        const faceIndex = intersects[0].object.userData.faceIndex
        setHoveredFace(faceIndex)
        gl.domElement.style.cursor = "pointer"
      } else {
        setHoveredFace(null)
        gl.domElement.style.cursor = "auto"
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!modelRef.current || hoveredFace === null) return

      onFaceSelect(hoveredFace)
    }

    gl.domElement.addEventListener("pointermove", handlePointerMove)
    gl.domElement.addEventListener("pointerdown", handlePointerDown)

    return () => {
      gl.domElement.removeEventListener("pointermove", handlePointerMove)
      gl.domElement.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [camera, explodedMeshes, gl, hoveredFace, onFaceSelect, raycaster])

  // Apply explosion effect
  useFrame(() => {
    if (!modelRef.current) return

    explodedMeshes.forEach((mesh) => {
      if (mesh.userData.center && mesh.userData.originalPosition) {
        const direction = mesh.userData.center
          .clone()
          .sub(new THREE.Vector3(0, 0, 0))
          .normalize()
        const targetPosition = mesh.userData.originalPosition.clone().add(direction.multiplyScalar(explodeAmount))

        mesh.position.lerp(targetPosition, 0.1)

        // Update material based on selection/hover state
        const material = mesh.material as THREE.MeshStandardMaterial
        const faceIndex = mesh.userData.faceIndex

        material.emissive =
          faceIndex === selectedFace
            ? new THREE.Color(0x333333)
            : faceIndex === hoveredFace
              ? new THREE.Color(0x222222)
              : new THREE.Color(0x000000)

        material.color = new THREE.Color(colorsByFace[faceIndex] || 0x6e56cf)
      }
    })
  })

  return (
    <group ref={modelRef} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

export default function ThreeJsViewer({
  modelUrl,
  explodeAmount,
  colorsByFace,
  onFaceSelect,
  selectedFace,
}: ThreeJsViewerProps) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <Model
        url={modelUrl}
        explodeAmount={explodeAmount}
        colorsByFace={colorsByFace}
        onFaceSelect={onFaceSelect}
        selectedFace={selectedFace}
      />
      <OrbitControls makeDefault />
      <Environment preset="studio" />
    </Canvas>
  )
}
