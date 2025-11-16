"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, FileText, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { mockCotizaciones, type EstadoCotizacion } from "@/lib/mock-data/cotizaciones"

export default function CotizacionesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<string>("all")

  // Calcular métricas
  const totalCotizaciones = mockCotizaciones.length
  const cotizacionesAceptadas = mockCotizaciones.filter((c) => c.estado === "Aceptada").length
  const tasaAceptacion = totalCotizaciones > 0 ? ((cotizacionesAceptadas / totalCotizaciones) * 100).toFixed(1) : "0"
  const valorPromedio =
    mockCotizaciones.length > 0
      ? (mockCotizaciones.reduce((sum, c) => sum + (c.desglose?.costoTotal || 0), 0) / mockCotizaciones.length).toFixed(
          0,
        )
      : "0"
  const pipelineActual = mockCotizaciones
    .filter((c) => c.estado === "Enviada" || c.estado === "En revisión")
    .reduce((sum, c) => sum + (c.desglose?.costoTotal || 0), 0)

  // Filtrar cotizaciones
  const filteredCotizaciones = mockCotizaciones.filter((cot) => {
    const matchesSearch =
      cot.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cot.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cot.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = estadoFilter === "all" || cot.estado === estadoFilter
    const matchesTipo = tipoFilter === "all" || cot.tipoProyecto === tipoFilter
    return matchesSearch && matchesEstado && matchesTipo
  })

  const getEstadoBadge = (estado: EstadoCotizacion) => {
    const variants: Record<
      EstadoCotizacion,
      { variant: "default" | "secondary" | "destructive" | "outline"; className: string }
    > = {
      Borrador: { variant: "secondary", className: "bg-gray-100 text-gray-700" },
      Enviada: { variant: "default", className: "bg-blue-100 text-blue-700" },
      "En revisión": { variant: "outline", className: "bg-yellow-100 text-yellow-700" },
      Aceptada: { variant: "default", className: "bg-green-100 text-green-700" },
      Rechazada: { variant: "destructive", className: "bg-red-100 text-red-700" },
      "Generando Contrato": { variant: "outline", className: "bg-indigo-100 text-indigo-700" },
      "Contrato en Revisión": { variant: "outline", className: "bg-purple-100 text-purple-700" },
      "Enviada a Firma": { variant: "default", className: "bg-cyan-100 text-cyan-700" },
      Firmada: { variant: "default", className: "bg-emerald-100 text-emerald-700" },
      Convertida: { variant: "secondary", className: "bg-slate-100 text-slate-700" },
    }
    return variants[estado]
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground">Gestiona tus cotizaciones y propuestas de proyectos</p>
        </div>
        <Link href="/cotizaciones/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Cotizaciones</p>
              <p className="text-2xl font-bold">{totalCotizaciones}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasa de Aceptación</p>
              <p className="text-2xl font-bold">{tasaAceptacion}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Promedio</p>
              <p className="text-2xl font-bold">${(Number.parseInt(valorPromedio) || 0).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pipeline Actual</p>
              <p className="text-2xl font-bold">${(pipelineActual || 0).toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio, cliente o título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Borrador">Borrador</SelectItem>
                <SelectItem value="Enviada">Enviada</SelectItem>
                <SelectItem value="En revisión">En revisión</SelectItem>
                <SelectItem value="Aceptada">Aceptada</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
                <SelectItem value="Generando Contrato">Generando Contrato</SelectItem>
                <SelectItem value="Contrato en Revisión">Contrato en Revisión</SelectItem>
                <SelectItem value="Enviada a Firma">Enviada a Firma</SelectItem>
                <SelectItem value="Firmada">Firmada</SelectItem>
                <SelectItem value="Convertida">Convertida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-48">
            <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Dashboard">Dashboard</SelectItem>
                <SelectItem value="CRM">CRM</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="App Móvil">App Móvil</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabla de cotizaciones */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Folio</th>
                <th className="text-left p-4 font-medium">Cliente</th>
                <th className="text-left p-4 font-medium">Título</th>
                <th className="text-left p-4 font-medium">Tipo</th>
                <th className="text-left p-4 font-medium">Estado</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-left p-4 font-medium">Fecha</th>
                <th className="text-right p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCotizaciones.map((cot) => {
                const estadoBadge = getEstadoBadge(cot.estado)
                return (
                  <tr key={cot.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm">{cot.folio}</span>
                    </td>
                    <td className="p-4">{cot.clienteNombre}</td>
                    <td className="p-4">{cot.titulo}</td>
                    <td className="p-4">
                      <Badge variant="outline">{cot.tipoProyecto}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={estadoBadge.className}>{cot.estado}</Badge>
                    </td>
                    <td className="p-4 text-right font-semibold">
                      ${(cot.desglose?.costoTotal || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(cot.fechaCreacion).toLocaleDateString("es-MX")}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/cotizaciones/detalle/${cot.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver detalle
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredCotizaciones.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No se encontraron cotizaciones que coincidan con los filtros.
          </div>
        )}
      </Card>
    </div>
  )
}
