"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Cotizacion = {
  id: string
  titulo: string
  clienteId: string
  clienteNombre: string
  desglose: {
    costoTotal: number
    horasTotales: number
    meses: number
  }
}

type ConvertToProjectDialogProps = {
  cotizacion: Cotizacion
  open: boolean
  onOpenChange: (open: boolean) => void
  showSignatureWarning?: boolean
}

export function ConvertToProjectDialog({
  cotizacion,
  open,
  onOpenChange,
  showSignatureWarning = false,
}: ConvertToProjectDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: cotizacion.titulo,
    description: "",
    startDate: new Date(),
    responsible: "",
  })

  const estimatedEndDate = new Date(formData.startDate)
  estimatedEndDate.setMonth(estimatedEndDate.getMonth() + cotizacion.desglose.meses)

  const handleConvert = async () => {
    setLoading(true)

    // Simular creación del proyecto
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Aquí se crearía el proyecto en la base de datos
    const newProject = {
      id: `proyecto-${Date.now()}`,
      name: formData.name,
      client: cotizacion.clienteNombre,
      clientId: cotizacion.clienteId,
      status: "En desarrollo" as const,
      progress: 0,
      startDate: format(formData.startDate, "yyyy-MM-dd"),
      endDate: format(estimatedEndDate, "yyyy-MM-dd"),
      responsible: formData.responsible,
      features: 0,
      completedFeatures: 0,
      budget: cotizacion.desglose.costoTotal,
      hoursEstimated: cotizacion.desglose.horasTotales,
      hoursWorked: 0,
      description: formData.description,
      cotizacionId: cotizacion.id,
    }

    console.log("[v0] Proyecto creado:", newProject)

    // Marcar cotización como convertida (esto se haría en la base de datos)

    setLoading(false)
    onOpenChange(false)

    // Redirigir al nuevo proyecto
    router.push(`/projects/${newProject.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convertir Cotización a Proyecto</DialogTitle>
          <DialogDescription>
            Esta cotización será convertida en un proyecto activo. Confirma los detalles del proyecto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showSignatureWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atención</AlertTitle>
              <AlertDescription>
                Esta cotización no tiene contrato firmado. Se recomienda generar y firmar el contrato antes de convertir
                a proyecto.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={cotizacion.clienteNombre} disabled />
            </div>
            <div className="space-y-2">
              <Label>Presupuesto</Label>
              <Input value={`$${cotizacion.desglose.costoTotal.toLocaleString()} MXN`} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proyecto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del proyecto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción breve del proyecto"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fecha de Inicio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.startDate, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha Estimada de Fin</Label>
              <Input value={format(estimatedEndDate, "PPP", { locale: es })} disabled />
              <p className="text-xs text-muted-foreground">Basado en {cotizacion.desglose.meses} meses</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsable *</Label>
            <Input
              id="responsible"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              placeholder="Nombre del responsable del proyecto"
            />
          </div>

          <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
            <h4 className="font-medium">Detalles del Presupuesto</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horas estimadas:</span>
                <span className="font-medium">{cotizacion.desglose.horasTotales}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Presupuesto total:</span>
                <span className="font-medium">${cotizacion.desglose.costoTotal.toLocaleString()} MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duración estimada:</span>
                <span className="font-medium">{cotizacion.desglose.meses} meses</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConvert} disabled={loading || !formData.name || !formData.responsible}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Proyecto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
