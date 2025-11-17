"use client"

import type React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { MainLayout } from "./main-layout"
import { 
  onAuthStateChange, 
  getIdToken, 
  getCurrentUser 
} from "@/lib/firebase/visionaries-tech"
import { hasRouteAccess } from "@/lib/routes"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"

function AuthValidator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { setUser } = useUser()
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

    // Verificar si hay token en la URL (SSO desde Aura)
    const tokenFromUrl = searchParams.get('token')
    
    if (tokenFromUrl) {
      // Validar token de la URL
      const validateTokenFromUrl = async () => {
        try {
          console.log('[Auth] Token detectado en URL, validando...', { 
            pathname, 
            tokenLength: tokenFromUrl.length,
            tokenPreview: tokenFromUrl.substring(0, 20) + '...'
          })
          
          // Validar acceso interno con el backend usando el token de la URL
          const response = await fetch('/api/internal/validate-access', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokenFromUrl}`,
              'Content-Type': 'application/json',
            },
          })

          console.log('[Auth] Respuesta de validación:', { 
            status: response.status, 
            ok: response.ok 
          })

          const data = await response.json()
          console.log('[Auth] Datos de validación:', { valid: data.valid, error: data.error })

          if (data.valid) {
            console.log('[Auth] Token válido, usuario autorizado:', data.user.email)
            
            // Verificar acceso a la ruta actual
            const allowedRoutes = data.user.allowedRoutes || []
            const isSuperAdmin = data.user.superadmin === true || data.user.email === 'adminplatform@visionarieshub.com'
            if (!isSuperAdmin && allowedRoutes.length > 0 && !hasRouteAccess(allowedRoutes, pathname, data.user.email, { superadmin: data.user.superadmin })) {
              console.log('[Auth] Usuario no tiene acceso a esta ruta:', pathname)
              toast({
                title: "Acceso denegado",
                description: "No tienes permiso para acceder a esta sección.",
                variant: "destructive",
              })
              router.push('/')
              setIsAuthorized(false)
              setIsValidating(false)
              return
            }
            
            // Guardar token en sessionStorage para uso posterior
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('portalAuthToken', tokenFromUrl)
            }
            
            // Guardar información del usuario en el store
            const currentUser = getCurrentUser()
            if (currentUser) {
              setUser({
                id: currentUser.uid,
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
                email: currentUser.email || data.user.email || '',
                role: (data.user.role as any) || 'admin',
                avatar: currentUser.photoURL || undefined,
                superadmin: data.user.superadmin || false,
              })
            }
            
            // Limpiar token de la URL y redirigir a home (no a login)
            const targetPath = pathname === '/login' ? '/' : pathname
            router.replace(targetPath)
            setIsAuthorized(true)
          } else {
            console.log('[Auth] Token inválido o sin acceso interno:', data.error)
            setIsAuthorized(false)
            router.push('/login')
          }
        } catch (error) {
          console.error('[Auth] Error validando token de URL:', error)
          // Si hay un error de red o del servidor, mostrar mensaje más específico
          if (error instanceof Error) {
            console.error('[Auth] Detalles del error:', error.message)
          }
          setIsAuthorized(false)
          // Solo redirigir a login si no estamos ya ahí
          if (pathname !== '/login') {
            router.push('/login')
          }
        } finally {
          setIsValidating(false)
        }
      }

      validateTokenFromUrl()
      return
    }

    // Flujo normal: Observar cambios en el estado de autenticación de visionaries-tech
    const unsubscribe = onAuthStateChange(async (user) => {
      if (!user) {
        // Verificar si hay token guardado en sessionStorage
        if (typeof window !== 'undefined') {
          const savedToken = sessionStorage.getItem('portalAuthToken')
          if (savedToken) {
            // Intentar validar con el token guardado
            try {
              const response = await fetch('/api/internal/validate-access', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${savedToken}`,
                  'Content-Type': 'application/json',
                },
              })
              const data = await response.json()
              if (data.valid) {
                console.log('[Auth] Token guardado válido, usuario autorizado')
                setIsAuthorized(true)
                setIsValidating(false)
                return
              } else {
                // Token inválido, limpiar
                sessionStorage.removeItem('portalAuthToken')
              }
            } catch (error) {
              console.error('[Auth] Error validando token guardado:', error)
              sessionStorage.removeItem('portalAuthToken')
            }
          }
        }
        
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
          // Verificar acceso a la ruta actual
          const allowedRoutes = data.user.allowedRoutes || []
          const isSuperAdmin = data.user.superadmin === true || data.user.email === 'adminplatform@visionarieshub.com'
          if (!isSuperAdmin && allowedRoutes.length > 0 && !hasRouteAccess(allowedRoutes, pathname, data.user.email, { superadmin: data.user.superadmin })) {
            console.log('[Auth] Usuario no tiene acceso a esta ruta:', pathname)
            toast({
              title: "Acceso denegado",
              description: "No tienes permiso para acceder a esta sección.",
              variant: "destructive",
            })
            router.push('/')
            setIsAuthorized(false)
            setIsValidating(false)
            return
          }
          console.log('[Auth] Usuario autorizado:', data.user.email)
          // Guardar token en sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('portalAuthToken', idToken)
          }
          
          // Guardar información del usuario en el store
          const currentUser = getCurrentUser()
          if (currentUser) {
            setUser({
              id: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
              email: currentUser.email || data.user.email || '',
              role: (data.user.role as any) || 'admin',
              avatar: currentUser.photoURL || undefined,
              superadmin: data.user.superadmin || false,
            })
          }
          
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
  }, [pathname, router, searchParams])

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
