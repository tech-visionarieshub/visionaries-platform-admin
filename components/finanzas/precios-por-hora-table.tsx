"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { 
  getPreciosPorHora, 
  createPrecioPorHora, 
  updatePrecioPorHora, 
  deletePrecioPorHora,
  type PrecioPorHora 
} from "@/lib/api/finanzas-api"
import { getUsers, type User } from "@/lib/api/users-api"

export function PreciosPorHoraTable() {
  const [precios, setPrecios] = useState<PrecioPorHora[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPrecio, setSelectedPrecio] = useState<PrecioPorHora | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    personaEmail: "",
    personaNombre: "",
    precioPorHora: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [preciosData, usersData] = await Promise.all([
        getPreciosPorHora(),
        getUsers(),
      ])
      setPrecios(preciosData)
      setUsers(usersData)
    } catch (err: any) {
      if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
        return
      }
      console.error('Error loading data:', err)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setSelectedPrecio(null)
    setIsEditing(false)
    setFormData({
      personaEmail: "",
      personaNombre: "",
      precioPorHora: 0,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (precio: PrecioPorHora) => {
    setSelectedPrecio(precio)
    setIsEditing(true)
    setFormData({
      personaEmail: precio.personaEmail,
      personaNombre: precio.personaNombre,
      precioPorHora: precio.precioPorHora,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.personaEmail || !formData.personaNombre || formData.precioPorHora <= 0) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setSaving(true)
    try {
      if (isEditing && selectedPrecio) {
        await updatePrecioPorHora(selectedPrecio.id, formData)
        toast.success("Precio actualizado exitosamente")
      } else {
        await createPrecioPorHora(formData)
        toast.success("Precio creado exitosamente")
      }
      
      // Generar egresos automáticos para tareas y features completadas (tanto al crear como al actualizar)
      try {
        const response = await fetch('/api/egresos/generar-automaticos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personaEmail: formData.personaEmail,
            precioPorHora: formData.precioPorHora,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.creados > 0) {
            toast.success(`${result.creados} egreso(s) generado(s) automáticamente`)
          } else {
            toast.info("No se encontraron tareas o funcionalidades completadas para generar egresos")
          }
        }
      } catch (genError) {
        console.error('Error generando egresos automáticos:', genError)
        // No mostrar error al usuario, solo loguear
      }
      setIsDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('Error saving precio:', error)
      toast.error(error.message || "Error al guardar el precio")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este precio?")) {
      return
    }

    try {
      await deletePrecioPorHora(id)
      toast.success("Precio eliminado exitosamente")
      await loadData()
    } catch (error: any) {
      console.error('Error deleting precio:', error)
      toast.error(error.message || "Error al eliminar el precio")
    }
  }

  const handlePersonaChange = (email: string) => {
    const user = users.find(u => u.email === email)
    setFormData({
      ...formData,
      personaEmail: email,
      personaNombre: user?.displayName || email,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Precios por Hora</h2>
          <p className="text-muted-foreground">Configura los precios por hora de cada miembro del equipo</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Precio
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Precio por Hora</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {precios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No hay precios configurados
                </TableCell>
              </TableRow>
            ) : (
              precios.map((precio) => (
                <TableRow key={precio.id}>
                  <TableCell className="font-medium">{precio.personaNombre}</TableCell>
                  <TableCell>{precio.personaEmail}</TableCell>
                  <TableCell className="text-right">${precio.precioPorHora.toLocaleString("es-MX")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(precio)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(precio.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Precio por Hora" : "Nuevo Precio por Hora"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Actualiza el precio por hora" : "Configura el precio por hora de un miembro del equipo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="personaEmail">Persona <span className="text-red-500">*</span></Label>
              <Select
                value={formData.personaEmail}
                onValueChange={handlePersonaChange}
                disabled={isEditing}
              >
                <SelectTrigger id="personaEmail">
                  <SelectValue placeholder="Selecciona una persona" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.email} value={user.email}>
                      {user.displayName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precioPorHora">Precio por Hora (MXN) <span className="text-red-500">*</span></Label>
              <Input
                id="precioPorHora"
                type="number"
                min="0"
                step="0.01"
                value={formData.precioPorHora || ""}
                onChange={(e) => setFormData({ ...formData, precioPorHora: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Precio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

