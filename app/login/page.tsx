"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/hooks/use-user"
import { AlertCircle } from "lucide-react"
import { authenticateUser } from "@/lib/firebase"

export default function LoginPage() {
  const router = useRouter()
  const setUser = useUser((state) => state.setUser)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate email domain
    if (!email.endsWith("@visionarieshub.com")) {
      setError("Solo se permiten correos del dominio @visionarieshub.com")
      return
    }

    if (!password) {
      setError("La contraseña es requerida")
      return
    }

    setLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const authenticatedUser = authenticateUser(email, password)

    if (!authenticatedUser) {
      setError("No tienes acceso a la plataforma. Contacta al administrador para solicitar acceso.")
      setLoading(false)
      return
    }

    setUser({
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authenticatedUser.email}`,
    })

    setLoading(false)
    router.push("/crm/dashboard")
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
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu-nombre@visionarieshub.com"
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

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Login simulado con Firebase - El rol es asignado por el administrador
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
