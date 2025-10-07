"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Cable as Cube, Eye, Search, User, Loader2, FolderOpen } from "lucide-react"
import { NavHeader } from "@/components/nav-header"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"

interface ModelWithUser {
  id: number
  name: string
  description: string
  file_type: string
  file_size: number
  uploaded_at: string
  folder_id: number
  folder_name: string
  uploader_username: string
  uploader_name: string
  uploader_organization: string
}

function GalleryContent() {
  const [models, setModels] = useState<ModelWithUser[]>([])
  const [filteredModels, setFilteredModels] = useState<ModelWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const getAuthToken = () => {
    return localStorage.getItem("auth_token")
  }

  useEffect(() => {
    fetchAllModels()
  }, [])

  useEffect(() => {
    // Filter models based on search query
    if (searchQuery.trim() === "") {
      setFilteredModels(models)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = models.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.uploader_username.toLowerCase().includes(query) ||
          model.uploader_name.toLowerCase().includes(query) ||
          model.folder_name.toLowerCase().includes(query) ||
          (model.uploader_organization && model.uploader_organization.toLowerCase().includes(query)),
      )
      setFilteredModels(filtered)
    }
  }, [searchQuery, models])

  const fetchAllModels = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()

      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view the gallery.",
          variant: "destructive",
        })
        router.push("/auth")
        return
      }

      const response = await fetch("http://localhost:5000/api/gallery/models", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
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

      if (!response.ok) {
        throw new Error("Failed to fetch models")
      }

      const data = await response.json()
      setModels(data)
      setFilteredModels(data)
    } catch (error) {
      console.error("Error fetching models:", error)
      toast({
        title: "Error",
        description: "Failed to load models. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewModel = (modelId: number, folderId: number) => {
    router.push(`/viewer?model=${modelId}&folder=${folderId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-lg font-medium">Loading gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">3D Model Gallery</h1>
        <p className="text-slate-600 mb-4">Browse all uploaded 3D cultural heritage artifacts</p>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by model name, uploader, or folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredModels.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Cube className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium mb-2">{searchQuery ? "No models found" : "No models uploaded yet"}</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery ? "Try adjusting your search query" : "Be the first to upload a 3D cultural heritage artifact"}
          </p>
          {!searchQuery && (
            <Button onClick={() => router.push("/folders")}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Go to My Folders
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-4">
            Showing {filteredModels.length} of {models.length} models
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModels.map((model) => (
              <Card key={model.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate" title={model.name}>
                        {model.name}
                      </CardTitle>
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        <span className="truncate">{model.folder_name}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {model.file_type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-slate-400" />
                    <div className="text-sm">
                      <div className="font-medium text-slate-700">{model.uploader_name || model.uploader_username}</div>
                      {model.uploader_organization && (
                        <div className="text-xs text-slate-500">{model.uploader_organization}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Size: {(model.file_size / (1024 * 1024)).toFixed(1)} MB</div>
                    <div>Uploaded: {model.uploaded_at}</div>
                  </div>

                  {model.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2" title={model.description}>
                      {model.description}
                    </p>
                  )}
                </CardContent>

                <CardFooter>
                  <Button className="w-full" onClick={() => handleViewModel(model.id, model.folder_id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View in 3D
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function GalleryPage() {
  return (
    <>
      <NavHeader />
      <ProtectedRoute>
        <GalleryContent />
      </ProtectedRoute>
    </>
  )
}
