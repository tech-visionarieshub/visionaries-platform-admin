"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FinanzasGuard } from "@/components/auth/finanzas-guard"

const tabs = [
  { name: "Dashboard", href: "/finanzas/dashboard" },
  { name: "Clientes", href: "/finanzas/clientes" },
  { name: "Facturas", href: "/finanzas/facturas" },
  { name: "Complementos", href: "/finanzas/complementos" },
  { name: "Egresos", href: "/finanzas/egresos" },
  { name: "Nómina", href: "/finanzas/nomina" },
  { name: "Reportes", href: "/finanzas/reportes" },
]

export default function FinanzasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FinanzasGuard>
      <div className="space-y-4">
        <div className="border-b -mx-4 sm:mx-0">
          <div className="flex gap-1 overflow-x-auto px-4 sm:px-0 scrollbar-hide">
            {tabs.map((tab) => (
              <TabLink key={tab.href} href={tab.href}>
                {tab.name}
              </TabLink>
            ))}
          </div>
        </div>
        <div className="px-4 sm:px-0">{children}</div>
      </div>
    </FinanzasGuard>
  )
}

function TabLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        isActive
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
      )}
    >
      {children}
    </Link>
  )
}
