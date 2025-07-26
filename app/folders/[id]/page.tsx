"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CuboidIcon as Cube, Upload, ArrowLeft, Trash2, Eye, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function FolderContentsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const folderId = Number(params.id)

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<number | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [folder, setFolder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch folder data
  const fetchFolderData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/folders/${folderId}`)
      if (response.ok) {
        const data = await response.json()
        setFolder(data)
        setFiles(data.models || [])
      } else {
        throw new Error("Failed to fetch folder")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load folder. Make sure the backend server is running.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFolderData()
  }, [folderId])

  // Fixed file upload function
  const handleFiles = useCallback(
    async (fileList: FileList) => {
      console.log("handleFiles called with:", fileList.length, "files")

      const validFiles = Array.from(fileList).filter((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase()
        const isValid =
          extension === "obj" ||
          extension === "ply" ||
          extension === "stl" ||
          extension === "glb" ||
          extension === "gltf"
        console.log(`File ${file.name}: extension=${extension}, valid=${isValid}`)
        return isValid
      })

      if (validFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Only .obj, .ply, .stl, .glb, and .gltf files are supported.",
          variant: "destructive",
        })
        return
      }

      setUploading(true)
      let successCount = 0
      let errorCount = 0

      // Upload each file
      for (const file of validFiles) {
        try {
          console.log(`Uploading ${file.name}...`)
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch(`http://localhost:5000/api/folders/${folderId}/models`, {
            method: "POST",
            body: formData,
          })

          if (response.ok) {
            successCount++
            console.log(`✅ Successfully uploaded ${file.name}`)
          } else {
            const errorData = await response.json()
            console.error(`❌ Failed to upload ${file.name}:`, errorData)
            errorCount++
          }
        } catch (error) {
          console.error(`❌ Upload error for ${file.name}:`, error)
          errorCount++
        }
      }

      setUploading(false)

      // Refresh the folder data
      await fetchFolderData()
      setIsUploadDialogOpen(false)

      // Show result toast
      if (successCount > 0) {
        toast({
          title: "Upload completed",
          description: `${successCount} file(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ""}.`,
        })
      } else {
        toast({
          title: "Upload failed",
          description: "No files were uploaded successfully.",
          variant: "destructive",
        })
      }
    },
    [folderId, toast],
  )

  // Fixed drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Drag event:", e.type)

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      console.log("Drop event triggered")
      console.log("Files dropped:", e.dataTransfer.files.length)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  // Fixed file input handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("File input change triggered")
      if (e.target.files && e.target.files.length > 0) {
        console.log("Files selected:", e.target.files.length)
        handleFiles(e.target.files)
        // Reset the input so the same file can be selected again
        e.target.value = ""
      }
    },
    [handleFiles],
  )

  const handleDeleteFile = useCallback(async () => {
    if (fileToDelete === null) return

    try {
      const response = await fetch(`http://localhost:5000/api/models/${fileToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      await fetchFolderData()
      setIsDeleteDialogOpen(false)

      toast({
        title: "File deleted",
        description: "The 3D model has been deleted.",
        variant: "destructive",
      })
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }, [fileToDelete, toast])

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading folder...</span>
        </div>
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Folder Not Found</h1>
        <p className="mb-6">The folder you're looking for doesn't exist or couldn't be loaded.</p>
        <Link href="/folders">
          <Button>Back to Folders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-2">
        <Button variant="ghost" onClick={() => router.push("/folders")} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-3xl font-bold">{folder.name}</h1>
      </div>
      <p className="text-slate-600 mb-6">{files.length} 3D models</p>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">3D Models</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Models
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload 3D Models</DialogTitle>
              <DialogDescription>
                Drag and drop your 3D model files (.obj, .ply, .stl) or click to browse.
              </DialogDescription>
            </DialogHeader>

            {/* Fixed upload area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center my-4 transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-gray-300"
              } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="font-medium">Uploading files...</p>
                  <p className="text-sm text-slate-500">Please wait</p>
                </div>
              ) : (
                <>
                  <Cube className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="mb-2 font-medium">Drag and drop your 3D models here</p>
                  <p className="text-sm text-slate-500 mb-4">Supported formats: .obj, .ply, .stl, .glb, .gltf</p>

                  {/* Fixed file input */}
                  <input
                    type="file"
                    id="fileUpload"
                    multiple
                    accept=".obj,.ply,.stl,.glb,.gltf"
                    className="hidden"
                    onChange={handleFileInputChange}
                    disabled={uploading}
                  />
                  <label htmlFor="fileUpload">
                    <Button variant="outline" className="cursor-pointer bg-transparent" asChild disabled={uploading}>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={uploading}>
                {uploading ? "Uploading..." : "Cancel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Cube className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium mb-2">No 3D models yet</h3>
          <p className="text-slate-500 mb-4">Upload some 3D models to get started</p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Models
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{file.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 uppercase">{file.file_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {(file.file_size / (1024 * 1024)).toFixed(1)} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{file.uploaded_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/viewer?model=${file.id}&folder=${folderId}`}>
                      <Button variant="outline" size="sm" className="mr-2 bg-transparent">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </Link>

                    <Dialog
                      open={isDeleteDialogOpen && fileToDelete === file.id}
                      onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open)
                        if (!open) setFileToDelete(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => setFileToDelete(file.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete 3D Model</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete "{file.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteFile}>
                            Delete Model
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
