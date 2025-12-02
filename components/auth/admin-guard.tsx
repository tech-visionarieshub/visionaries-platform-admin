"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { isAdmin } from "@/lib/routes"

interface AdminGuardProps {
  children: React.ReactNode
  sectionName?: string
}

export function AdminGuard({ children, sectionName = "esta sección" }: AdminGuardProps) {
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Si el usuario está cargado y no es admin, redirigir inmediatamente
    if (user) {
      const userIsAdmin = isAdmin(user.email, { role: user.role, superadmin: user.superadmin }, user.role)
      if (!userIsAdmin) {
        console.log('[AdminGuard] Acceso denegado para usuario no admin:', user.email)
        router.replace('/')
      }
    }
  }, [user, router])

  // Si no hay usuario aún, mostrar loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4514F9] mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Verificar acceso ANTES de renderizar cualquier contenido
  const userIsAdmin = isAdmin(user.email, { role: user.role, superadmin: user.superadmin }, user.role)
  
  if (!userIsAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-sm text-gray-600 mb-6">
            No tienes permiso para acceder a {sectionName}. Esta sección está restringida a usuarios administradores.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#4514F9] text-white rounded-lg hover:bg-[#3810C7] transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  // Si tiene acceso, mostrar el contenido
  return <>{children}</>
}

