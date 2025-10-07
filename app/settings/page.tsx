"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Moon, Sun, Monitor, Bell, Download, Trash2, Globe } from "lucide-react"
import { NavHeader } from "@/components/nav-header"
import { ProtectedRoute } from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"

function SettingsContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Settings state
  const [notifications, setNotifications] = useState({
    uploadComplete: true,
    modelShared: true,
    systemUpdates: false,
  })

  const [language, setLanguage] = useState("en")
  const [autoSave, setAutoSave] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("user_settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setNotifications(parsed.notifications || notifications)
        setLanguage(parsed.language || "en")
        setAutoSave(parsed.autoSave !== undefined ? parsed.autoSave : true)
      } catch (e) {
        console.error("Error loading settings:", e)
      }
    }
  }, [])

  const saveSettings = () => {
    const settings = {
      notifications,
      language,
      autoSave,
      theme,
    }
    localStorage.setItem("user_settings", JSON.stringify(settings))
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    })
  }

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export will be ready shortly.",
    })
  }

  const handleClearCache = () => {
    // Clear any cached data
    sessionStorage.clear()
    toast({
      title: "Cache cleared",
      description: "Application cache has been cleared.",
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">Manage your application preferences and account settings</p>

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the application looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what updates you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Upload Complete</Label>
                <p className="text-sm text-muted-foreground">Get notified when your 3D model uploads finish</p>
              </div>
              <Switch
                checked={notifications.uploadComplete}
                onCheckedChange={(checked) =>
                  setNotifications({
                    ...notifications,
                    uploadComplete: checked,
                  })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Model Shared</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone views your models</p>
              </div>
              <Switch
                checked={notifications.modelShared}
                onCheckedChange={(checked) =>
                  setNotifications({
                    ...notifications,
                    modelShared: checked,
                  })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified about new features and updates</p>
              </div>
              <Switch
                checked={notifications.systemUpdates}
                onCheckedChange={(checked) =>
                  setNotifications({
                    ...notifications,
                    systemUpdates: checked,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Configure your application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-save</Label>
                <p className="text-sm text-muted-foreground">Automatically save your work</p>
              </div>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="language">
                <Globe className="h-4 w-4 inline mr-2" />
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your data and storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Export Data</Label>
                <p className="text-sm text-muted-foreground">Download all your models and folders</p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Clear Cache</Label>
                <p className="text-sm text-muted-foreground">Clear temporary data and cache</p>
              </div>
              <Button variant="outline" onClick={handleClearCache}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveSettings}>
            <Bell className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <>
      <NavHeader />
      <ProtectedRoute>
        <SettingsContent />
      </ProtectedRoute>
    </>
  )
}
