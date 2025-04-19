"use client"

import type React from "react"

import { useState, useCallback } from "react"
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
import { CuboidIcon as Cube, Upload, ArrowLeft, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// Mock data - in a real app, this would come from the Flask API
const folderData = {
  1: {
    id: 1,
    name: "Greek Artifacts",
    files: [
      { id: 1, name: "Parthenon Fragment.obj", type: "obj", size: "2.4 MB", uploadedAt: "2023-05-12" },
      { id: 2, name: "Athena Statue.ply", type: "ply", size: "5.1 MB", uploadedAt: "2023-05-14" },
      { id: 3, name: "Doric Column.stl", type: "stl", size: "1.8 MB", uploadedAt: "2023-05-15" },
      { id: 4, name: "Ancient Vase.obj", type: "obj", size: "3.2 MB", uploadedAt: "2023-05-18" },
      { id: 5, name: "Corinthian Capital.ply", type: "ply", size: "4.5 MB", uploadedAt: "2023-05-20" },
    ],
  },
  2: {
    id: 2,
    name: "Roman Sculptures",
    files: [
      { id: 6, name: "Augustus Statue.obj", type: "obj", size: "7.2 MB", uploadedAt: "2023-06-16" },
      { id: 7, name: "Roman Bust.ply", type: "ply", size: "3.8 MB", uploadedAt: "2023-06-18" },
      { id: 8, name: "Trajan Column Fragment.stl", type: "stl", size: "2.9 MB", uploadedAt: "2023-06-20" },
    ],
  },
  3: {
    id: 3,
    name: "Egyptian Collection",
    files: [
      { id: 9, name: "Sphinx Fragment.obj", type: "obj", size: "6.3 MB", uploadedAt: "2023-07-23" },
      { id: 10, name: "Pharaoh Mask.ply", type: "ply", size: "8.1 MB", uploadedAt: "2023-07-25" },
      { id: 11, name: "Hieroglyphic Panel.stl", type: "stl", size: "4.2 MB", uploadedAt: "2023-07-26" },
      { id: 12, name: "Anubis Statue.obj", type: "obj", size: "5.7 MB", uploadedAt: "2023-07-28" },
      { id: 13, name: "Scarab Artifact.ply", type: "ply", size: "1.5 MB", uploadedAt: "2023-07-29" },
      { id: 14, name: "Obelisk Fragment.stl", type: "stl", size: "3.4 MB", uploadedAt: "2023-07-30" },
      { id: 15, name: "Sarcophagus Detail.obj", type: "obj", size: "9.2 MB", uploadedAt: "2023-08-01" },
    ],
  },
}

export default function FolderContentsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const folderId = Number(params.id)

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<number | null>(null)
  const [files, setFiles] = useState(folderData[folderId as keyof typeof folderData]?.files || [])
  const [dragActive, setDragActive] = useState(false)

  const folder = folderData[folderId as keyof typeof folderData]

  const handleFiles = useCallback(
    (fileList: FileList) => {
      // In a real app, this would upload the files to the Flask backend
      const newFiles = Array.from(fileList)
        .filter((file) => {
          const extension = file.name.split(".").pop()?.toLowerCase()
          return extension === "obj" || extension === "ply" || extension === "stl"
        })
        .map((file, index) => ({
          id: Math.max(0, ...files.map((f) => f.id)) + index + 1,
          name: file.name,
          type: file.name.split(".").pop() || "",
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString().split("T")[0],
        }))

      if (newFiles.length > 0) {
        setFiles([...files, ...newFiles])
        setIsUploadDialogOpen(false)

        toast({
          title: "Files uploaded",
          description: `${newFiles.length} file(s) have been uploaded successfully.`,
        })
      } else {
        toast({
          title: "Invalid files",
          description: "Only .obj, .ply, and .stl files are supported.",
          variant: "destructive",
        })
      }
    },
    [files, toast],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const handleDeleteFile = useCallback(() => {
    if (fileToDelete === null) return

    // In a real app, this would be an API call to the Flask backend
    setFiles(files.filter((file) => file.id !== fileToDelete))
    setIsDeleteDialogOpen(false)

    toast({
      title: "File deleted",
      description: "The 3D model has been deleted.",
      variant: "destructive",
    })
  }, [fileToDelete, files, toast])

  if (!folder) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Folder Not Found</h1>
        <p className="mb-6">The folder you're looking for doesn't exist.</p>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload 3D Models</DialogTitle>
              <DialogDescription>
                Drag and drop your 3D model files (.obj, .ply, .stl) or click to browse.
              </DialogDescription>
            </DialogHeader>
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center my-4 ${
                dragActive ? "border-primary bg-primary/5" : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Cube className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="mb-2 font-medium">Drag and drop your 3D models here</p>
              <p className="text-sm text-slate-500 mb-4">Supported formats: .obj, .ply, .stl</p>
              <input
                type="file"
                id="fileUpload"
                multiple
                accept=".obj,.ply,.stl"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <label htmlFor="fileUpload">
                <Button variant="outline" className="cursor-pointer" tabIndex={-1}>
                  Browse Files
                </Button>
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 uppercase">{file.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{file.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{file.uploadedAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/viewer?model=${file.id}&folder=${folderId}`}>
                      <Button variant="outline" size="sm" className="mr-2">
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
