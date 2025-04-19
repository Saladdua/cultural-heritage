"use client"

import { useState } from "react"
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
import { Trash2, FolderPlus, Edit, Folder } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// Mock data - in a real app, this would come from the Flask API
const initialFolders = [
  { id: 1, name: "Greek Artifacts", fileCount: 5, createdAt: "2023-05-10" },
  { id: 2, name: "Roman Sculptures", fileCount: 3, createdAt: "2023-06-15" },
  { id: 3, name: "Egyptian Collection", fileCount: 7, createdAt: "2023-07-22" },
]

export default function FoldersPage() {
  const [folders, setFolders] = useState(initialFolders)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<{ id: number; name: string } | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<number | null>(null)
  const { toast } = useToast()

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return

    // In a real app, this would be an API call to the Flask backend
    const newFolder = {
      id: Math.max(0, ...folders.map((f) => f.id)) + 1,
      name: newFolderName,
      fileCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }

    setFolders([...folders, newFolder])
    setNewFolderName("")
    setIsCreateDialogOpen(false)

    toast({
      title: "Folder created",
      description: `Folder "${newFolderName}" has been created successfully.`,
    })
  }

  const handleEditFolder = () => {
    if (!editingFolder || !editingFolder.name.trim()) return

    // In a real app, this would be an API call to the Flask backend
    setFolders(
      folders.map((folder) => (folder.id === editingFolder.id ? { ...folder, name: editingFolder.name } : folder)),
    )

    setIsEditDialogOpen(false)

    toast({
      title: "Folder updated",
      description: `Folder has been renamed to "${editingFolder.name}".`,
    })
  }

  const handleDeleteFolder = () => {
    if (folderToDelete === null) return

    // In a real app, this would be an API call to the Flask backend
    setFolders(folders.filter((folder) => folder.id !== folderToDelete))
    setIsDeleteDialogOpen(false)

    toast({
      title: "Folder deleted",
      description: "The folder and its contents have been deleted.",
      variant: "destructive",
    })
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
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <Card key={folder.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="mr-2 h-5 w-5 text-slate-500" />
                {folder.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">
                <p>{folder.fileCount} files</p>
                <p>Created: {folder.createdAt}</p>
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
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditFolder}>Save Changes</Button>
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
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteFolder}>
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
    </div>
  )
}
