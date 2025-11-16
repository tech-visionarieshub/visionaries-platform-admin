"use client"

import type React from "react"

import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { MainLayout } from "./main-layout"
import { useUser } from "@/hooks/use-user"

function AuthValidator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const user = useUser((state) => state.user)
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Rutas que NO deben tener el MainLayout (header + sidebar)
  const noLayoutRoutes = ["/login"]

  useEffect(() => {
    async function validateToken() {
      // Permitir acceso a login sin validación
      if (noLayoutRoutes.includes(pathname)) {
        setIsValidating(false)
        setIsAuthorized(true)
        return
      }

      // Si el usuario está autenticado localmente (login directo), permitir acceso
      if (user && user.id) {
        console.log('[Auth] Usuario autenticado localmente')
        setIsValidating(false)
        setIsAuthorized(true)
        return
      }

      // Verificar si hay token en localStorage (para acceso desde AURA)
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('portalAuth') : null
      
      // Obtener token del query param o localStorage
      const token = searchParams.get('token') || storedToken
      
      if (!token) {
        console.log('[Auth] No token found, redirecting to login')
        setIsValidating(false)
        setIsAuthorized(false)
        // Redirigir a login en lugar de mostrar error
        router.push('/login')
        return
      }

      try {
        // Validar JWT en el servidor
        const response = await fetch('/api/validate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        
        const data = await response.json()
        
        if (data.valid) {
          console.log('[Auth] Token válido')
          setIsAuthorized(true)
          // Guardar token en localStorage para futuras peticiones
          localStorage.setItem('portalAuth', token)
        } else {
          console.log('[Auth] Token inválido:', data.error)
          setIsAuthorized(false)
          router.push('/login')
        }
      } catch (error) {
        console.error('[Auth] Error validando token:', error)
        setIsAuthorized(false)
        router.push('/login')
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [pathname, searchParams, router, user])

  const shouldShowLayout = !noLayoutRoutes.includes(pathname)

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Validando acceso...</p>
        </div>
      </div>
    )
  }

  // Si no está autorizado y no es una ruta de login, mostrar loading mientras redirige
  if (!isAuthorized && !noLayoutRoutes.includes(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  if (!shouldShowLayout) {
    return <>{children}</>
  }

  return <MainLayout>{children}</MainLayout>
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <AuthValidator>{children}</AuthValidator>
    </Suspense>
  )
}
