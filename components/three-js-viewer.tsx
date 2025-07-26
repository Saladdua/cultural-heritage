"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Html, useProgress } from "@react-three/drei"
import * as THREE from "three"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

interface ThreeJsViewerProps {
  modelUrl: string
  fileType: string // Add file type as a prop
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
  showTriangles?: boolean
  onResetCamera?: () => void
}

// Loading component
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-lg">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <div className="text-lg font-medium text-gray-700 mb-2">Loading 3D Model</div>
        <div className="text-sm text-gray-500 mb-3">{Math.round(progress)}% complete</div>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </Html>
  )
}

// Auto-fit camera to model
function CameraController({ target }: { target: THREE.Object3D | null }) {
  const { camera, controls } = useThree()

  useEffect(() => {
    if (target && controls) {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(target)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // Calculate optimal camera distance
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.2 // Add 20% padding

      // Position camera
      const direction = new THREE.Vector3(1, 1, 1).normalize()
      const newPosition = center.clone().add(direction.multiplyScalar(distance))

      camera.position.copy(newPosition)
      camera.lookAt(center)

      // Update controls
      if (controls.target) {
        controls.target.copy(center)
      }
      controls.update()
    }
  }, [target, camera, controls])

  return null
}

function ActualModel({
  url,
  fileType,
  explodeAmount,
  colorsByFace,
  onFaceSelect,
  selectedFace,
  showTriangles = false,
}: {
  url: string
  fileType: string
  explodeAmount: number
  colorsByFace: Record<number, string>
  onFaceSelect: (faceIndex: number) => void
  selectedFace: number | null
  showTriangles?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const originalModelRef = useRef<THREE.Group>(null!)
  const { raycaster, camera, gl } = useThree()
  const [hoveredFace, setHoveredFace] = useState<number | null>(null)
  const [loadedModel, setLoadedModel] = useState<THREE.Object3D | null>(null)
  const [originalModel, setOriginalModel] = useState<THREE.Object3D | null>(null)
  const [faces, setFaces] = useState<THREE.Mesh[]>([])
  const [loading, setLoading] = useState(true)

  // Load the actual 3D model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true)
        console.log(`Loading model from: ${url}`)
        console.log(`File type: ${fileType}`)

        const extension = fileType.toLowerCase()
        let loader: any
        let loadedObject: THREE.Object3D

        switch (extension) {
          case "obj":
            loader = new OBJLoader()
            loadedObject = await new Promise<THREE.Group>((resolve, reject) => {
              loader.load(
                url,
                (object: THREE.Group) => {
                  console.log("✅ OBJ loaded successfully")
                  resolve(object)
                },
                (progress: any) => {
                  console.log("Loading progress:", (progress.loaded / progress.total) * 100 + "%")
                },
                (error: any) => {
                  console.error("❌ OBJ loading error:", error)
                  reject(error)
                },
              )
            })
            break

          case "ply":
            loader = new PLYLoader()
            const plyGeometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
              loader.load(
                url,
                (geometry: THREE.BufferGeometry) => {
                  console.log("✅ PLY loaded successfully")
                  resolve(geometry)
                },
                (progress: any) => {
                  console.log("Loading progress:", (progress.loaded / progress.total) * 100 + "%")
                },
                (error: any) => {
                  console.error("❌ PLY loading error:", error)
                  reject(error)
                },
              )
            })
            loadedObject = new THREE.Mesh(plyGeometry, new THREE.MeshStandardMaterial({ color: 0x888888 }))
            break

          case "stl":
            loader = new STLLoader()
            const stlGeometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
              loader.load(
                url,
                (geometry: THREE.BufferGeometry) => {
                  console.log("✅ STL loaded successfully")
                  resolve(geometry)
                },
                (progress: any) => {
                  console.log("Loading progress:", (progress.loaded / progress.total) * 100 + "%")
                },
                (error: any) => {
                  console.error("❌ STL loading error:", error)
                  reject(error)
                },
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
                (gltf: any) => {
                  console.log("✅ GLB/GLTF loaded successfully")
                  resolve(gltf)
                },
                (progress: any) => {
                  console.log("Loading progress:", (progress.loaded / progress.total) * 100 + "%")
                },
                (error: any) => {
                  console.error("❌ GLB/GLTF loading error:", error)
                  reject(error)
                },
              )
            })
            loadedObject = gltf.scene
            break

          default:
            console.error(`❌ Unsupported file format: ${extension}`)
            throw new Error(`Unsupported file format: ${extension}`)
        }

        // Create original model (with textures/materials preserved)
        const originalModelClone = loadedObject.clone()

        // Calculate bounding box for proper scaling
        const box = new THREE.Box3().setFromObject(loadedObject)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim // Scale to fit in a 3-unit cube

        // Center and scale both models
        loadedObject.position.sub(center)
        loadedObject.scale.setScalar(scale)

        originalModelClone.position.sub(center)
        originalModelClone.scale.setScalar(scale)

        setLoadedModel(loadedObject)
        setOriginalModel(originalModelClone)

        // Extract faces from the loaded model
        extractFacesFromModel(loadedObject)

        setLoading(false)
        console.log("✅ Model loading completed successfully")
      } catch (err) {
        console.error("❌ Error loading model:", err)
        setLoading(false)
        // Create a fallback model
        createFallbackModel()
      }
    }

    loadModel()
  }, [url, fileType])

  const createFallbackModel = () => {
    console.log("Creating fallback model...")
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

    const originalClone = group.clone()

    setLoadedModel(group)
    setOriginalModel(originalClone)
    extractFacesFromModel(group)
    setLoading(false)
  }

  const extractFacesFromModel = (model: THREE.Object3D) => {
    const extractedFaces: THREE.Mesh[] = []
    let faceIndex = 0

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry

        // Limit face extraction for performance on large models
        const maxFaces = 1000 // Limit to 1000 faces for performance
        let currentFaces = 0

        if (geometry.index && currentFaces < maxFaces) {
          // Indexed geometry
          const indices = geometry.index.array
          const positions = geometry.attributes.position

          for (let i = 0; i < indices.length && currentFaces < maxFaces; i += 3) {
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
              opacity: 0.8,
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
            currentFaces++
          }
        }
      }
    })

    console.log(`Extracted ${extractedFaces.length} faces from model`)
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

  return (
    <>
      {/* Auto-fit camera to model */}
      <CameraController target={originalModel} />

      <group ref={groupRef}>
        {/* Original model with textures (visible only when not exploding and in triangle view) */}
        {originalModel && (
          <group ref={originalModelRef}>
            <primitive object={originalModel} visible={showTriangles || explodeAmount === 0} />
          </group>
        )}
      </group>
    </>
  )
}

export default function ThreeJsViewer({
  modelUrl,
  fileType,
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
    <Canvas camera={{ position: [5, 5, 5], fov: 50, near: 0.1, far: 1000 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      <directionalLight position={[0, 10, 5]} intensity={0.5} />

      <ActualModel
        url={modelUrl}
        fileType={fileType}
        explodeAmount={explodeAmount}
        colorsByFace={colorsByFace}
        onFaceSelect={onFaceSelect}
        selectedFace={selectedFace}
        showTriangles={showTriangles}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={true}
        dampingFactor={0.05}
        maxDistance={50}
        minDistance={0.5}
      />
      <Environment preset="studio" />
    </Canvas>
  )
}
