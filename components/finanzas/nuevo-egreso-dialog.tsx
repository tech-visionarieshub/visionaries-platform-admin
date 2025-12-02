"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createEgreso, getPreciosPorHora, type Egreso, type PrecioPorHora } from "@/lib/api/finanzas-api"
import { getUsers, type User } from "@/lib/api/users-api"
import { getTeamTasks } from "@/lib/api/team-tasks-api"
import { getFeatures } from "@/lib/api/features-api"
import { getProjects } from "@/lib/api/projects-api"
import type { TeamTask } from "@/types/team-task"
import type { Feature } from "@/types/feature"
import type { Project } from "@/lib/mock-data/projects"

interface NuevoEgresoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// Función para obtener mes actual en formato "Enero 2025"
function getMesActual(): string {
  const ahora = new Date()
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`
}

export function NuevoEgresoDialog({ open, onOpenChange, onSuccess }: NuevoEgresoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [precios, setPrecios] = useState<PrecioPorHora[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [teamTasks, setTeamTasks] = useState<TeamTask[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  const [formData, setFormData] = useState({
    personaEmail: "",
    personaNombre: "",
    tipoTarea: "" as "" | "team-task" | "feature",
    proyectoId: "",
    tareaId: "",
    featureId: "",
    horas: 0,
    precioPorHora: 0,
    aplicarIva: false,
    concepto: "",
  })

  useEffect(() => {
    if (open) {
      loadInitialData()
      // Resetear formulario
      setFormData({
        personaEmail: "",
        personaNombre: "",
        tipoTarea: "",
        proyectoId: "",
        tareaId: "",
        featureId: "",
        horas: 0,
        precioPorHora: 0,
        aplicarIva: false,
        concepto: "",
      })
    }
  }, [open])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [usersData, preciosData, projectsData] = await Promise.all([
        getUsers(),
        getPreciosPorHora(),
        getProjects(),
      ])
      setUsers(usersData)
      setPrecios(preciosData)
      setProjects(projectsData)
    } catch (err: any) {
      console.error('Error loading initial data:', err)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const loadTeamTasks = async () => {
    if (!formData.personaEmail) return
    
    try {
      setLoadingTasks(true)
      const tasks = await getTeamTasks({ 
        status: 'completed',
        assignee: formData.personaEmail 
      })
      setTeamTasks(tasks)
    } catch (err: any) {
      console.error('Error loading team tasks:', err)
      toast.error('Error al cargar tareas del equipo')
    } finally {
      setLoadingTasks(false)
    }
  }

  const loadFeatures = async () => {
    if (!formData.proyectoId) return
    
    try {
      setLoadingTasks(true)
      const allFeatures = await getFeatures(formData.proyectoId)
      // Filtrar solo completadas
      const completedFeatures = allFeatures.filter(
        f => f.status === 'done' || f.status === 'completed'
      )
      setFeatures(completedFeatures)
    } catch (err: any) {
      console.error('Error loading features:', err)
      toast.error('Error al cargar funcionalidades')
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    if (formData.tipoTarea === 'team-task' && formData.personaEmail) {
      loadTeamTasks()
    }
  }, [formData.tipoTarea, formData.personaEmail])

  useEffect(() => {
    if (formData.tipoTarea === 'feature' && formData.proyectoId) {
      loadFeatures()
    }
  }, [formData.tipoTarea, formData.proyectoId])

  const handlePersonaChange = (email: string) => {
    const user = users.find(u => u.email === email)
    const precio = precios.find(p => p.personaEmail === email)
    
    setFormData({
      ...formData,
      personaEmail: email,
      personaNombre: user?.displayName || email,
      precioPorHora: precio?.precioPorHora || 0,
    })
  }

  const handleTipoTareaChange = (tipo: "" | "team-task" | "feature") => {
    setFormData({
      ...formData,
      tipoTarea: tipo,
      proyectoId: "",
      tareaId: "",
      featureId: "",
      concepto: "",
    })
    setTeamTasks([])
    setFeatures([])
  }

  const handleProyectoChange = (projectId: string) => {
    setFormData({
      ...formData,
      proyectoId: projectId,
      featureId: "",
      concepto: "",
    })
    setFeatures([])
  }

  const handleTareaChange = (tareaId: string) => {
    if (formData.tipoTarea === 'team-task') {
      const task = teamTasks.find(t => t.id === tareaId)
      setFormData({
        ...formData,
        tareaId: tareaId,
        concepto: task ? `${formData.personaNombre} - ${task.title}` : "",
        horas: task?.actualHours || 0,
      })
    } else if (formData.tipoTarea === 'feature') {
      const feature = features.find(f => f.id === tareaId)
      setFormData({
        ...formData,
        featureId: tareaId,
        concepto: feature ? `${formData.personaNombre} - ${feature.name}` : "",
        horas: feature?.actualHours || 0,
      })
    }
  }

  // Calcular subtotal, IVA y total
  const calculos = {
    subtotal: formData.horas * formData.precioPorHora,
    iva: formData.aplicarIva ? (formData.horas * formData.precioPorHora) * 0.16 : 0,
    total: formData.aplicarIva 
      ? (formData.horas * formData.precioPorHora) * 1.16 
      : formData.horas * formData.precioPorHora,
  }

  const handleSave = async () => {
    if (!formData.personaEmail) {
      toast.error("Selecciona una persona")
      return
    }
    if (!formData.tipoTarea) {
      toast.error("Selecciona el tipo de tarea")
      return
    }
    if (formData.tipoTarea === 'feature' && !formData.proyectoId) {
      toast.error("Selecciona un proyecto")
      return
    }
    if (!formData.tareaId && !formData.featureId) {
      toast.error("Selecciona una tarea o funcionalidad")
      return
    }
    if (formData.horas <= 0) {
      toast.error("Las horas deben ser mayores a 0")
      return
    }
    if (formData.precioPorHora <= 0) {
      toast.error("El precio por hora debe ser mayor a 0")
      return
    }

    setSaving(true)
    try {
      const mesActual = getMesActual()
      
      const egresoData: Omit<Egreso, 'id'> = {
        lineaNegocio: "",
        categoria: "",
        empresa: "",
        equipo: formData.personaNombre,
        concepto: formData.concepto || `${formData.personaNombre} - Tarea`,
        subtotal: calculos.subtotal,
        iva: calculos.iva,
        total: calculos.total,
        tipo: "Variable",
        mes: mesActual,
        status: "Pendiente",
        tipoEgreso: "basadoEnHoras",
        // Campos nuevos
        persona: formData.personaNombre,
        tarea: formData.tipoTarea === 'team-task' 
          ? teamTasks.find(t => t.id === formData.tareaId)?.title || ""
          : features.find(f => f.id === formData.featureId)?.name || "",
        horas: formData.horas,
        precioPorHora: formData.precioPorHora,
        tareaId: formData.tipoTarea === 'team-task' ? formData.tareaId : undefined,
        featureId: formData.tipoTarea === 'feature' ? formData.featureId : undefined,
        tareaTipo: formData.tipoTarea,
        aplicarIva: formData.aplicarIva,
        proyectoIds: formData.proyectoId ? [formData.proyectoId] : undefined,
      }

      await createEgreso(egresoData)
      toast.success("Egreso creado exitosamente")
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error('Error creating egreso:', error)
      toast.error(error.message || "Error al crear el egreso")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Egreso del Mes en Curso</DialogTitle>
          <DialogDescription>
            Crea un egreso basado en horas trabajadas por un miembro del equipo
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="personaEmail">Persona <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.personaEmail}
                  onValueChange={handlePersonaChange}
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

            <div className="space-y-2">
              <Label htmlFor="tipoTarea">Tipo de Tarea <span className="text-red-500">*</span></Label>
              <Select
                value={formData.tipoTarea}
                onValueChange={handleTipoTareaChange}
              >
                <SelectTrigger id="tipoTarea">
                  <SelectValue placeholder="Selecciona el tipo de tarea" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team-task">Tarea del Equipo</SelectItem>
                  <SelectItem value="feature">Funcionalidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipoTarea === 'feature' && (
              <div className="space-y-2">
                <Label htmlFor="proyectoId">Proyecto <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.proyectoId}
                  onValueChange={handleProyectoChange}
                  disabled={loadingTasks}
                >
                  <SelectTrigger id="proyectoId">
                    <SelectValue placeholder="Selecciona un proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} {project.client ? `(${project.client})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tarea">
                {formData.tipoTarea === 'team-task' ? 'Tarea del Equipo' : 'Funcionalidad'} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tipoTarea === 'team-task' ? formData.tareaId : formData.featureId}
                onValueChange={handleTareaChange}
                disabled={loadingTasks || (formData.tipoTarea === 'feature' && !formData.proyectoId)}
              >
                <SelectTrigger id="tarea">
                  <SelectValue placeholder={
                    loadingTasks 
                      ? "Cargando..." 
                      : formData.tipoTarea === 'feature' && !formData.proyectoId
                        ? "Selecciona un proyecto primero"
                        : `Selecciona una ${formData.tipoTarea === 'team-task' ? 'tarea' : 'funcionalidad'}`
                  } />
                </SelectTrigger>
                <SelectContent>
                  {formData.tipoTarea === 'team-task' ? (
                    teamTasks.length === 0 ? (
                      <SelectItem value="" disabled>
                        {formData.personaEmail ? "No hay tareas completadas" : "Selecciona una persona primero"}
                      </SelectItem>
                    ) : (
                      teamTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))
                    )
                  ) : (
                    features.length === 0 ? (
                      <SelectItem value="" disabled>
                        {formData.proyectoId ? "No hay funcionalidades completadas" : "Selecciona un proyecto primero"}
                      </SelectItem>
                    ) : (
                      features.map((feature) => (
                        <SelectItem key={feature.id} value={feature.id}>
                          {feature.name}
                        </SelectItem>
                      ))
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horas">Horas <span className="text-red-500">*</span></Label>
                <Input
                  id="horas"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.horas || ""}
                  onChange={(e) => setFormData({ ...formData, horas: Number(e.target.value) })}
                  placeholder="0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concepto">Concepto</Label>
                <Input
                  id="concepto"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  placeholder="Auto-generado o personalizado"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aplicarIva"
                  checked={formData.aplicarIva}
                  onCheckedChange={(checked) => setFormData({ ...formData, aplicarIva: checked === true })}
                />
                <Label htmlFor="aplicarIva" className="cursor-pointer">
                  Aplicar IVA (16%)
                </Label>
              </div>
            </div>

            {/* Resumen de cálculos */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${calculos.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {formData.aplicarIva && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (16%):</span>
                  <span className="font-medium">${calculos.iva.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${calculos.total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Crear Egreso"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

