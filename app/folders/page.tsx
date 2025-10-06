"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Trash2, FolderPlus, Edit, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { NavHeader } from "@/components/nav-header"
import { ProtectedRoute } from "@/components/protected-route"

interface FolderType {
  id: number
  name: string
  file_count: number
  created_at: string
}

function FoldersContent() {
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<{ id: number; name: string } | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const getAuthToken = () => {
    return localStorage.getItem("auth_token")
  }

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()

      const response = await fetch("http://localhost:5000/api/folders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const transformedFolders = data.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          file_count: folder.file_count || 0,
          created_at: folder.created_at,
        }))
        setFolders(transformedFolders)
      } else {
        throw new Error("Failed to fetch folders")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load folders. Make sure you're signed in.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      setCreating(true)
      const token = getAuthToken()

      const response = await fetch("http://localhost:5000/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newFolderName }),
      })

      if (response.ok) {
        setNewFolderName("")
        setIsCreateDialogOpen(false)
        fetchFolders()

        toast({
          title: "Folder created",
          description: `Folder "${newFolderName}" has been created successfully.`,
        })
      } else {
        throw new Error("Failed to create folder")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditFolder = async () => {
    if (!editingFolder || !editingFolder.name.trim()) return

    try {
      setUpdating(true)
      const token = getAuthToken()

      const response = await fetch(`http://localhost:5000/api/folders/${editingFolder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingFolder.name }),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        fetchFolders()

        toast({
          title: "Folder updated",
          description: `Folder has been renamed to "${editingFolder.name}".`,
        })
      } else {
        throw new Error("Failed to update folder")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update folder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteFolder = async () => {
    if (folderToDelete === null) return

    try {
      setDeleting(true)
      const token = getAuthToken()

      const response = await fetch(`http://localhost:5000/api/folders/${folderToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setIsDeleteDialogOpen(false)
        fetchFolders()

        toast({
          title: "Folder deleted",
          description: "The folder and its contents have been deleted.",
          variant: "destructive",
        })
      } else {
        throw new Error("Failed to delete folder")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete folder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading folders...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Folder Management</h1>
          <p className="text-slate-600">Organize your 3D cultural heritage artifacts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>Enter a name for your new folder to organize your 3D artifacts.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Byzantine Collection"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <Card key={folder.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderPlus className="mr-2 h-5 w-5 text-slate-500" />
                {folder.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">
                <p>{folder.file_count} files</p>
                <p>Created: {folder.created_at}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <Dialog
                  open={isEditDialogOpen && editingFolder?.id === folder.id}
                  onOpenChange={(open) => {
                    setIsEditDialogOpen(open)
                    if (!open) setEditingFolder(null)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFolder({ id: folder.id, name: folder.name })}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Folder</DialogTitle>
                      <DialogDescription>Change the name of your folder.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="editFolderName">Folder Name</Label>
                      <Input
                        id="editFolderName"
                        value={editingFolder?.name || ""}
                        onChange={(e) => setEditingFolder((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updating}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditFolder} disabled={updating}>
                        {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isDeleteDialogOpen && folderToDelete === folder.id}
                  onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open)
                    if (!open) setFolderToDelete(null)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-2"
                      onClick={() => setFolderToDelete(folder.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Folder</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this folder? This action cannot be undone and all files within
                        the folder will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteFolder} disabled={deleting}>
                        {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Folder
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Link href={`/folders/${folder.id}`}>
                <Button>View Contents</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {folders.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <FolderPlus className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium mb-2">No folders yet</h3>
          <p className="text-slate-500 mb-4">Create your first folder to organize your 3D artifacts</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
        </div>
      )}
    </div>
  )
}

export default function FoldersPage() {
  return (
    <>
      <NavHeader />
      <ProtectedRoute>
        <FoldersContent />
      </ProtectedRoute>
    </>
  )
}
