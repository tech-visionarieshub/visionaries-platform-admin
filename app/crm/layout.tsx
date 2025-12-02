"use client"

import type React from "react"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard sectionName="la sección de CRM">
      <div className="min-h-screen bg-background">{children}</div>
    </AdminGuard>
  )
}

