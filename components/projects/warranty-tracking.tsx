"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { AlertCircle, CheckCircle2, Clock, MessageSquare, FileText, Send, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const warrantyIssues = [
  {
    id: 1,
    title: "Error en módulo de pagos",
    description: "El sistema no procesa pagos con tarjetas Visa",
    status: "Resuelto",
    priority: "Alta",
    reportedDate: "2025-05-05",
    resolvedDate: "2025-05-06",
    reportedBy: "Cliente - TechStore SA",
    assignedTo: "Carlos Mendoza",
  },
  {
    id: 2,
    title: "Lentitud en carga de productos",
    description: "El catálogo tarda más de 5 segundos en cargar",
    status: "En progreso",
    priority: "Media",
    reportedDate: "2025-05-08",
    resolvedDate: null,
    reportedBy: "Cliente - TechStore SA",
    assignedTo: "Ana García",
  },
  {
    id: 3,
    title: "Bug en carrito de compras",
    description: "Los productos duplicados no se suman correctamente",
    status: "Pendiente",
    priority: "Baja",
    reportedDate: "2025-05-10",
    resolvedDate: null,
    reportedBy: "QA Interno",
    assignedTo: "Luis Torres",
  },
]

export function WarrantyTracking() {
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false)

  const warrantyStartDate = new Date("2025-04-30")
  const warrantyEndDate = new Date("2025-05-30")
  const today = new Date()
  const daysRemaining = Math.ceil((warrantyEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0
  const isExpired = daysRemaining <= 0

  const handleReportIncident = () => {
    toast.success("Incidencia reportada y asignada automáticamente")
    setShowReportDialog(false)
  }

  const handleGenerateAcceptance = () => {
    toast.success("Carta de aceptación generada y lista para enviar")
    setShowAcceptanceDialog(false)
  }

  return (
    <div className="space-y-4">
      {/* Warranty Status Alert */}
      {isExpiringSoon && (
        <Card className="p-3 bg-[#F59E0B]/10 border-[#F59E0B]/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            <p className="text-sm font-medium text-[#F59E0B]">
              La garantía vence en {daysRemaining} días. Prepara la carta de aceptación y pagos finales.
            </p>
          </div>
        </Card>
      )}

      {isExpired && (
        <Card className="p-3 bg-[#E02814]/10 border-[#E02814]/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#E02814]" />
            <p className="text-sm font-medium text-[#E02814]">
              El período de garantía ha finalizado. Envía la carta de aceptación al cliente.
            </p>
          </div>
        </Card>
      )}

      {/* Warranty Info */}
      <Card className="p-4 bg-gradient-to-r from-[#4514F9]/5 to-[#4BBAFF]/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#0E0734] mb-1">Período de Garantía</h3>
            <p className="text-sm text-muted-foreground">
              {warrantyStartDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} -{" "}
              {warrantyEndDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${isExpired ? "text-[#E02814]" : isExpiringSoon ? "text-[#F59E0B]" : "text-[#4514F9]"}`}
            >
              {isExpired ? "Vencida" : `${daysRemaining}d`}
            </div>
            <p className="text-xs text-muted-foreground">restantes</p>
          </div>
        </div>
      </Card>

      {/* Issues Summary */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-[#95C900]/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-[#95C900]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0E0734]">
                {warrantyIssues.filter((i) => i.status === "Resuelto").length}
              </p>
              <p className="text-xs text-muted-foreground">Resueltos</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-[#4BBAFF]/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-[#4BBAFF]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0E0734]">
                {warrantyIssues.filter((i) => i.status === "En progreso").length}
              </p>
              <p className="text-xs text-muted-foreground">En Progreso</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-[#F59E0B]/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0E0734]">
                {warrantyIssues.filter((i) => i.status === "Pendiente").length}
              </p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#4514F9] hover:bg-[#3810C7]">
              <AlertCircle className="h-4 w-4 mr-2" />
              Reportar Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reportar Nueva Incidencia</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Título</label>
                <Input placeholder="Describe el problema brevemente" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descripción</label>
                <Textarea placeholder="Detalla el problema y pasos para reproducirlo" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Prioridad</label>
                  <Select defaultValue="media">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Reportado por</label>
                  <Select defaultValue="cliente">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="qa">QA Interno</SelectItem>
                      <SelectItem value="equipo">Equipo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleReportIncident} className="w-full bg-[#4514F9] hover:bg-[#3810C7]">
                Reportar y Asignar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAcceptanceDialog} onOpenChange={setShowAcceptanceDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Carta de Aceptación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generar Carta de Aceptación</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Card className="p-4 bg-gray-50 text-sm">
                <p className="font-semibold mb-2">Vista Previa:</p>
                <p className="text-muted-foreground mb-2">Estimado cliente TechStore SA,</p>
                <p className="text-muted-foreground mb-2">
                  El período de garantía de 30 días para el proyecto "E-commerce TechStore" ha finalizado el{" "}
                  {warrantyEndDate.toLocaleDateString("es-ES")}. Durante este período se atendieron{" "}
                  {warrantyIssues.length} incidencias, todas resueltas satisfactoriamente.
                </p>
                <p className="text-muted-foreground">
                  Adjuntamos la documentación final y solicitamos su firma de aceptación para proceder con el pago
                  final.
                </p>
              </Card>
              <div className="flex gap-2">
                <Button onClick={handleGenerateAcceptance} className="flex-1 bg-[#4514F9] hover:bg-[#3810C7]">
                  <Send className="h-4 w-4 mr-2" />
                  Generar y Enviar
                </Button>
                <Button variant="outline">Descargar PDF</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Issues List */}
      <Card className="p-4">
        <h3 className="font-semibold text-[#0E0734] mb-3">Incidencias Reportadas</h3>
        <div className="space-y-2">
          {warrantyIssues.map((issue) => (
            <div key={issue.id} className="border rounded p-3 hover:bg-gray-50 text-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-[#0E0734]">{issue.title}</h4>
                    <StatusBadge
                      variant={
                        issue.status === "Resuelto" ? "success" : issue.status === "En progreso" ? "info" : "default"
                      }
                    >
                      {issue.status}
                    </StatusBadge>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        issue.priority === "Alta"
                          ? "bg-[#E02814]/10 text-[#E02814]"
                          : issue.priority === "Media"
                            ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {issue.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{issue.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Reportado: {new Date(issue.reportedDate).toLocaleDateString("es-ES")}</span>
                    {issue.resolvedDate && (
                      <span>Resuelto: {new Date(issue.resolvedDate).toLocaleDateString("es-ES")}</span>
                    )}
                    <span>Asignado: {issue.assignedTo}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
