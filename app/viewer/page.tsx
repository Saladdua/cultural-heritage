"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { HexColorPicker } from "@/components/color-picker"
import { ArrowLeft, Maximize, Minimize, RotateCcw, Layers, Palette, SlidersHorizontal, Loader2 } from "lucide-react"
import Link from "next/link"
import ThreeJsViewer from "@/components/three-js-viewer"
import { useToast } from "@/hooks/use-toast"
import { NavHeader } from "@/components/nav-header"
import { ProtectedRoute } from "@/components/protected-route"

function ViewerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const modelId = Number(searchParams.get("model"))
  const folderId = Number(searchParams.get("folder"))

  // State for model data
  const [model, setModel] = useState<any>(null)
  const [folder, setFolder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Viewer state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [explodeAmount, setExplodeAmount] = useState(0)
  const [selectedColor, setSelectedColor] = useState("#6E56CF")
  const [selectedFace, setSelectedFace] = useState<number | null>(null)
  const [colorsByFace, setColorsByFace] = useState<Record<number, string>>({})
  const viewerContainerRef = useRef<HTMLDivElement>(null)
  const [showTriangles, setShowTriangles] = useState(false)
  const [resetCameraKey, setResetCameraKey] = useState(0)

  const { toast } = useToast()

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("auth_token")
  }

  // Fetch model and folder data with auth
  useEffect(() => {
    const fetchData = async () => {
      if (!modelId || !folderId) {
        setError("Missing model or folder ID")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const token = getAuthToken()

        if (!token) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view models.",
            variant: "destructive",
          })
          router.push("/auth")
          return
        }

        // Fetch model data
        const modelResponse = await fetch(`http://localhost:5000/api/models/${modelId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (modelResponse.status === 401) {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user_data")
          toast({
            title: "Session expired",
            description: "Please sign in again.",
            variant: "destructive",
          })
          router.push("/auth")
          return
        }

        if (!modelResponse.ok) {
          throw new Error("Failed to fetch model data")
        }
        const modelData = await modelResponse.json()

        // Fetch folder data for folder name
        const folderResponse = await fetch(`http://localhost:5000/api/folders/${folderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!folderResponse.ok) {
          throw new Error("Failed to fetch folder data")
        }
        const folderData = await folderResponse.json()

        setModel(modelData)
        setFolder(folderData)
        setError(null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load model data. Make sure the backend server is running.")
        toast({
          title: "Error",
          description: "Failed to load model data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [modelId, folderId, toast, router])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerContainerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleFaceSelect = (faceIndex: number) => {
    setSelectedFace(faceIndex)
  }

  const applyColorToFace = () => {
    if (selectedFace !== null) {
      setColorsByFace({
        ...colorsByFace,
        [selectedFace]: selectedColor,
      })
    }
  }

  const resetColors = () => {
    setColorsByFace({})
    setSelectedFace(null)
  }

  const handleResetCamera = () => {
    setResetCameraKey((prev) => prev + 1)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-lg font-medium">Loading 3D model...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !model || !folder) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Model Not Found</h1>
        <p className="mb-6">{error || "The 3D model you're looking for doesn't exist."}</p>
        <Link href="/folders">
          <Button>Back to Folders</Button>
        </Link>
      </div>
    )
  }

  // Construct the model URL with auth token
  const modelUrl = `http://localhost:5000/api/models/${modelId}/file`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-4">
          <Link href={`/folders/${folderId}`}>
            <Button variant="ghost" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{model.name}</h1>
            <p className="text-slate-600">{folder.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div
              ref={viewerContainerRef}
              className="bg-white rounded-lg shadow-sm overflow-hidden relative"
              style={{ height: "70vh" }}
            >
              <ThreeJsViewer
                key={resetCameraKey}
                modelUrl={modelUrl}
                fileType={model.file_type}
                explodeAmount={explodeAmount}
                colorsByFace={colorsByFace}
                onFaceSelect={handleFaceSelect}
                selectedFace={selectedFace}
                showTriangles={showTriangles}
                onResetCamera={handleResetCamera}
              />

              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/80 backdrop-blur-sm"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Tabs defaultValue="controls">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="controls">
                  <SlidersHorizontal className="h-4 w-4 mr-1" /> Controls
                </TabsTrigger>
                <TabsTrigger value="explode">
                  <Layers className="h-4 w-4 mr-1" /> Explode
                </TabsTrigger>
                <TabsTrigger value="color">
                  <Palette className="h-4 w-4 mr-1" /> Color
                </TabsTrigger>
              </TabsList>

              <TabsContent value="controls" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Model Information</h3>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p>
                            <strong>File:</strong> {model.name}
                          </p>
                          <p>
                            <strong>Type:</strong> {model.file_type.toUpperCase()}
                          </p>
                          <p>
                            <strong>Size:</strong> {(model.file_size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                          <p>
                            <strong>Uploaded:</strong> {model.uploaded_at}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">Display Mode</h3>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={!showTriangles ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowTriangles(false)}
                          >
                            Face View
                          </Button>
                          <Button
                            variant={showTriangles ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowTriangles(true)}
                          >
                            Triangle View
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {showTriangles
                            ? "Showing original model with triangulated mesh"
                            : "Showing explodable faces for analysis"}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">Navigation Controls</h3>
                        <ul className="text-sm text-slate-600 space-y-2">
                          <li>• Left click + drag: Rotate model</li>
                          <li>• Right click + drag: Pan camera</li>
                          <li>• Scroll: Zoom in/out</li>
                          <li>• Click faces: Select for coloring (Face View only)</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">Reset View</h3>
                        <Button variant="outline" className="w-full bg-transparent" onClick={handleResetCamera}>
                          <RotateCcw className="h-4 w-4 mr-2" /> Reset Camera
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="explode" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Explode Model</h3>
                        <p className="text-sm text-slate-600 mb-4">
                          Separate the model faces to examine internal structures. Only works in Face View mode.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm">Explosion Amount</span>
                              <span className="text-sm font-medium">{explodeAmount.toFixed(1)}</span>
                            </div>
                            <Slider
                              value={[explodeAmount]}
                              min={0}
                              max={3}
                              step={0.1}
                              onValueChange={(value) => setExplodeAmount(value[0])}
                              disabled={showTriangles}
                            />
                          </div>

                          <Button
                            variant="outline"
                            className="w-full bg-transparent"
                            onClick={() => setExplodeAmount(0)}
                            disabled={explodeAmount === 0 || showTriangles}
                          >
                            Reset Explosion
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="color" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Colorize Faces</h3>
                        <p className="text-sm text-slate-600 mb-4">
                          Click on a face of the model to select it, then choose a color to apply. Only works in Face
                          View mode.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <div className="mb-2">
                              <span className="text-sm">
                                Selected Face: {selectedFace !== null ? `#${selectedFace}` : "None"}
                              </span>
                            </div>

                            <div className="mb-4">
                              <HexColorPicker color={selectedColor} onChange={setSelectedColor} className="w-full" />
                            </div>

                            <Button
                              className="w-full mb-2"
                              onClick={applyColorToFace}
                              disabled={selectedFace === null || showTriangles}
                            >
                              Apply Color
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full bg-transparent"
                              onClick={resetColors}
                              disabled={Object.keys(colorsByFace).length === 0}
                            >
                              Reset All Colors
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ViewerPage() {
  return (
    <>
      <NavHeader />
      <ProtectedRoute>
        <ViewerContent />
      </ProtectedRoute>
    </>
  )
}
