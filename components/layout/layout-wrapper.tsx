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
        console.log('[Auth] ===== INICIO VALIDACIÓN TOKEN DESDE URL =====')
        console.log('[Auth] Token detectado en URL, validando...', { 
          pathname, 
          tokenLength: tokenFromUrl.length,
          tokenPreview: tokenFromUrl.substring(0, 20) + '...'
        })
        
        try {
          console.log('[Auth] Paso 1: Preparando fetch a /api/internal/validate-access')
          
          // Validar acceso interno con el backend usando el token de la URL
          const response = await fetch('/api/internal/validate-access', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokenFromUrl}`,
              'Content-Type': 'application/json',
            },
          })

          console.log('[Auth] Paso 2: Respuesta recibida:', { 
            status: response.status, 
            ok: response.ok,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          })

          console.log('[Auth] Paso 3: Parseando respuesta JSON...')
          const data = await response.json()
          console.log('[Auth] Paso 4: Datos de validación parseados:', { 
            valid: data.valid, 
            error: data.error,
            user: data.user ? {
              uid: data.user.uid,
              email: data.user.email,
              role: data.user.role,
              internal: data.user.internal,
              superadmin: data.user.superadmin,
              allowedRoutes: data.user.allowedRoutes
            } : null
          })

          if (data.valid) {
            console.log('[Auth] Paso 5: Token válido, usuario autorizado:', data.user.email)
            
            // Verificar acceso a la ruta actual
            console.log('[Auth] Paso 6: Verificando acceso a ruta:', pathname)
            const allowedRoutes = data.user.allowedRoutes || []
            const isSuperAdmin = data.user.superadmin === true || data.user.email === 'adminplatform@visionarieshub.com'
            console.log('[Auth] Paso 6.1: Info de acceso:', {
              allowedRoutes,
              isSuperAdmin,
              pathname,
              hasRouteAccess: hasRouteAccess(allowedRoutes, pathname, data.user.email, { superadmin: data.user.superadmin })
            })
            
            if (!isSuperAdmin && allowedRoutes.length > 0 && !hasRouteAccess(allowedRoutes, pathname, data.user.email, { superadmin: data.user.superadmin })) {
              console.log('[Auth] Paso 6.2: Usuario no tiene acceso a esta ruta:', pathname)
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
            
            console.log('[Auth] Paso 7: Guardando token en sessionStorage...')
            // Guardar token en sessionStorage para uso posterior
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('portalAuthToken', tokenFromUrl)
              console.log('[Auth] Paso 7.1: Token guardado en sessionStorage')
            }
            
            // Guardar información del usuario en el store
            // Cuando vienes desde Aura con token en URL, puede que no haya currentUser
            // Usar los datos del token validado
            console.log('[Auth] Paso 8: Obteniendo currentUser...')
            const currentUser = getCurrentUser()
            console.log('[Auth] Paso 8.1: currentUser:', currentUser ? {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName
            } : null)
            
            if (currentUser) {
              console.log('[Auth] Paso 9: Hay currentUser, obteniendo token result...')
              // Si hay currentUser, obtener datos actualizados del token
              try {
                const tokenResult = await currentUser.getIdTokenResult(true)
                const updatedDisplayName = currentUser.displayName || tokenResult.claims.name || currentUser.email?.split('@')[0] || 'Usuario'
                console.log('[Auth] Paso 9.1: Token result obtenido, estableciendo usuario en store...')
                
                setUser({
                  id: currentUser.uid,
                  name: updatedDisplayName,
                  email: currentUser.email || data.user.email || '',
                  role: (data.user.role as any) || 'admin',
                  avatar: currentUser.photoURL || undefined,
                  superadmin: data.user.superadmin || false,
                })
                console.log('[Auth] Paso 9.2: Usuario establecido en store (con currentUser)')
              } catch (error) {
                console.warn('[Auth] Paso 9.3: Error obteniendo token result, usando datos del token validado:', error)
                // Fallback: usar datos del token validado
                setUser({
                  id: data.user.uid,
                  name: data.user.email?.split('@')[0] || 'Usuario',
                  email: data.user.email || '',
                  role: (data.user.role as any) || 'admin',
                  avatar: undefined,
                  superadmin: data.user.superadmin || false,
                })
                console.log('[Auth] Paso 9.4: Usuario establecido en store (fallback)')
              }
            } else {
              // No hay currentUser (viene desde Aura), usar datos del token validado
              console.log('[Auth] Paso 10: No hay currentUser, usando datos del token validado')
              setUser({
                id: data.user.uid,
                name: data.user.email?.split('@')[0] || 'Usuario',
                email: data.user.email || '',
                role: (data.user.role as any) || 'admin',
                avatar: undefined,
                superadmin: data.user.superadmin || false,
              })
              console.log('[Auth] Paso 10.1: Usuario establecido en store (sin currentUser)')
            }
            
            // Limpiar token de la URL y redirigir a home (no a login)
            console.log('[Auth] Paso 11: Limpiando token de URL y redirigiendo...')
            const targetPath = pathname === '/login' ? '/' : pathname
            console.log('[Auth] Paso 11.1: Target path:', targetPath)
            console.log('[Auth] Paso 11.2: Estableciendo isAuthorized=true, isValidating=false')
            setIsAuthorized(true)
            setIsValidating(false)
            console.log('[Auth] Paso 11.3: Llamando router.replace...')
            router.replace(targetPath)
            console.log('[Auth] ===== FIN VALIDACIÓN TOKEN DESDE URL (ÉXITO) =====')
          } else {
            console.log('[Auth] Paso 5 (ERROR): Token inválido o sin acceso interno:', data.error)
            setIsAuthorized(false)
            setIsValidating(false)
            router.push('/login')
            console.log('[Auth] ===== FIN VALIDACIÓN TOKEN DESDE URL (ERROR) =====')
          }
        } catch (error) {
          console.error('[Auth] ===== ERROR EN VALIDACIÓN TOKEN DESDE URL =====')
          console.error('[Auth] Error validando token de URL:', error)
          // Si hay un error de red o del servidor, mostrar mensaje más específico
          if (error instanceof Error) {
            console.error('[Auth] Detalles del error:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            })
          }
          console.error('[Auth] Estableciendo isAuthorized=false, isValidating=false')
          setIsAuthorized(false)
          setIsValidating(false)
          // Solo redirigir a login si no estamos ya ahí
          if (pathname !== '/login') {
            console.error('[Auth] Redirigiendo a /login')
            router.push('/login')
          }
          console.error('[Auth] ===== FIN VALIDACIÓN TOKEN DESDE URL (EXCEPCIÓN) =====')
        } finally {
          console.log('[Auth] Finally: Asegurando isValidating=false')
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
          // Forzar refresh del token para obtener displayName actualizado
          const currentUser = getCurrentUser()
          if (currentUser) {
            // Obtener displayName actualizado del token
            const tokenResult = await currentUser.getIdTokenResult(true)
            const updatedDisplayName = currentUser.displayName || tokenResult.claims.name || currentUser.email?.split('@')[0] || 'Usuario'
            
            setUser({
              id: currentUser.uid,
              name: updatedDisplayName,
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
