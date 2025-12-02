"use client"

import { AdminGuard } from "./admin-guard"

export function FinanzasGuard({ children }: { children: React.ReactNode }) {
  return <AdminGuard sectionName="la sección de Finanzas">{children}</AdminGuard>
}


