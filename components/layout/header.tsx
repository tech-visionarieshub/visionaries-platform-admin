"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Bell, Settings, ChevronDown, Menu, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

const navigation = [
  {
    name: "CRM",
    href: "/crm/dashboard",
    submenu: [
      { name: "Dashboard", href: "/crm/dashboard" },
      { name: "Kanban", href: "/crm/kanban" },
      { name: "Reportes", href: "/crm/reports" },
    ],
  },
  {
    name: "Finanzas",
    href: "/finanzas/dashboard",
    submenu: [
      { name: "Dashboard", href: "/finanzas/dashboard" },
      { name: "Clientes", href: "/finanzas/clientes" },
      { name: "Facturas", href: "/finanzas/facturas" },
      { name: "Complementos", href: "/finanzas/complementos" },
      { name: "Egresos", href: "/finanzas/egresos" },
      { name: "Nómina", href: "/finanzas/nomina" },
      { name: "Reportes", href: "/finanzas/reportes" },
    ],
  },
  {
    name: "Cotizaciones",
    href: "/cotizaciones",
    submenu: [
      { name: "Dashboard", href: "/cotizaciones" },
      { name: "Nueva", href: "/cotizaciones/nueva" },
      { name: "Templates", href: "/cotizaciones/templates" },
    ],
  },
  {
    name: "Proyectos",
    href: "/projects",
  },
  {
    name: "Reportes",
    href: "/reports",
  },
]

export function Header() {
  const pathname = usePathname()
  const headerId = Math.random().toString(36).substring(7)
  const { user } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const activeSection = navigation.find((item) => pathname.startsWith(item.href))
    return activeSection ? [activeSection.name] : []
  })

  console.log("[v0] Header rendering, pathname:", pathname, "ID:", headerId)

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName) ? prev.filter((name) => name !== sectionName) : [...prev, sectionName],
    )
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-white" data-header-id={headerId}>
      <div className="flex h-16 md:h-20 items-center gap-2 md:gap-8 px-4 md:px-6">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <Link href="/" className="flex flex-col" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg font-bold leading-tight tracking-tight text-[#0E0734]">VISIONARIES</span>
                  <span className="text-xs font-medium leading-tight tracking-wide text-[#4514F9]">PLATFORM</span>
                </Link>
              </div>
              <nav className="flex-1 overflow-y-auto p-4">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const isExpanded = expandedSections.includes(item.name)
                  const hasSubmenu = item.submenu && item.submenu.length > 0

                  return (
                    <div key={item.name} className="mb-2">
                      <div className="flex items-center gap-1">
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive ? "bg-[#4514F9]/10 text-[#4514F9]" : "text-gray-700 hover:bg-gray-100",
                          )}
                        >
                          {item.name}
                        </Link>
                        {hasSubmenu && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleSection(item.name)}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                      {hasSubmenu && isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu!.map((subitem) => (
                            <Link
                              key={subitem.name}
                              href={subitem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "block rounded px-3 py-1.5 text-sm transition-colors",
                                pathname === subitem.href
                                  ? "bg-[#4514F9]/10 text-[#4514F9] font-medium"
                                  : "text-gray-600 hover:bg-gray-50",
                              )}
                            >
                              {subitem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex flex-col">
          <span className="text-base md:text-lg font-bold leading-tight tracking-tight text-[#0E0734]">
            VISIONARIES
          </span>
          <span className="text-[10px] md:text-xs font-medium leading-tight tracking-wide text-[#4514F9]">
            PLATFORM
          </span>
        </Link>

        <nav className="hidden lg:flex flex-1 items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <div key={item.name} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#4514F9]/10 text-[#4514F9]"
                      : "text-gray-700 hover:bg-gray-100 hover:text-[#0E0734]",
                  )}
                >
                  {item.name}
                  {item.submenu && <ChevronDown className="h-4 w-4" />}
                </Link>

                {/* Submenu */}
                {item.submenu && (
                  <div className="invisible absolute left-0 top-full mt-1 w-48 rounded-lg border bg-white py-2 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        className={cn(
                          "block px-4 py-2 text-sm transition-colors",
                          pathname === subitem.href
                            ? "bg-[#4514F9]/10 text-[#4514F9] font-medium"
                            : "text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="hidden sm:block relative flex-1 lg:flex-none lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar..." className="pl-9" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto lg:ml-0">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E02814]" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          <div className="ml-2 flex items-center gap-2 rounded-lg border px-2 md:px-3 py-1.5">
            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-xs md:text-sm font-semibold text-white shadow-sm">
              {user?.avatar || "GP"}
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-medium leading-tight">{user?.name || user?.email?.split('@')[0] || "Usuario"}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || "Admin"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
