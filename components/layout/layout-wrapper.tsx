"use client"

import type React from "react"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { MainLayout } from "./main-layout"

function AuthValidator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
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

      // Obtener token del query param
      const token = searchParams.get('token')
      
      if (!token) {
        console.log('[Auth] No token found')
        setIsValidating(false)
        setIsAuthorized(false)
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
        }
      } catch (error) {
        console.error('[Auth] Error validando token:', error)
        setIsAuthorized(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [pathname, searchParams])

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

  if (!isAuthorized && !noLayoutRoutes.includes(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Acceso no autorizado</h1>
          <p className="text-muted-foreground mb-4">
            No tienes permiso para acceder a esta plataforma.
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, accede desde AURA para obtener un token válido.
          </p>
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
