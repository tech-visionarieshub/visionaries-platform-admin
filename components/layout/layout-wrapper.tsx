"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { MainLayout } from "./main-layout"
import { 
  onAuthStateChange, 
  getIdToken, 
  getCurrentUser 
} from "@/lib/firebase/visionaries-tech"

function AuthValidator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Rutas que NO deben tener el MainLayout (header + sidebar)
  const noLayoutRoutes = ["/login"]

  useEffect(() => {
    // Permitir acceso a login sin validación
    if (noLayoutRoutes.includes(pathname)) {
      setIsValidating(false)
      setIsAuthorized(true)
      return
    }

    // Observar cambios en el estado de autenticación de visionaries-tech
    const unsubscribe = onAuthStateChange(async (user) => {
      if (!user) {
        console.log('[Auth] No hay usuario autenticado, redirigiendo a login')
        setIsValidating(false)
        setIsAuthorized(false)
        router.push('/login')
        return
      }

      try {
        // Obtener idToken del usuario
        const idToken = await getIdToken();
        
        if (!idToken) {
          console.log('[Auth] No se pudo obtener token')
          setIsValidating(false)
          setIsAuthorized(false)
          router.push('/login')
          return
        }

        // Validar acceso interno con el backend
        const response = await fetch('/api/internal/validate-access', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (data.valid) {
          console.log('[Auth] Usuario autorizado:', data.user.email)
          setIsAuthorized(true)
        } else {
          console.log('[Auth] Usuario sin acceso interno:', data.error)
          setIsAuthorized(false)
          router.push('/login')
        }
      } catch (error) {
        console.error('[Auth] Error validando acceso:', error)
        setIsAuthorized(false)
        router.push('/login')
      } finally {
        setIsValidating(false)
      }
    })

    return () => unsubscribe()
  }, [pathname, router])

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
