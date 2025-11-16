"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { useUser } from "@/hooks/use-user"
import { hasPermission, type UserRole } from "@/lib/permissions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PermissionButtonProps extends ButtonProps {
  module: keyof import("@/lib/permissions").PermissionMatrix
  requiredPermission?: "view" | "edit"
}

export function PermissionButton({ module, requiredPermission = "edit", children, ...props }: PermissionButtonProps) {
  const { user } = useUser()

  if (!user) return null

  const hasAccess = hasPermission(user.role as UserRole, module, requiredPermission)

  if (!hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button {...props} disabled>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>No tienes permisos para esta acción</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return <Button {...props}>{children}</Button>
}
