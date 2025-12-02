"use client"

import type React from "react"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard sectionName="la sección de Reportes">
      <div className="min-h-screen bg-background">{children}</div>
    </AdminGuard>
  )
}

