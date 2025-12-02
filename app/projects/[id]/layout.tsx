"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { ArrowLeft, Calendar, User, DollarSign, Clock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { getProjectById, updateProject } from "@/lib/api/projects-api"
import { getFeatures } from "@/lib/api/features-api"
import { getClientes } from "@/lib/api/finanzas-api"
import type { Project } from "@/lib/mock-data/projects"
import type { Feature } from "@/types/feature"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

// Helper functions para manejar fechas sin problemas de zona horaria
function formatDateForInput(date: string | Date | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') {
    // Si ya es un string YYYY-MM-DD, usarlo directamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Si tiene hora, extraer solo la fecha
    if (date.includes('T')) {
      return date.split('T')[0];
    }
  }
  // Si es Date, convertir a YYYY-MM-DD en zona horaria local
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date: string | Date | undefined, options: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  let dateObj: Date;
  if (typeof date === 'string') {
    // Si es YYYY-MM-DD, agregar hora del mediodía para evitar problemas de zona horaria
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dateObj = new Date(date + 'T12:00:00');
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }
  return dateObj.toLocaleDateString("es-ES", options);
}

// Usuarios autorizados para acceder a Finanzas
const FINANZAS_AUTHORIZED_EMAILS = [
  'arelyibarra@visionarieshub.com',
  'gabypino@visionarieshub.com'
]

const hasFinanzasAccess = (userEmail: string | undefined): boolean => {
  if (!userEmail) return false
  return FINANZAS_AUTHORIZED_EMAILS.includes(userEmail.toLowerCase())
}

const navItems = [
  { href: "", label: "Resumen", active: true },
  { href: "/backlog", label: "Funcionalidades", active: true },
  { href: "/ai-generator", label: "IA Generator", active: false },
  { href: "/timeline", label: "Cronograma", active: true },
  { href: "/team", label: "Equipo", active: true },
  { href: "/github", label: "GitHub", active: true },
  { href: "/toggl", label: "Horas (Toggl)", active: false },
  { href: "/qa", label: "QA", active: true },
  { href: "/status", label: "Status Cliente", active: true },
  { href: "/calendar", label: "Calendar", active: true },
  { href: "/deliverables", label: "Entregas", active: true },
  { href: "/documentation", label: "Documentación", active: true },
  { href: "/warranty", label: "Garantía", active: true },
  { href: "/finanzas", label: "Finanzas", active: false, requiresFinanzasAccess: true },
]

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<Partial<Project>>({})
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string }>>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()
  const canAccessFinanzas = hasFinanzasAccess(user?.email)

  useEffect(() => {
    async function loadProjectAndFeatures() {
      try {
        const [projectData, featuresData] = await Promise.all([
          getProjectById(resolvedParams.id),
          getFeatures(resolvedParams.id)
        ])
        setProject(projectData)
        setFeatures(featuresData)
      } catch (err) {
        console.error('Error loading project or features:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadProjectAndFeatures()
  }, [resolvedParams.id])
  
  // Calcular suma de horas estimadas
  const totalEstimatedHours = features.reduce((sum, feature) => sum + (feature.estimatedHours || 0), 0)
  
  // Calcular progreso basado en funcionalidades completadas
  const calculatedProgress = features.length > 0
    ? Math.round((features.filter(f => f.status === 'done' || f.status === 'completed').length / features.length) * 100)
    : project?.progress || 0
  
  // Usar el progreso calculado si hay features, sino usar el del proyecto
  const displayProgress = features.length > 0 ? calculatedProgress : (project?.progress || 0)

  useEffect(() => {
    async function loadClientes() {
      if (!showEditDialog) return
      setLoadingClientes(true)
      try {
        const data = await getClientes()
        setClientes(data.map(c => ({ id: c.id, nombre: c.empresa })))
      } catch (err: any) {
        // Si es error de autenticación, no hacer nada (ya redirige)
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          return
        }
        console.error('Error loading clientes:', err)
      } finally {
        setLoadingClientes(false)
      }
    }
    loadClientes()
  }, [showEditDialog])

  const handleEditClick = () => {
    if (project) {
      setEditingProject({
        name: project.name,
        description: project.description,
        status: project.status,
        client: project.client,
        clientId: project.clientId,
        budget: project.budget,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: project.progress,
      })
      setShowEditDialog(true)
    }
  }

  const handleSaveProject = async () => {
    if (!project) return

    setSaving(true)
    try {
      const updated = await updateProject(project.id, editingProject)
      setProject(updated)
      setShowEditDialog(false)
      toast({
        title: "Proyecto actualizado",
        description: "Los cambios se han guardado correctamente.",
      })
    } catch (error: any) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el proyecto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !project) {
    return (
      <div className="space-y-6">
        <p>Cargando proyecto...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Proyectos
        </Button>
      </Link>

      {/* Project Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#0E0734]">{project.name}</h1>
              <StatusBadge variant="info">{project.status}</StatusBadge>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <Button 
            className="bg-[#4514F9] hover:bg-[#3810C7]"
            onClick={handleEditClick}
          >
            Editar Proyecto
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <User className="h-4 w-4" />
              Cliente
            </div>
            <p className="font-semibold text-[#0E0734]">{project.client}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              Fecha de Entrega
            </div>
            <p className="font-semibold text-[#0E0734]">
              {formatDateForDisplay(project.endDate, {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Presupuesto
            </div>
            <p className="font-semibold text-[#0E0734]">${project.budget.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Zap className="h-4 w-4" />
              Horas Estimadas (IA)
            </div>
            <p className="font-semibold text-[#4514F9]">{totalEstimatedHours.toFixed(1)}h</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Progreso
            </div>
            <p className="font-semibold text-[#4514F9]">{displayProgress}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <Progress value={displayProgress} className="h-3" />
        </div>
      </Card>

      {/* Navigation */}
      <Card className="p-2">
        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            // Verificar si requiere acceso a finanzas
            const requiresAccess = (item as any).requiresFinanzasAccess
            const hasAccess = !requiresAccess || canAccessFinanzas

            if (item.active && hasAccess) {
              return (
                <Link
                  key={item.href}
                  href={`/projects/${resolvedParams.id}${item.href}`}
                  className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent whitespace-nowrap transition-colors"
                >
                  {item.label}
                </Link>
              )
            } else {
              return (
                <span
                  key={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap",
                    requiresAccess && !hasAccess
                      ? "text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed"
                      : "text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                  title={requiresAccess && !hasAccess ? "No tienes acceso a esta sección" : "Funcionalidad no disponible"}
                >
                  {item.label}
                </span>
              )
            }
          })}
        </nav>
      </Card>

      {/* Page Content */}
      {children}

      {/* Dialog de Edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Proyecto</DialogTitle>
            <DialogDescription>
              Modifica la información del proyecto. Los cambios se guardarán inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Proyecto</Label>
              <Input
                id="name"
                name="name"
                value={editingProject.name || ''}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                placeholder="Nombre del proyecto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={editingProject.description || ''}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                placeholder="Descripción del proyecto"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente</Label>
                <Select
                  value={editingProject.clientId || ''}
                  onValueChange={(value) => {
                    const cliente = clientes.find(c => c.id === value)
                    setEditingProject({ 
                      ...editingProject, 
                      clientId: value,
                      client: cliente?.nombre || editingProject.client || ''
                    })
                  }}
                  disabled={loadingClientes}
                >
                  <SelectTrigger id="clientId" name="clientId">
                    <SelectValue placeholder={loadingClientes ? "Cargando clientes..." : "Seleccionar cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  name="status"
                  value={editingProject.status || ''}
                  onValueChange={(value) => setEditingProject({ ...editingProject, status: value as Project['status'] })}
                >
                  <SelectTrigger id="status" name="status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En desarrollo">En desarrollo</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="Garantía">Garantía</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Presupuesto</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={editingProject.budget || 0}
                  onChange={(e) => setEditingProject({ ...editingProject, budget: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Progreso (%)</Label>
                <Input
                  id="progress"
                  name="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editingProject.progress || 0}
                  onChange={(e) => setEditingProject({ ...editingProject, progress: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formatDateForInput(editingProject.startDate)}
                  onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Entrega</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formatDateForInput(editingProject.endDate)}
                  onChange={(e) => setEditingProject({ ...editingProject, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProject} 
              disabled={saving}
              className="bg-[#4514F9] hover:bg-[#3810C7]"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
