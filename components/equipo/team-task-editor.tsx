"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createTeamTask, updateTeamTask, getTeamTaskById, type TeamTask } from "@/lib/api/team-tasks-api"
import { getProjects } from "@/lib/api/projects-api"
import { getUsers, type User } from "@/lib/api/users-api"
import { useUser } from "@/hooks/use-user"
import type { TeamTaskStatus, TeamTaskPriority, TeamTaskCategory } from "@/types/team-task"
import { TEAM_TASK_CATEGORIES } from "@/types/team-task"
import { Loader2 } from "lucide-react"

interface TeamTaskEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: TeamTask | null
  onSuccess?: () => void
}

export function TeamTaskEditor({ open, onOpenChange, task, onSuccess }: TeamTaskEditorProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Array<{ id: string; name: string; clientName?: string }>>([])
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Desarrollo" as TeamTaskCategory,
    customCategory: "",
    status: "pending" as TeamTaskStatus,
    priority: "medium" as TeamTaskPriority,
    assignee: "",
    projectId: "",
    dueDate: "",
    estimatedHours: "",
    comentarios: "",
  })

  // Cargar proyectos y usuarios
  useEffect(() => {
    if (open) {
      loadProjects()
      loadUsers()
    }
  }, [open])

  const loadProjects = async () => {
    try {
      const projectsList = await getProjects()
      setProjects(projectsList.map(p => ({
        id: p.id,
        name: p.name,
        clientName: p.clientName,
      })))
    } catch (error: any) {
      console.error('[TeamTaskEditor] Error loading projects:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const usersList = await getUsers()
      setUsers(usersList)
    } catch (error: any) {
      console.error('[TeamTaskEditor] Error loading users:', error)
    }
  }

  // Cargar datos de la tarea si está editando
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category || "Desarrollo",
        customCategory: task.customCategory || "",
        status: task.status || "pending",
        priority: task.priority || "medium",
        assignee: task.assignee || "",
        projectId: task.projectId || "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
        estimatedHours: task.estimatedHours?.toString() || "",
        comentarios: task.comentarios || "",
      })
    } else {
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "Desarrollo",
        customCategory: "",
        status: "pending",
        priority: "medium",
        assignee: user?.email || "",
        projectId: "",
        dueDate: "",
        estimatedHours: "",
        comentarios: "",
      })
    }
  }, [task, open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        customCategory: formData.category === 'Otra' ? (formData.customCategory.trim() || formData.title.trim()) : undefined,
        status: formData.status,
        priority: formData.priority,
        assignee: formData.assignee.trim() || undefined,
        projectId: formData.projectId.trim() || undefined,
        projectName: formData.projectId ? projects.find(p => p.id === formData.projectId)?.name : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        comentarios: formData.comentarios.trim() || undefined,
        createdBy: user?.email || 'unknown',
      }

      if (task) {
        await updateTeamTask(task.id, taskData)
        toast({
          title: "✅ Tarea actualizada",
          description: "Los cambios se han guardado correctamente",
        })
      } else {
        await createTeamTask(taskData)
        toast({
          title: "✅ Tarea creada",
          description: "La tarea se ha creado correctamente",
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('[TeamTaskEditor] Error:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la tarea",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedProject = projects.find(p => p.id === formData.projectId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
          <DialogDescription>
            {task ? "Modifica los detalles de la tarea" : "Crea una nueva tarea del equipo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título de la tarea"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada de la tarea"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as TeamTaskCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_TASK_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.category === 'Otra' && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">Categoría Personalizada *</Label>
                <Input
                  id="customCategory"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  placeholder="Ingresa la categoría"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TeamTaskStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in-progress">En Progreso</SelectItem>
                  <SelectItem value="review">En Revisión</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TeamTaskPriority })}
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
                onValueChange={(value) => setFormData({ ...formData, assignee: value === 'unassigned' ? '' : value })}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Selecciona un responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {users.map((member) => (
                    <SelectItem key={member.email} value={member.email}>
                      {member.displayName} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Proyecto (opcional)</Label>
              <Select
                value={formData.projectId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}{project.clientName ? ` (${project.clientName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha Límite</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios / Notas</Label>
            <Textarea
              id="comentarios"
              name="comentarios"
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              placeholder="Comentarios y notas adicionales"
              rows={3}
            />
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
                task ? "Actualizar" : "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

