"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, TrendingDown, Clock, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getProjectById } from "@/lib/api/projects-api"
import { getFacturas, getEgresos } from "@/lib/api/finanzas-api"
import { useEffect, useState } from "react"
import type { Project } from "@/lib/mock-data/projects"
import type { Factura, Egreso } from "@/lib/mock-data/finanzas"

export default function ProjectFinancePage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [projectData, facturasData, egresosData] = await Promise.all([
          getProjectById(params.id),
          getFacturas(),
          getEgresos(),
        ])
        setProject(projectData)
        setFacturas(facturasData)
        setEgresos(egresosData)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id])

  if (loading || !project) {
    return <div>Cargando datos del proyecto...</div>
  }

  const projectInvoices = facturas.filter((f) => f.empresa === project.client)
  const projectExpenses = egresos.filter((e) => e.empresa === project.client)

  const totalFacturado = projectInvoices.reduce((sum, f) => sum + f.total, 0)
  const totalPagado = projectInvoices.filter((f) => f.status === "Pagada").reduce((sum, f) => sum + f.total, 0)
  const totalPendiente = projectInvoices
    .filter((f) => f.status === "Pendiente" || f.status === "Vencida")
    .reduce((sum, f) => sum + f.total, 0)

  const totalEgresos = projectExpenses.reduce((sum, e) => sum + e.total, 0)

  const costoHora = 500 // Mock hourly rate
  const costoHorasTrabajadas = project.hoursWorked * costoHora
  const costoTotal = costoHorasTrabajadas + totalEgresos
  const utilidadBruta = totalPagado - costoTotal
  const margenUtilidad = totalPagado > 0 ? ((utilidadBruta / totalPagado) * 100).toFixed(1) : "0.0"
  const rentabilidadProyectada = ((totalFacturado - costoTotal) / project.budget) * 100

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Presupuesto</p>
              <p className="text-2xl font-bold text-[#0E0734]">${project.budget.toLocaleString("es-MX")}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Facturado</p>
              <p className="text-2xl font-bold text-[#0E0734]">${totalFacturado.toLocaleString("es-MX")}</p>
              <p className="text-xs text-muted-foreground mt-1">{projectInvoices.length} factura(s)</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pagado</p>
              <p className="text-2xl font-bold text-green-600">${totalPagado.toLocaleString("es-MX")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {projectInvoices.filter((f) => f.status === "Pagada").length} factura(s)
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Por Cobrar</p>
              <p className="text-2xl font-bold text-orange-600">${totalPendiente.toLocaleString("es-MX")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {projectInvoices.filter((f) => f.status !== "Pagada" && f.status !== "Cancelada").length} pendiente(s)
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Profitability Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold text-lg text-[#0E0734] mb-4">Análisis de Rentabilidad</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-muted-foreground">Presupuesto del Proyecto</span>
              <span className="font-semibold">${project.budget.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-muted-foreground">Horas Trabajadas</span>
              <span className="font-semibold">
                {project.hoursWorked} / {project.hoursEstimated} hrs
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-muted-foreground">Costo por Horas (${costoHora}/hr)</span>
              <span className="font-semibold text-red-600">-${costoHorasTrabajadas.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-muted-foreground">Gastos del Proyecto</span>
              <span className="font-semibold text-red-600">-${totalEgresos.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-muted-foreground">Costo Total</span>
              <span className="font-semibold text-red-600">-${costoTotal.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium">Utilidad Bruta Actual</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${utilidadBruta >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${Math.abs(utilidadBruta).toLocaleString("es-MX")}
                </span>
                {utilidadBruta >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Margen de Utilidad</span>
              <Badge
                variant={Number.parseFloat(margenUtilidad) >= 30 ? "default" : "destructive"}
                className={Number.parseFloat(margenUtilidad) >= 30 ? "bg-green-600" : "bg-red-600"}
              >
                {margenUtilidad}%
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg text-[#0E0734] mb-4">Proyección Financiera</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Rentabilidad Proyectada</p>
              <p className="text-3xl font-bold text-blue-600">{rentabilidadProyectada.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">Basado en facturación total vs presupuesto</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progreso del Proyecto</span>
                <span className="font-semibold">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#4514F9] h-2 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado Financiero:</span>
                <Badge
                  variant={utilidadBruta >= 0 ? "default" : "destructive"}
                  className={utilidadBruta >= 0 ? "bg-green-600" : "bg-red-600"}
                >
                  {utilidadBruta >= 0 ? "Rentable" : "En Pérdida"}
                </Badge>
              </div>
              {totalPendiente > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pendiente de Cobro:</span>
                  <span className="font-semibold text-orange-600">${totalPendiente.toLocaleString("es-MX")}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Invoices List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-[#0E0734]">Facturas del Proyecto</h3>
          <Link href="/finanzas/facturas">
            <Button variant="outline" size="sm">
              Ver todas
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {projectInvoices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay facturas asociadas a este proyecto</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Folio</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Concepto</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Monto</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm font-medium">{invoice.folio}</td>
                    <td className="py-3 px-2 text-sm">{invoice.conceptos}</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {new Date(invoice.fechaEmision).toLocaleDateString("es-MX")}
                    </td>
                    <td className="py-3 px-2 text-sm font-semibold text-right">
                      ${invoice.total.toLocaleString("es-MX")}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        variant={
                          invoice.status === "Pagada"
                            ? "default"
                            : invoice.status === "Pendiente"
                              ? "secondary"
                              : invoice.status === "Cancelada"
                                ? "destructive"
                                : "outline"
                        }
                        className={
                          invoice.status === "Pagada"
                            ? "bg-green-600"
                            : invoice.status === "Vencida"
                              ? "bg-red-600"
                              : ""
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Project Expenses */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-[#0E0734]">Gastos del Proyecto</h3>
          <Link href="/finanzas/egresos">
            <Button variant="outline" size="sm">
              Ver todos
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {projectExpenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay gastos asociados a este proyecto</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Categoría</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Concepto</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Equipo</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Monto</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Badge variant="outline">{expense.categoria}</Badge>
                    </td>
                    <td className="py-3 px-2 text-sm">{expense.concepto}</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{expense.equipo}</td>
                    <td className="py-3 px-2 text-sm font-semibold text-right">
                      ${expense.total.toLocaleString("es-MX")}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        variant={expense.status === "Pagado" ? "default" : "secondary"}
                        className={expense.status === "Pagado" ? "bg-green-600" : ""}
                      >
                        {expense.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
