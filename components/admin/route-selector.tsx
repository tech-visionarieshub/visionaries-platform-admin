"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PORTAL_ROUTES, getRoutesByCategory, type PortalRoute } from "@/lib/routes"
import { Search, CheckSquare, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface RouteSelectorProps {
  selectedRoutes: string[]
  onRoutesChange: (routes: string[]) => void
  className?: string
}

export function RouteSelector({ selectedRoutes, onRoutesChange, className }: RouteSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const routesByCategory = getRoutesByCategory()

  // Filtrar rutas por término de búsqueda
  const filteredRoutesByCategory = Object.entries(routesByCategory).reduce(
    (acc, [category, routes]) => {
      const filtered = routes.filter(
        route =>
          route.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (filtered.length > 0) {
        acc[category] = filtered
      }
      return acc
    },
    {} as Record<string, PortalRoute[]>
  )

  const toggleRoute = (routePath: string) => {
    if (selectedRoutes.includes(routePath)) {
      onRoutesChange(selectedRoutes.filter(r => r !== routePath))
    } else {
      onRoutesChange([...selectedRoutes, routePath])
    }
  }

  const toggleCategory = (category: string) => {
    const categoryRoutes = routesByCategory[category] || []
    const categoryPaths = categoryRoutes.map(r => r.path)
    const allSelected = categoryPaths.every(path => selectedRoutes.includes(path))

    if (allSelected) {
      // Deseleccionar todas las rutas de la categoría
      onRoutesChange(selectedRoutes.filter(r => !categoryPaths.includes(r)))
    } else {
      // Seleccionar todas las rutas de la categoría
      const newRoutes = [...selectedRoutes]
      categoryPaths.forEach(path => {
        if (!newRoutes.includes(path)) {
          newRoutes.push(path)
        }
      })
      onRoutesChange(newRoutes)
    }
  }

  const selectAll = () => {
    onRoutesChange(PORTAL_ROUTES.map(r => r.path))
  }

  const deselectAll = () => {
    onRoutesChange([])
  }

  const categoryAllSelected = (category: string) => {
    const categoryRoutes = routesByCategory[category] || []
    if (categoryRoutes.length === 0) return false
    return categoryRoutes.every(route => selectedRoutes.includes(route.path))
  }

  const categorySomeSelected = (category: string) => {
    const categoryRoutes = routesByCategory[category] || []
    return (
      categoryRoutes.some(route => selectedRoutes.includes(route.path)) &&
      !categoryAllSelected(category)
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Rutas Permitidas</Label>
          <p className="text-sm text-muted-foreground">
            Selecciona las rutas a las que este usuario tendrá acceso
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            Seleccionar Todas
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
            Deseleccionar Todas
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar rutas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {Object.entries(filteredRoutesByCategory).map(([category, routes]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{category}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="h-7"
                >
                  {categoryAllSelected(category) ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : categorySomeSelected(category) ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4 opacity-50" />
                  )}
                  <span className="ml-2 text-xs">
                    {categoryAllSelected(category)
                      ? "Deseleccionar"
                      : "Seleccionar Todo"}
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {routes.map((route) => {
                const isSelected = selectedRoutes.includes(route.path)
                return (
                  <div
                    key={route.path}
                    className="flex items-start space-x-3 rounded-md border p-3 hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      id={route.path}
                      checked={isSelected}
                      onCheckedChange={() => toggleRoute(route.path)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={route.path}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {route.label}
                      </Label>
                      <p className="text-xs text-muted-foreground font-mono">
                        {route.path}
                      </p>
                      {route.description && (
                        <p className="text-xs text-muted-foreground">
                          {route.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        <strong>{selectedRoutes.length}</strong> de <strong>{PORTAL_ROUTES.length}</strong> rutas
        seleccionadas
      </div>
    </div>
  )
}



