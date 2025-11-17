"use client"

import { Card } from "@/components/ui/card"
import { getCotizaciones } from "@/lib/api/cotizaciones-api"
import type { Cotizacion } from "@/lib/mock-data/cotizaciones"
import { Clock, DollarSign, CheckCircle2, FileText, Target } from "lucide-react"
import { useState, useEffect } from "react"

export default function CotizacionesReportesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCotizaciones() {
      try {
        const data = await getCotizaciones()
        setCotizaciones(data)
      } catch (err) {
        console.error('Error loading cotizaciones:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCotizaciones()
  }, [])

  // Calculate metrics
  const total = cotizaciones.length
  const enviadas = cotizaciones.filter((c) => ["Enviada", "En revisión", "Enviada a Firma"].includes(c.estado)).length
  const aceptadas = cotizaciones.filter((c) => ["Aceptada", "Firmada", "Convertida"].includes(c.estado)).length
  const rechazadas = cotizaciones.filter((c) => c.estado === "Rechazada").length
  const tasaConversion = total > 0 ? ((aceptadas / total) * 100).toFixed(1) : "0"

  const valorTotalCotizado = cotizaciones.reduce((sum, c) => sum + (c.desglose?.costoTotal || 0), 0)
  const valorAceptado = cotizaciones
    .filter((c) => ["Aceptada", "Firmada", "Convertida"].includes(c.estado))
    .reduce((sum, c) => sum + (c.desglose?.costoTotal || 0), 0)
  const valorPipeline = cotizaciones
    .filter((c) => ["Enviada", "En revisión", "Enviada a Firma"].includes(c.estado))
    .reduce((sum, c) => sum + (c.desglose?.costoTotal || 0), 0)

  // By project type
  const byType = cotizaciones.reduce(
    (acc, c) => {
      const tipo = c.tipoProyecto
      if (!acc[tipo]) {
        acc[tipo] = { total: 0, aceptadas: 0, valorTotal: 0, valorAceptado: 0 }
      }
      acc[tipo].total++
      acc[tipo].valorTotal += c.desglose?.costoTotal || 0
      if (["Aceptada", "Firmada", "Convertida"].includes(c.estado)) {
        acc[tipo].aceptadas++
        acc[tipo].valorAceptado += c.desglose?.costoTotal || 0
      }
      return acc
    },
    {} as Record<string, { total: number; aceptadas: number; valorTotal: number; valorAceptado: number }>,
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <p>Cargando reportes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reportes de Cotizaciones</h2>
        <p className="text-muted-foreground">Análisis y métricas de desempeño comercial</p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cotizaciones</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
              <p className="text-2xl font-bold">{tasaConversion}%</p>
              <p className="text-xs text-muted-foreground">
                {aceptadas}/{total} aceptadas
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Aceptado</p>
              <p className="text-2xl font-bold">${(valorAceptado / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">${valorAceptado.toLocaleString("es-MX")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pipeline Activo</p>
              <p className="text-2xl font-bold">${(valorPipeline / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">{enviadas} en proceso</p>
            </div>
          </div>
        </Card>
      </div>

      {/* By Project Type */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">Desempeño por Tipo de Proyecto</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(byType).map(([tipo, stats]) => {
            const tasaTipo = ((stats.aceptadas / stats.total) * 100).toFixed(0)
            return (
              <div key={tipo} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{tipo}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.aceptadas}/{stats.total} aceptadas ({tasaTipo}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${(stats.valorAceptado / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">de ${(stats.valorTotal / 1000).toFixed(0)}K</p>
                </div>
                <div className="w-32">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(stats.aceptadas / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Additional stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Valor Promedio</h4>
          <p className="text-3xl font-bold text-purple-600">
            ${(valorTotalCotizado / (total || 1) / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-muted-foreground mt-1">Por cotización</p>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-3">Rechazadas</h4>
          <p className="text-3xl font-bold text-red-600">{rechazadas}</p>
          <p className="text-sm text-muted-foreground mt-1">{((rechazadas / total) * 100).toFixed(0)}% del total</p>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-3">En Proceso</h4>
          <p className="text-3xl font-bold text-blue-600">{enviadas}</p>
          <p className="text-sm text-muted-foreground mt-1">Esperando respuesta</p>
        </Card>
      </div>
    </div>
  )
}
