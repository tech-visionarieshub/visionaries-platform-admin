"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { updateEgreso, getClientes, type Egreso, type Cliente } from "@/lib/api/finanzas-api"

interface EditarEgresoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  egreso: Egreso | null
  onSuccess: () => void
}

export function EditarEgresoDialog({ open, onOpenChange, egreso, onSuccess }: EditarEgresoDialogProps) {
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  const [formData, setFormData] = useState({
    empresa: "",
    clienteId: "",
    concepto: "",
    subtotal: 0,
    iva: 0,
    total: 0,
    aplicarIva: false,
  })

  useEffect(() => {
    if (open && egreso) {
      // Cargar clientes
      loadClientes()
      
      // Inicializar formulario con datos del egreso
      setFormData({
        empresa: egreso.empresa || "",
        clienteId: egreso.clienteId || "",
        concepto: egreso.concepto || "",
        subtotal: egreso.subtotal || 0,
        iva: egreso.iva || 0,
        total: egreso.total || 0,
        aplicarIva: egreso.aplicarIva || false,
      })
    }
  }, [open, egreso])

  const loadClientes = async () => {
    try {
      setLoadingClientes(true)
      const data = await getClientes()
      setClientes(data)
    } catch (err: any) {
      console.error('Error loading clientes:', err)
      toast.error('Error al cargar clientes')
    } finally {
      setLoadingClientes(false)
    }
  }

  const handleAplicarIvaChange = (checked: boolean) => {
    setFormData(prev => {
      const subtotal = prev.subtotal || 0
      const iva = checked ? subtotal * 0.16 : 0
      const total = subtotal + iva
      return {
        ...prev,
        aplicarIva: checked,
        iva,
        total,
      }
    })
  }

  const handleSubtotalChange = (value: string) => {
    const subtotal = parseFloat(value) || 0
    const iva = formData.aplicarIva ? subtotal * 0.16 : 0
    const total = subtotal + iva
    setFormData(prev => ({
      ...prev,
      subtotal,
      iva,
      total,
    }))
  }

  const handleSave = async () => {
    if (!egreso) return

    if (!formData.concepto.trim()) {
      toast.error("El concepto es requerido")
      return
    }

    if (formData.subtotal <= 0) {
      toast.error("El subtotal debe ser mayor a 0")
      return
    }

    setSaving(true)
    try {
      const updates: Partial<Egreso> = {
        empresa: formData.empresa || undefined,
        clienteId: formData.clienteId || undefined,
        concepto: formData.concepto,
        subtotal: formData.subtotal,
        iva: formData.iva,
        total: formData.total,
        aplicarIva: formData.aplicarIva,
      }

      await updateEgreso(egreso.id, updates)
      toast.success("Egreso actualizado exitosamente")
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error("Error updating egreso:", error)
      toast.error(error.message || "Error al actualizar egreso")
    } finally {
      setSaving(false)
    }
  }

  if (!egreso) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Egreso</DialogTitle>
          <DialogDescription>
            Actualiza la información del egreso. Especialmente útil para corregir la empresa cuando no se encuentra automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa / Cliente</Label>
            <Input
              id="empresa"
              value={formData.empresa}
              onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
              placeholder="Nombre de la empresa o cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clienteId">Cliente Vinculado</Label>
            <Select
              value={formData.clienteId || "sin-cliente"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, clienteId: value === "sin-cliente" ? "" : value }))}
              disabled={loadingClientes}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sin-cliente">Sin cliente</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.empresa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concepto">
              Concepto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="concepto"
              value={formData.concepto}
              onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
              placeholder="Descripción del egreso"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">
                Subtotal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                min="0"
                value={formData.subtotal}
                onChange={(e) => handleSubtotalChange(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aplicarIva">Aplicar IVA (16%)</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="aplicarIva"
                  checked={formData.aplicarIva}
                  onCheckedChange={handleAplicarIvaChange}
                />
                <Label htmlFor="aplicarIva" className="cursor-pointer">
                  Calcular IVA automáticamente
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iva">IVA</Label>
              <Input
                id="iva"
                type="number"
                step="0.01"
                min="0"
                value={formData.iva.toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                min="0"
                value={formData.total.toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

