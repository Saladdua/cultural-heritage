"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import * as THREE from "three"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

interface ThreeJsViewerProps {
  modelUrl: string
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
  showTriangles?: boolean
  onResetCamera?: () => void
}

function ActualModel({
  url,
  explodeAmount,
  colorsByFace,
  onFaceSelect,
  selectedFace,
  showTriangles = false,
}: {
  url: string
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
  showTriangles?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const { raycaster, camera, gl } = useThree()
  const [hoveredFace, setHoveredFace] = useState<number | null>(null)
  const [loadedModel, setLoadedModel] = useState<THREE.Object3D | null>(null)
  const [faces, setFaces] = useState<THREE.Mesh[]>([])
  const [loading, setLoading] = useState(true)

  // Load the actual 3D model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true)

        const extension = url.split(".").pop()?.toLowerCase()
        let loader: any
        let loadedObject: THREE.Object3D

        switch (extension) {
          case "obj":
            loader = new OBJLoader()
            loadedObject = await new Promise<THREE.Group>((resolve, reject) => {
              loader.load(
                url,
                (object: THREE.Group) => resolve(object),
                undefined,
                (error: any) => reject(error),
              )
            })
            break

          case "ply":
            loader = new PLYLoader()
            const plyGeometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
              loader.load(
                url,
                (geometry: THREE.BufferGeometry) => resolve(geometry),
                undefined,
                (error: any) => reject(error),
              )
            })
            loadedObject = new THREE.Mesh(plyGeometry, new THREE.MeshStandardMaterial({ color: 0x888888 }))
            break

          case "stl":
            loader = new STLLoader()
            const stlGeometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
              loader.load(
                url,
                (geometry: THREE.BufferGeometry) => resolve(geometry),
                undefined,
                (error: any) => reject(error),
              )
            })
            loadedObject = new THREE.Mesh(stlGeometry, new THREE.MeshStandardMaterial({ color: 0x888888 }))
            break

          case "glb":
          case "gltf":
            loader = new GLTFLoader()
            const gltf = await new Promise<any>((resolve, reject) => {
              loader.load(
                url,
                (gltf: any) => resolve(gltf),
                undefined,
                (error: any) => reject(error),
              )
            })
            loadedObject = gltf.scene
            break

          default:
            throw new Error(`Unsupported file format: ${extension}`)
        }

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(loadedObject)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim

        loadedObject.position.sub(center)
        loadedObject.scale.setScalar(scale)

        setLoadedModel(loadedObject)

        // Extract faces from the loaded model
        extractFacesFromModel(loadedObject)

        setLoading(false)
      } catch (err) {
        console.error("Error loading model:", err)
        setLoading(false)
        // Create a fallback model
        createFallbackModel()
      }
    }

    loadModel()
  }, [url])

  const createFallbackModel = () => {
    // Create a simple cultural artifact as fallback
    const group = new THREE.Group()

    // Base
    const baseGeometry = new THREE.BoxGeometry(2, 0.3, 2)
    const baseMesh = new THREE.Mesh(baseGeometry, new THREE.MeshStandardMaterial({ color: 0x8b4513 }))
    baseMesh.position.set(0, -1.5, 0)
    group.add(baseMesh)

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1, 2, 16)
    const bodyMesh = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: 0xd2691e }))
    bodyMesh.position.set(0, -0.3, 0)
    group.add(bodyMesh)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16)
    const headMesh = new THREE.Mesh(headGeometry, new THREE.MeshStandardMaterial({ color: 0xcd853f }))
    headMesh.position.set(0, 1.2, 0)
    group.add(headMesh)

    setLoadedModel(group)
    extractFacesFromModel(group)
  }

  const extractFacesFromModel = (model: THREE.Object3D) => {
    const extractedFaces: THREE.Mesh[] = []
    let faceIndex = 0

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry
        const material = child.material as THREE.Material

        if (geometry.index) {
          // Indexed geometry
          const indices = geometry.index.array
          const positions = geometry.attributes.position

          for (let i = 0; i < indices.length; i += 3) {
            // Create individual triangle/face
            const faceGeometry = new THREE.BufferGeometry()
            const faceVertices: number[] = []

            for (let j = 0; j < 3; j++) {
              const vertexIndex = indices[i + j]
              faceVertices.push(positions.getX(vertexIndex), positions.getY(vertexIndex), positions.getZ(vertexIndex))
            }

            faceGeometry.setAttribute("position", new THREE.Float32BufferAttribute(faceVertices, 3))
            faceGeometry.computeVertexNormals()

            const faceMaterial = new THREE.MeshStandardMaterial({
              color: getFaceColor(faceIndex),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.9,
            })

            const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial)
            faceMesh.position.copy(child.position)
            faceMesh.rotation.copy(child.rotation)
            faceMesh.scale.copy(child.scale)

            // Calculate face center for explosion
            const center = new THREE.Vector3()
            for (let k = 0; k < faceVertices.length; k += 3) {
              center.add(new THREE.Vector3(faceVertices[k], faceVertices[k + 1], faceVertices[k + 2]))
            }
            center.divideScalar(3)

            faceMesh.userData = {
              faceIndex,
              originalPosition: child.position.clone(),
              faceCenter: center,
              parentTransform: {
                position: child.position.clone(),
                rotation: child.rotation.clone(),
                scale: child.scale.clone(),
              },
            }

            extractedFaces.push(faceMesh)
            faceIndex++
          }
        } else {
          // Non-indexed geometry
          const positions = geometry.attributes.position
          const vertexCount = positions.count

          for (let i = 0; i < vertexCount; i += 3) {
            const faceGeometry = new THREE.BufferGeometry()
            const faceVertices: number[] = []

            for (let j = 0; j < 3; j++) {
              faceVertices.push(positions.getX(i + j), positions.getY(i + j), positions.getZ(i + j))
            }

            faceGeometry.setAttribute("position", new THREE.Float32BufferAttribute(faceVertices, 3))
            faceGeometry.computeVertexNormals()

            const faceMaterial = new THREE.MeshStandardMaterial({
              color: getFaceColor(faceIndex),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.9,
            })

            const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial)
            faceMesh.position.copy(child.position)
            faceMesh.rotation.copy(child.rotation)
            faceMesh.scale.copy(child.scale)

            // Calculate face center
            const center = new THREE.Vector3()
            for (let k = 0; k < faceVertices.length; k += 3) {
              center.add(new THREE.Vector3(faceVertices[k], faceVertices[k + 1], faceVertices[k + 2]))
            }
            center.divideScalar(3)

            faceMesh.userData = {
              faceIndex,
              originalPosition: child.position.clone(),
              faceCenter: center,
              parentTransform: {
                position: child.position.clone(),
                rotation: child.rotation.clone(),
                scale: child.scale.clone(),
              },
            }

            extractedFaces.push(faceMesh)
            faceIndex++
          }
        }
      }
    })

    setFaces(extractedFaces)
  }

  const getFaceColor = (index: number) => {
    if (colorsByFace[index]) return colorsByFace[index]
    if (index === selectedFace) return "#ff6b6b"
    if (index === hoveredFace) return "#4ecdc4"
    return "#6e56cf"
  }

  // Handle mouse interactions
  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (!groupRef.current || showTriangles) return

      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(faces, true)

      if (intersects.length > 0) {
        const faceIndex = intersects[0].object.userData?.faceIndex
        if (typeof faceIndex === "number") {
          setHoveredFace(faceIndex)
          gl.domElement.style.cursor = "pointer"
        }
      } else {
        setHoveredFace(null)
        gl.domElement.style.cursor = "auto"
      }
    }

    const handlePointerDown = () => {
      if (hoveredFace !== null && !showTriangles) {
        onFaceSelect(hoveredFace)
      }
    }

    gl.domElement.addEventListener("pointermove", handlePointerMove)
    gl.domElement.addEventListener("pointerdown", handlePointerDown)

    return () => {
      gl.domElement.removeEventListener("pointermove", handlePointerMove)
      gl.domElement.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [camera, gl, hoveredFace, onFaceSelect, raycaster, faces, showTriangles])

  // Animate explosion and update colors
  useFrame(() => {
    faces.forEach((face) => {
      if (face.userData.faceCenter && face.userData.parentTransform) {
        const { faceCenter, parentTransform } = face.userData
        const direction = faceCenter.clone().normalize()
        const explodeOffset = direction.multiplyScalar(explodeAmount)
        const targetPosition = parentTransform.position.clone().add(explodeOffset)

        face.position.lerp(targetPosition, 0.1)
      }

      // Update colors
      if (face.material instanceof THREE.MeshStandardMaterial) {
        const newColor = getFaceColor(face.userData.faceIndex)
        face.material.color.setHex(Number.parseInt(newColor.replace("#", "0x")))
      }
    })
  })

  // Add faces to scene
  useEffect(() => {
    if (!showTriangles) {
      faces.forEach((face) => {
        if (groupRef.current) {
          groupRef.current.add(face)
        }
      })
    } else {
      faces.forEach((face) => {
        if (groupRef.current) {
          groupRef.current.remove(face)
        }
      })
    }

    return () => {
      faces.forEach((face) => {
        if (groupRef.current) {
          groupRef.current.remove(face)
        }
      })
    }
  }, [faces, showTriangles])

  if (loading) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cccccc" transparent opacity={0.5} />
      </mesh>
    )
  }

  return (
    <group ref={groupRef}>
      {/* Show original model in triangle view or as background */}
      {loadedModel && <primitive object={loadedModel} visible={showTriangles || explodeAmount === 0} />}
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
  onResetCamera,
}: ThreeJsViewerProps) {
  const controlsRef = useRef<any>(null)

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
    if (onResetCamera) {
      onResetCamera()
    }
  }

  return (
    <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      <ActualModel
        url={modelUrl}
        explodeAmount={explodeAmount}
        colorsByFace={colorsByFace}
        onFaceSelect={onFaceSelect}
        selectedFace={selectedFace}
        showTriangles={showTriangles}
      />

      <OrbitControls ref={controlsRef} makeDefault />
      <Environment preset="studio" />
    </Canvas>
  )
}
