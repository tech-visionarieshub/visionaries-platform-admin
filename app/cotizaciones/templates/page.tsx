"use client"

import { useState } from "react"
import React from "react" // Import React for useMemo
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockTemplates, type CotizacionTemplate } from "@/lib/mock-data/cotizaciones-templates"
import { Plus, Copy, Edit, Eye, Search, Clock, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<string>("all")

  const templates = React.useMemo(() => {
    try {
      return mockTemplates || []
    } catch (error) {
      console.error("[v0] Error loading templates:", error)
      return []
    }
  }, [])

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = tipoFiltro === "all" || template.tipoProyecto === tipoFiltro
    return matchesSearch && matchesTipo
  })

  const tiposProyecto = Array.from(new Set(templates.map((t) => t.tipoProyecto)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Templates de Cotización</h1>
          <p className="text-muted-foreground">Plantillas predefinidas para agilizar la creación de cotizaciones</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Crear Template
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {tiposProyecto.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No se encontraron templates</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TemplateCard({ template }: { template: CotizacionTemplate }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.nombre}</CardTitle>
            <CardDescription className="mt-1">{template.descripcion}</CardDescription>
          </div>
          <Badge variant={template.predefinido ? "default" : "secondary"}>
            {template.predefinido ? "Predefinido" : "Custom"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de proyecto */}
        <div className="flex items-center gap-2 text-sm">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{template.tipoProyecto}</span>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-muted-foreground text-xs">Pantallas</div>
            <div className="font-semibold mt-1">{template.pantallasTipicas.length}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-muted-foreground text-xs">Funcionalidades</div>
            <div className="font-semibold mt-1">{template.funcionalidadesTipicas.length}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-muted-foreground text-xs">Horas totales</div>
            <div className="font-semibold mt-1">{template.horasTotales}h</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-muted-foreground text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duración
            </div>
            <div className="font-semibold mt-1">{template.mesesEstimados}m</div>
          </div>
        </div>

        {/* Fases */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Fases del proyecto:</div>
          <div className="flex flex-wrap gap-1">
            {template.fasesTipicas.slice(0, 3).map((fase, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {fase.nombre}
              </Badge>
            ))}
            {template.fasesTipicas.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.fasesTipicas.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
            <Link href={`/cotizaciones/templates/${template.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
            <Link href={`/cotizaciones/nueva?template=${template.id}`}>
              <Copy className="h-4 w-4 mr-1" />
              Usar
            </Link>
          </Button>
          {!template.predefinido && (
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
