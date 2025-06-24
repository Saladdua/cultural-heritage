"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import * as THREE from "three"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader"

interface ThreeJsViewerProps {
  modelUrl: string
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
  showTriangles?: boolean
}

function Model({
  url,
  explodeAmount,
  colorsByFace,
  onFaceSelect,
  selectedFace,
  showTriangles = false, // New prop for triangle/face toggle
}: {
  url: string
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
  showTriangles?: boolean
}) {
  const [model, setModel] = useState(null)
  const [originalFaces, setOriginalFaces] = useState([])
  const [triangulatedFaces, setTriangulatedFaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const modelRef = useRef()
  const { scene } = useThree()

  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true)
        console.log("Loading model from URL:", url)

        const fileExtension = url.split(".").pop().toLowerCase()
        let loadedModel
        let preservedFaces = []

        if (fileExtension === "obj") {
          const loader = new OBJLoader()
          loadedModel = await new Promise((resolve, reject) => {
            loader.load(url, resolve, undefined, reject)
          })

          // Extract original faces from OBJ (quads and polygons)
          loadedModel.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              preservedFaces = extractOriginalFaces(child.geometry)
            }
          })
        } else if (fileExtension === "ply" || fileExtension === "stl") {
          // PLY and STL are typically already triangulated
          const loader = fileExtension === "ply" ? new PLYLoader() : new STLLoader()
          const geometry = await new Promise((resolve, reject) => {
            loader.load(url, (geo) => resolve(geo), undefined, reject)
          })

          const material = new THREE.MeshStandardMaterial({
            color: 0x6e56cf,
            side: THREE.DoubleSide,
          })
          loadedModel = new THREE.Mesh(geometry, material)

          // For triangulated formats, create face groups
          preservedFaces = groupTrianglesIntoFaces(geometry)
        }

        // Create both face-based and triangle-based representations
        const faceBasedMeshes = createFaceBasedMeshes(preservedFaces)
        const triangleBasedMeshes = createTriangleBasedMeshes(loadedModel)

        setOriginalFaces(faceBasedMeshes)
        setTriangulatedFaces(triangleBasedMeshes)

        // Add appropriate meshes to scene based on current mode
        const meshesToAdd = showTriangles ? triangleBasedMeshes : faceBasedMeshes
        meshesToAdd.forEach((mesh) => scene.add(mesh))

        setModel(loadedModel)
        setLoading(false)
      } catch (err) {
        console.error("Error loading model:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadModel()

    return () => {
      // Cleanup
      originalFaces.forEach((mesh) => scene.remove(mesh))
      triangulatedFaces.forEach((mesh) => scene.remove(mesh))
    }
  }, [url, scene])

  // Toggle between face and triangle view
  useEffect(() => {
    // Remove current meshes
    originalFaces.forEach((mesh) => scene.remove(mesh))
    triangulatedFaces.forEach((mesh) => scene.remove(mesh))

    // Add appropriate meshes
    const meshesToAdd = showTriangles ? triangulatedFaces : originalFaces
    meshesToAdd.forEach((mesh) => scene.add(mesh))
  }, [showTriangles, originalFaces, triangulatedFaces, scene])

  return null
}

// Helper function to extract original faces from OBJ geometry
function extractOriginalFaces(geometry) {
  const faces = []
  const position = geometry.getAttribute("position")
  const normal = geometry.getAttribute("normal")
  const uv = geometry.getAttribute("uv")

  // For OBJ files, we need to reconstruct the original faces
  // This is a simplified approach - in practice, you'd need to parse the original OBJ data
  const indices = geometry.index ? Array.from(geometry.index.array) : []

  for (let i = 0; i < indices.length; i += 3) {
    // Group triangles that share edges to form quads/polygons
    const face = {
      vertices: [indices[i], indices[i + 1], indices[i + 2]],
      type: "triangle",
    }
    faces.push(face)
  }

  return faces
}

// Helper function to group triangles into logical faces
function groupTrianglesIntoFaces(geometry) {
  const faces = []
  const position = geometry.getAttribute("position")
  const indices = geometry.index ? Array.from(geometry.index.array) : []

  // Simple grouping - in practice, you'd use more sophisticated algorithms
  for (let i = 0; i < indices.length; i += 3) {
    const face = {
      vertices: [indices[i], indices[i + 1], indices[i + 2]],
      center: calculateTriangleCenter(position, indices[i], indices[i + 1], indices[i + 2]),
      normal: calculateTriangleNormal(position, indices[i], indices[i + 1], indices[i + 2]),
      type: "triangle",
    }
    faces.push(face)
  }

  return faces
}

// Helper function to create face-based meshes
function createFaceBasedMeshes(faces) {
  const meshes = []

  faces.forEach((face, index) => {
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array(face.vertices.length * 3)

    // Create geometry for this face
    face.vertices.forEach((vertexIndex, i) => {
      vertices[i * 3] = 0 /* vertex x */
      vertices[i * 3 + 1] = 0 /* vertex y */
      vertices[i * 3 + 2] = 0 /* vertex z */
    })

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))

    const material = new THREE.MeshStandardMaterial({
      color: 0x6e56cf,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = {
      faceIndex: index,
      faceType: face.type,
      center: face.center,
    }

    meshes.push(mesh)
  })

  return meshes
}

// Helper function to create triangle-based meshes
function createTriangleBasedMeshes(model) {
  const meshes = []

  if (model && model.geometry) {
    const geometry = model.geometry
    const position = geometry.getAttribute("position")
    const normal = geometry.getAttribute("normal")

    if (geometry.index) {
      const indices = geometry.index.array

      for (let i = 0; i < indices.length; i += 3) {
        const v1Index = indices[i]
        const v2Index = indices[i + 1]
        const v3Index = indices[i + 2]

        const v1 = new THREE.Vector3(position.getX(v1Index), position.getY(v1Index), position.getZ(v1Index))
        const v2 = new THREE.Vector3(position.getX(v2Index), position.getY(v2Index), position.getZ(v2Index))
        const v3 = new THREE.Vector3(position.getX(v3Index), position.getY(v3Index), position.getZ(v3Index))

        const triangleGeometry = new THREE.BufferGeometry()
        const vertices = new Float32Array([v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z])

        triangleGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
        triangleGeometry.computeVertexNormals()

        const material = new THREE.MeshStandardMaterial({
          color: 0x6e56cf,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        })

        const mesh = new THREE.Mesh(triangleGeometry, material)
        mesh.userData = {
          faceIndex: i / 3,
          faceType: "triangle",
          center: calculateTriangleCenter(position, v1Index, v2Index, v3Index),
        }

        meshes.push(mesh)
      }
    }
  }

  return meshes
}

function calculateTriangleCenter(position, i1, i2, i3) {
  const center = new THREE.Vector3()
  center.x = (position.getX(i1) + position.getX(i2) + position.getX(i3)) / 3
  center.y = (position.getY(i1) + position.getY(i2) + position.getY(i3)) / 3
  center.z = (position.getZ(i1) + position.getZ(i2) + position.getZ(i3)) / 3
  return center
}

function calculateTriangleNormal(position, i1, i2, i3) {
  const v1 = new THREE.Vector3(position.getX(i1), position.getY(i1), position.getZ(i1))
  const v2 = new THREE.Vector3(position.getX(i2), position.getY(i2), position.getZ(i2))
  const v3 = new THREE.Vector3(position.getX(i3), position.getY(i3), position.getZ(i3))

  const normal = new THREE.Vector3()
  const edge1 = v2.clone().sub(v1)
  const edge2 = v3.clone().sub(v1)
  normal.crossVectors(edge1, edge2).normalize()

  return normal
}

// Update the main component interface
export default function ThreeJsViewer({
  modelUrl,
  explodeAmount,
  colorsByFace,
  onFaceSelect,
  selectedFace,
  showTriangles = false, // New prop
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
        showTriangles={showTriangles}
      />

      <OrbitControls makeDefault />
      <Environment preset="studio" />
    </Canvas>
  )
}
