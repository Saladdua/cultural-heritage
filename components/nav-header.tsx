"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogOut, Settings, Cable as Cube, FolderPlus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export function NavHeader() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user_data")

    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error("Error parsing user data:", e)
      }
    }
    setLoading(false)
  }, [])

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem("auth_token")

      // Call logout API
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Clear local storage
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")

      setUser(null)

      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      })

      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      // Clear local data even if API call fails
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
      setUser(null)
      router.push("/")
    }
  }

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    return user?.username?.[0]?.toUpperCase() || "U"
  }

  if (loading) {
    return (
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-slate-800">3D Cultural Heritage</h1>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-slate-800 cursor-pointer hover:text-slate-600 transition">
              🏛️ 3D Cultural Heritage
            </h1>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/folders">
                  <Button variant="ghost">
                    <FolderPlus className="mr-2 h-4 w-4" />
                    My Folders
                  </Button>
                </Link>

                <Link href="/viewer">
                  <Button variant="ghost">
                    <Cube className="mr-2 h-4 w-4" />
                    3D Viewer
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
