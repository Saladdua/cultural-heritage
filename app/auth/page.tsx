"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("auth_token")
    if (token) {
      router.push("/")
    }
  }, [router])

  const handleLoginSuccess = (user: any, token: string) => {
    router.push("/")
  }

  const handleRegisterSuccess = () => {
    setIsLogin(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}
