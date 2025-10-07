"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { FolderPlus, Database, Lock, Battery as Gallery } from "lucide-react"
import { NavHeader } from "@/components/nav-header"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    setIsAuthenticated(!!token)
  }, [])

  return (
    <>
      <NavHeader />
      <main className="min-h-screen bg-slate-50">
        <div className="container mx-auto py-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">3D Cultural Heritage Visualization</h1>
            <p className="text-slate-600 mb-4">Upload, manage, and visualize 3D cultural artifacts</p>

            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto mt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="h-5 w-5 text-yellow-600" />
                  <p className="font-medium text-yellow-800">Authentication Required</p>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  Please sign in or create an account to access folders and 3D models
                </p>
                <Link href="/auth">
                  <Button>Sign In / Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Gallery className="mr-2 h-5 w-5" />
                  3D Gallery
                </CardTitle>
                <CardDescription>Browse all uploaded models</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">Explore 3D models uploaded by researchers and curators</p>
                {isAuthenticated ? (
                  <Link href="/gallery">
                    <Button>Browse Gallery</Button>
                  </Link>
                ) : (
                  <Button disabled>
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In Required
                  </Button>
                )}
              </CardContent>
            </Card>

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
                {isAuthenticated ? (
                  <Link href="/folders">
                    <Button>Manage Folders</Button>
                  </Link>
                ) : (
                  <Button disabled>
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In Required
                  </Button>
                )}
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
              <li>
                <strong>Create an account</strong> or sign in to access the platform
              </li>
              <li>
                <strong>Browse the gallery</strong> to view models uploaded by other users
              </li>
              <li>
                <strong>Create a new folder</strong> to organize your 3D artifacts
              </li>
              <li>
                <strong>Upload your 3D mesh files</strong> (.obj, .ply, .stl, .glb, .gltf)
              </li>
              <li>
                <strong>Use the visualization tools</strong> to inspect, colorize, and explode your 3D models
              </li>
            </ol>
          </div>
        </div>
      </main>
    </>
  )
}
