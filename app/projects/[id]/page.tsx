import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { mockProjects } from "@/lib/mock-data/projects"
import { getCotizaciones } from "@/lib/mock-data/cotizaciones"
import { Badge } from "@/components/ui/badge"
import { FileText, TrendingUp, TrendingDown, CheckCircle2, Circle } from "lucide-react"
import Link from "next/link"

const project = mockProjects[0]

const cotizaciones = getCotizaciones()
const cotizacion = project.cotizacionId ? cotizaciones.find((c) => c.id === project.cotizacionId) : null

const budgetVariance = cotizacion
  ? ((project.budget - (cotizacion.desglose?.costoTotal || 0)) / (cotizacion.desglose?.costoTotal || 1)) * 100
  : 0

const hoursVariance = cotizacion
  ? ((project.hoursWorked - (cotizacion.desglose?.horasTotales || 0)) / (cotizacion.desglose?.horasTotales || 1)) * 100
  : 0

export default function ProjectSummaryPage() {
  return (
    <div className="space-y-6">
      {cotizacion && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Proyecto originado de cotización</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Este proyecto fue convertido desde la cotización{" "}
                  <Link
                    href={`/cotizaciones/detalle/${cotizacion.id}`}
                    className="font-medium underline hover:text-blue-900"
                  >
                    {cotizacion.titulo}
                  </Link>
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="text-xs text-blue-600">Presupuesto cotizado</p>
                    <p className="text-sm font-semibold text-blue-900">
                      ${(cotizacion.desglose?.costoTotal || 0).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Horas estimadas</p>
                    <p className="text-sm font-semibold text-blue-900">{cotizacion.desglose?.horasTotales || 0}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Variación presupuesto</p>
                    <div className="flex items-center gap-1">
                      {budgetVariance > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                      )}
                      <p className={`text-sm font-semibold ${budgetVariance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {Math.abs(budgetVariance).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Variación horas</p>
                    <div className="flex items-center gap-1">
                      {hoursVariance > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                      )}
                      <p className={`text-sm font-semibold ${hoursVariance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {Math.abs(hoursVariance).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Badge variant="secondary">Convertido</Badge>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold text-lg text-[#0E0734] mb-4">Estado de Funcionalidades</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#95C900]" />
                <div>
                  <p className="font-semibold text-2xl text-[#0E0734]">{project.completedFeatures}</p>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">de {project.features} totales</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((project.completedFeatures / project.features) * 100).toFixed(0)}% progreso
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Circle className="h-5 w-5 text-[#4BBAFF]" />
                <div>
                  <p className="font-semibold text-2xl text-[#0E0734]">
                    {project.features - project.completedFeatures}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
              <StatusBadge variant="info">En progreso</StatusBadge>
            </div>

            {cotizacion && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Alcance de la cotización:</p>
                <div className="space-y-1">
                  {cotizacion.alcance?.funcionalidades?.slice(0, 3).map((func, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#95C900] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{func.nombre}</p>
                    </div>
                  ))}
                  {(cotizacion.alcance?.funcionalidades?.length || 0) > 3 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{(cotizacion.alcance?.funcionalidades?.length || 0) - 3} funcionalidades más
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg text-[#0E0734] mb-4">Timeline y Presupuesto</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Inicio del proyecto</p>
                <StatusBadge variant="success">Iniciado</StatusBadge>
              </div>
              <p className="text-lg font-semibold text-[#0E0734]">
                {new Date(project.startDate).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Fecha de entrega</p>
                <StatusBadge variant={project.status === "Finalizado" ? "success" : "warning"}>
                  {project.status === "Finalizado" ? "Entregado" : "En curso"}
                </StatusBadge>
              </div>
              <p className="text-lg font-semibold text-[#0E0734]">
                {new Date(project.endDate).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Presupuesto</p>
                  <p className="text-lg font-semibold text-[#0E0734]">${project.budget.toLocaleString("es-MX")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Horas trabajadas</p>
                  <p className="text-lg font-semibold text-[#0E0734]">
                    {project.hoursWorked} / {project.hoursEstimated}h
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progreso</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#95C900] transition-all" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
