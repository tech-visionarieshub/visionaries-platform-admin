"use client"

import type React from "react"

import { useUser } from "@/hooks/use-user"
import { hasPermission, type UserRole } from "@/lib/permissions"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PermissionGuardProps {
  module: keyof import("@/lib/permissions").PermissionMatrix
  permission: "view" | "edit"
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ module, permission, children, fallback }: PermissionGuardProps) {
  const { user } = useUser()

  if (!user) {
    return (
      fallback || (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Debes iniciar sesión para acceder a esta sección.</AlertDescription>
        </Alert>
      )
    )
  }

  const hasAccess = hasPermission(user.role as UserRole, module, permission)

  if (!hasAccess) {
    return (
      fallback || (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para {permission === "view" ? "ver" : "editar"} esta sección.
          </AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}
