"use client"

import type React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { MainLayout } from "./main-layout"
import { 
  onAuthStateChange, 
  getCurrentUser 
} from "@/lib/firebase/visionaries-tech"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"

function AuthValidator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { setUser } = useUser()
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  const noLayoutRoutes = ["/login"]

  useEffect(() => {
    // 1. Rutas públicas: no requieren validación
    if (noLayoutRoutes.includes(pathname)) {
      setIsValidating(false)
      setIsAuthorized(true)
      return
    }

    // 2. Suscripción a cambios de auth (Nativa de Firebase)
    // Esto detecta la sesión automáticamente si vienes de Aura (mismo dominio/proyecto)
    const unsubscribe = onAuthStateChange(async (user) => {
      try {
      if (!user) {
          console.log('[Auth] No hay usuario autenticado')
          setIsAuthorized(false)
          router.replace('/login')
                return
        }

        // 3. Validación de Claims (Local, sin llamar API externa)
        const tokenResult = await user.getIdTokenResult(true)
        const claims = tokenResult.claims

        const isInternal = claims.internal === true
        const isSuperAdmin = claims.superadmin === true || user.email === 'adminplatform@visionarieshub.com'

        if (!isInternal && !isSuperAdmin) {
          console.warn('[Auth] Usuario sin permiso internal', user.email)
          setIsAuthorized(false)
          router.replace('/login?error=unauthorized')
          return
        }

        console.log('[Auth] Usuario autorizado:', user.email)
        
        // 4. Guardar en Store
        setUser({
          id: user.uid,
          name: user.displayName || claims.name as string || user.email?.split('@')[0] || 'Usuario',
          email: user.email || '',
          role: (claims.role as any) || 'admin',
          avatar: user.photoURL || undefined,
          superadmin: isSuperAdmin,
            })
          
          setIsAuthorized(true)
      } catch (error) {
        console.error('[Auth] Error validando sesión:', error)
        setIsAuthorized(false)
        router.replace('/login')
      } finally {
        setIsValidating(false)
      }
    })

    return () => unsubscribe()
  }, [pathname, router, setUser])

  const shouldShowLayout = !noLayoutRoutes.includes(pathname)

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600 font-medium">Iniciando sesión segura...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized && !noLayoutRoutes.includes(pathname)) {
    return null // Se redirige en el useEffect
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
        </div>
      </div>
    }>
      <AuthValidator>{children}</AuthValidator>
    </Suspense>
  )
}
