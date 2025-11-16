"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { signIn, signInWithGoogle } from "@/lib/firebase/visionaries-tech"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      // onAuthStateChange en layout-wrapper.tsx manejará la redirección
      router.push("/")
    } catch (error: any) {
      console.error('[Login] Error:', error)
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      await signInWithGoogle()
      router.push("/")
    } catch (error: any) {
      console.error('[Login] Error:', error)
      setError(error.message || "Error al iniciar sesión con Google")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">V</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Visionaries Platform</CardTitle>
          <CardDescription>Ingresa con tu cuenta de Aura</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu-email@visionarieshub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <div className="mt-4">
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Continuar con Google
            </Button>
          </div>

          <div className="pt-4 border-t mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Usa las mismas credenciales que en Aura
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
