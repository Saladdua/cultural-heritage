"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { HexColorPicker } from "@/components/color-picker"
import { ArrowLeft, Maximize, Minimize, RotateCcw, Layers, Palette, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import ThreeJsViewer from "@/components/three-js-viewer"

// Updated model data with working URLs
const modelData = {
  1: { id: 1, name: "Parthenon Fragment.obj", folderId: 1, url: "/assets/3d/test.obj" },
  2: { id: 2, name: "Athena Statue.ply", folderId: 1, url: "/assets/3d/test.obj" },
  3: { id: 3, name: "Doric Column.stl", folderId: 1, url: "/assets/3d/test.obj" },
  4: { id: 4, name: "Ancient Vase.obj", folderId: 1, url: "/assets/3d/test.obj" },
  5: { id: 5, name: "Corinthian Capital.ply", folderId: 1, url: "/assets/3d/test.obj" },
  6: { id: 6, name: "Augustus Statue.obj", folderId: 2, url: "/assets/3d/test.obj" },
  7: { id: 7, name: "Roman Bust.ply", folderId: 2, url: "/assets/3d/test.obj" },
  8: { id: 8, name: "Trajan Column Fragment.stl", folderId: 2, url: "/assets/3d/test.obj" },
  9: { id: 9, name: "Sphinx Fragment.obj", folderId: 3, url: "/assets/3d/test.obj" },
  10: { id: 10, name: "Pharaoh Mask.ply", folderId: 3, url: "/assets/3d/test.obj" },
  11: { id: 11, name: "Hieroglyphic Panel.stl", folderId: 3, url: "/assets/3d/test.obj" },
  12: { id: 12, name: "Anubis Statue.obj", folderId: 3, url: "/assets/3d/test.obj" },
  13: { id: 13, name: "Scarab Artifact.ply", folderId: 3, url: "/assets/3d/test.obj" },
  14: { id: 14, name: "Obelisk Fragment.stl", folderId: 3, url: "/assets/3d/test.obj" },
  15: { id: 15, name: "Sarcophagus Detail.obj", folderId: 3, url: "/assets/3d/test.obj" },
}

const folderNames = {
  1: "Greek Artifacts",
  2: "Roman Sculptures",
  3: "Egyptian Collection",
}

export default function ViewerPage() {
  const searchParams = useSearchParams()
  const modelId = Number(searchParams.get("model") || "1")
  const folderId = Number(searchParams.get("folder") || "1")
  const model = modelData[modelId as keyof typeof modelData]

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [explodeAmount, setExplodeAmount] = useState(0)
  const [selectedColor, setSelectedColor] = useState("#6E56CF")
  const [selectedFace, setSelectedFace] = useState<number | null>(null)
  const [colorsByFace, setColorsByFace] = useState<Record<number, string>>({})
  const viewerContainerRef = useRef<HTMLDivElement>(null)
  const [showTriangles, setShowTriangles] = useState(false)
  const [resetCameraKey, setResetCameraKey] = useState(0)

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

  if (!model) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Model Not Found</h1>
        <p className="mb-6">The 3D model you're looking for doesn't exist.</p>
        <Link href="/folders">
          <Button>Back to Folders</Button>
        </Link>
      </div>
    )
  }

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
            <p className="text-slate-600">{folderNames[folderId as keyof typeof folderNames]}</p>
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
                modelUrl={model.url}
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
                        <Button variant="outline" className="w-full" onClick={handleResetCamera}>
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
                            className="w-full"
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
                              className="w-full"
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
