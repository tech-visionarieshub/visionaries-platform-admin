"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createFeature, updateFeature, getFeatures, type Feature } from "@/lib/api/features-api"
import { getProjectById } from "@/lib/api/projects-api"
import { getProjectTeam, type TeamMember } from "@/lib/api/project-team-api"
import type { FeatureStatus, FeaturePriority } from "@/types/feature"
import { Loader2 } from "lucide-react"

interface FeatureEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  feature?: Feature | null
  onSuccess?: () => void
}

export function FeatureEditor({ open, onOpenChange, projectId, feature, onSuccess }: FeatureEditorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [existingEpics, setExistingEpics] = useState<string[]>([])
  const [projectName, setProjectName] = useState<string>("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [formData, setFormData] = useState({
    epicTitle: "",
    title: "",
    description: "",
    criteriosAceptacion: "",
    comentarios: "",
    tipo: "Funcionalidad" as "Funcionalidad" | "QA" | "Bug" | undefined,
    categoria: "Funcionalidad" as "Funcionalidad" | "QA" | "Bugs Generales" | "Otra" | undefined,
    status: "backlog" as FeatureStatus,
    priority: "medium" as FeaturePriority,
    assignee: "",
    estimatedHours: "",
    actualHours: "",
    storyPoints: "",
    sprint: "",
  })

  // Cargar epics existentes, nombre del proyecto y miembros del equipo
  useEffect(() => {
    if (open && projectId) {
      loadEpics()
      loadProjectName()
      loadTeamMembers()
    }
  }, [open, projectId])

  const loadProjectName = async () => {
    try {
      const project = await getProjectById(projectId)
      if (project) {
        setProjectName(project.name)
      }
    } catch (error) {
      console.error('[FeatureEditor] Error loading project name:', error)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const members = await getProjectTeam(projectId)
      setTeamMembers(members)
    } catch (error) {
      console.error('[FeatureEditor] Error loading team members:', error)
    }
  }

  // Cargar datos de la funcionalidad si está editando
  useEffect(() => {
    if (feature) {
      setFormData({
        epicTitle: feature.epicTitle || "",
        title: feature.title || "",
        description: feature.description || "",
        criteriosAceptacion: feature.criteriosAceptacion || "",
        comentarios: feature.comentarios || "",
        tipo: feature.tipo || "Funcionalidad",
        categoria: feature.categoria || "Funcionalidad",
        status: feature.status || "backlog",
        priority: feature.priority || "medium",
        assignee: feature.assignee || "",
        estimatedHours: feature.estimatedHours?.toString() || "",
        actualHours: feature.actualHours?.toString() || "",
        storyPoints: feature.storyPoints?.toString() || "",
        sprint: feature.sprint || "",
      })
    } else {
      // Reset form
      setFormData({
        epicTitle: "",
        title: "",
        description: "",
        criteriosAceptacion: "",
        comentarios: "",
        tipo: "Funcionalidad",
        categoria: "Funcionalidad",
        status: "backlog",
        priority: "medium",
        assignee: "",
        estimatedHours: "",
        actualHours: "",
        storyPoints: "",
        sprint: "",
      })
    }
  }, [feature, open])

  const loadEpics = async () => {
    try {
      const features = await getFeatures(projectId)
      const epics = Array.from(new Set(features.map(f => f.epicTitle))).sort()
      setExistingEpics(epics)
    } catch (error) {
      console.error('[FeatureEditor] Error loading epics:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.epicTitle.trim()) {
      toast({
        title: "Error",
        description: "El Epic es requerido",
        variant: "destructive",
      })
      return
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const featureData = {
        epicTitle: formData.epicTitle.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        criteriosAceptacion: formData.criteriosAceptacion.trim() || undefined,
        comentarios: formData.comentarios.trim() || undefined,
        tipo: formData.tipo || undefined,
        categoria: formData.categoria || undefined,
        status: formData.status,
        priority: formData.priority,
        assignee: formData.assignee.trim() || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        actualHours: formData.actualHours ? parseFloat(formData.actualHours) : undefined,
        storyPoints: formData.storyPoints ? parseFloat(formData.storyPoints) : undefined,
        sprint: formData.sprint.trim() || undefined,
      }

      if (feature) {
        await updateFeature(projectId, feature.id, featureData)
        toast({
          title: "✅ Funcionalidad actualizada",
          description: "Los cambios se han guardado correctamente",
        })
      } else {
        await createFeature(projectId, featureData)
        toast({
          title: "✅ Funcionalidad creada",
          description: "La funcionalidad se ha creado correctamente",
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('[FeatureEditor] Error:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la funcionalidad",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{feature ? "Editar Funcionalidad" : "Nueva Funcionalidad"}</DialogTitle>
          <DialogDescription>
            {feature ? "Modifica los detalles de la funcionalidad" : "Crea una nueva funcionalidad para el proyecto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="epicTitle">Epic *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.epicTitle}
                onValueChange={(value) => setFormData({ ...formData, epicTitle: value })}
              >
                <SelectTrigger id="epicTitle" className="flex-1">
                  <SelectValue placeholder="Seleccionar o escribir Epic" />
                </SelectTrigger>
                <SelectContent>
                  {existingEpics.map(epic => (
                    <SelectItem key={epic} value={epic}>{epic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="O escribir nuevo Epic"
                value={formData.epicTitle}
                onChange={(e) => setFormData({ ...formData, epicTitle: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título de la funcionalidad"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada de la funcionalidad"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="criteriosAceptacion">Criterios de Aceptación</Label>
            <Textarea
              id="criteriosAceptacion"
              value={formData.criteriosAceptacion}
              onChange={(e) => setFormData({ ...formData, criteriosAceptacion: e.target.value })}
              placeholder="Criterios de aceptación que se copiarán automáticamente a la tarea QA cuando se complete"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Estos criterios se copiarán automáticamente a la tarea QA cuando la funcionalidad se marque como completada
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios</Label>
            <Textarea
              id="comentarios"
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              placeholder="Comentarios y notas que se copiarán automáticamente a la tarea QA"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Estos comentarios se copiarán automáticamente a la tarea QA cuando la funcionalidad se marque como completada
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo || "Funcionalidad"}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as "Funcionalidad" | "QA" | "Bug" })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funcionalidad">Funcionalidad</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="Bug">Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={formData.categoria || "Funcionalidad"}
                onValueChange={(value) => setFormData({ ...formData, categoria: value as "Funcionalidad" | "QA" | "Bugs Generales" | "Otra" })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funcionalidad">Funcionalidad</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="Bugs Generales">Bugs Generales</SelectItem>
                  <SelectItem value="Otra">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as FeatureStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as FeaturePriority })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Responsable</Label>
              <Select
                value={formData.assignee || 'unassigned'}
                onValueChange={(value) => setFormData({ ...formData, assignee: value === 'unassigned' ? undefined : value })}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Selecciona un responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.email} value={member.email}>
                      {member.displayName} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint">Sprint</Label>
              <Input
                id="sprint"
                value={formData.sprint}
                onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                placeholder="Sprint 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualHours">Horas Reales</Label>
              <Input
                id="actualHours"
                type="number"
                min="0"
                step="0.5"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                value={formData.storyPoints}
                onChange={(e) => setFormData({ ...formData, storyPoints: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                feature ? "Actualizar" : "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

