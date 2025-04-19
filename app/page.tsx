import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { FolderPlus, Database, CuboidIcon as Cube } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold mb-2">3D Cultural Heritage Visualization</h1>
        <p className="text-slate-600 mb-8">Upload, manage, and visualize 3D cultural artifacts</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <FolderPlus className="mr-2 h-5 w-5" />
                Folder Management
              </CardTitle>
              <CardDescription>Upload and organize your 3D artifacts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                Create folders to organize your 3D mesh files (.obj, .ply, .stl)
              </p>
              <Link href="/folders">
                <Button>Manage Folders</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Cube className="mr-2 h-5 w-5" />
                3D Visualization
              </CardTitle>
              <CardDescription>Explore and interact with 3D models</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">Inspect, colorize, and explode 3D artifacts</p>
              <Link href="/viewer">
                <Button>Open Viewer</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Database
              </CardTitle>
              <CardDescription>MySQL database integration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">All your data is securely stored in a MySQL database</p>
              <Link href="/api-docs">
                <Button variant="outline">API Documentation</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Create a new folder to organize your 3D artifacts</li>
            <li>Upload your 3D mesh files (.obj, .ply, .stl)</li>
            <li>Open the 3D viewer to interact with your models</li>
            <li>Use the visualization tools to inspect, colorize, and explode your 3D models</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
