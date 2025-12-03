"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Plus, FileText, AlertTriangle, Info, Archive, ArchiveRestore, ArrowUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getProjects, updateProject } from "@/lib/api/projects-api"
import { getClientes } from "@/lib/api/finanzas-api"
import type { Project, ProjectStatus } from "@/lib/mock-data/projects"
import { StatusSelector } from "@/components/projects/status-selector"
import { StatusInfoDialog } from "@/components/projects/status-info-dialog"
import { useToast } from "@/hooks/use-toast"

// Helper function para formatear fechas sin problemas de zona horaria
function formatDateForDisplay(date: string | Date | undefined, options: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  let dateObj: Date;
  if (typeof date === 'string') {
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

// Helper function para calcular días de retraso
function calculateDaysDelay(endDate: string | Date | undefined): number | null {
  if (!endDate) return null;
  
  let dateObj: Date;
  if (typeof endDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      dateObj = new Date(endDate + 'T12:00:00');
    } else {
      dateObj = new Date(endDate);
    }
  } else {
    dateObj = new Date(endDate);
  }
  
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  dateObj.setHours(12, 0, 0, 0);
  
  if (dateObj < today) {
    const diffTime = today.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  return null;
}

type SortOption = "default" | "delay" | "startDate" | "endDate" | "name" | "client"

const allStatuses: ProjectStatus[] = [
  "lead",
  "Onboarding",
  "Mapeo de procesos",
  "Lista de funcionalidades",
  "Planificación",
  "Kickoff",
  "En ejecución",
  "En espera",
  "Bloqueado",
  "Revisión interna",
  "Revisión cliente",
  "Carta de aceptación",
  "Último pago pendiente",
  "Entregado",
  "En-garantía",
  "Finalizado",
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clientes, setClientes] = useState<Array<{ id: string; empresa: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([])
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [archivedFilter, setArchivedFilter] = useState<"all" | "active" | "archived">("active")
  const [sortOption, setSortOption] = useState<SortOption>("default")
  const [showStatusInfo, setShowStatusInfo] = useState(false)
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        
        const [projectsData, clientesData] = await Promise.all([
          getProjects(),
          getClientes().catch(() => [])
        ])
        
        if (cancelled) return
        
        setProjects(projectsData || [])
        setClientes(clientesData.map(c => ({ id: c.id, empresa: c.empresa })))
      } catch (err: any) {
        if (cancelled) return
        
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          return
        }
        const errorMessage = err.message || 'Error cargando proyectos'
        setError(errorMessage)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      cancelled = true
    }
  }, [])

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects]

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.client.toLowerCase().includes(term) ||
        p.responsible.toLowerCase().includes(term)
      )
    }

    // Filtro de status
    if (statusFilter.length > 0) {
      filtered = filtered.filter(p => statusFilter.includes(p.status))
    }

    // Filtro de cliente
    if (clientFilter !== "all") {
      filtered = filtered.filter(p => p.clientId === clientFilter)
    }

    // Filtro de archivado
    if (archivedFilter === "active") {
      filtered = filtered.filter(p => !p.archived)
    } else if (archivedFilter === "archived") {
      filtered = filtered.filter(p => p.archived)
    }

    // Separar por categorías
    const active = filtered.filter(p => !p.archived && p.status !== "Finalizado")
    const finalized = filtered.filter(p => !p.archived && p.status === "Finalizado")
    const archived = filtered.filter(p => p.archived)

    // Ordenamiento
    const sortProjects = (projs: Project[]) => {
      const sorted = [...projs]
      
      switch (sortOption) {
        case "delay":
          sorted.sort((a, b) => {
            const delayA = calculateDaysDelay(a.endDate) || 0
            const delayB = calculateDaysDelay(b.endDate) || 0
            return delayB - delayA // Mayor retraso primero
          })
          break
        case "startDate":
          sorted.sort((a, b) => {
            const dateA = new Date(a.startDate).getTime()
            const dateB = new Date(b.startDate).getTime()
            return dateA - dateB
          })
          break
        case "endDate":
          sorted.sort((a, b) => {
            const dateA = new Date(a.endDate).getTime()
            const dateB = new Date(b.endDate).getTime()
            return dateA - dateB
          })
          break
        case "name":
          sorted.sort((a, b) => a.name.localeCompare(b.name))
          break
        case "client":
          sorted.sort((a, b) => a.client.localeCompare(b.client))
          break
        case "default":
        default:
          // Por defecto: ordenar por días de retraso (mayor primero) dentro de cada categoría
          sorted.sort((a, b) => {
            const delayA = calculateDaysDelay(a.endDate) || 0
            const delayB = calculateDaysDelay(b.endDate) || 0
            return delayB - delayA
          })
          break
      }
      
      return sorted
    }

    return {
      active: sortProjects(active),
      finalized: sortProjects(finalized),
      archived: sortProjects(archived),
    }
  }, [projects, searchTerm, statusFilter, clientFilter, archivedFilter, sortOption])

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      setUpdatingProjectId(projectId)
      await updateProject(projectId, { status: newStatus })
      
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: newStatus } : p
      ))
      
      toast({
        title: "Status actualizado",
        description: `El proyecto se actualizó a "${newStatus}"`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el status",
        variant: "destructive",
      })
    } finally {
      setUpdatingProjectId(null)
    }
  }

  const handleArchiveToggle = async (projectId: string, currentArchived: boolean) => {
    try {
      setUpdatingProjectId(projectId)
      await updateProject(projectId, { archived: !currentArchived })
      
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, archived: !currentArchived } : p
      ))
      
      toast({
        title: currentArchived ? "Proyecto desarchivado" : "Proyecto archivado",
        description: currentArchived 
          ? "El proyecto se ha movido a la lista activa"
          : "El proyecto se ha archivado",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo archivar/desarchivar el proyecto",
        variant: "destructive",
      })
    } finally {
      setUpdatingProjectId(null)
    }
  }

  const activeFiltersCount = statusFilter.length + (clientFilter !== "all" ? 1 : 0) + (archivedFilter !== "active" ? 1 : 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4514F9]"></div>
          <p className="text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive font-medium">Error: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0E0734]">Proyectos</h1>
          <p className="text-muted-foreground mt-1">Gestión y seguimiento de proyectos activos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowStatusInfo(true)}
            title="Información sobre status"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Link href="/projects/new-from-document">
            <Button variant="outline" className="border-[#4514F9] text-[#4514F9] hover:bg-[#4514F9] hover:text-white">
              <FileText className="mr-2 h-4 w-4" />
              Desde Documento
            </Button>
          </Link>
          <Link href="/projects/new">
            <Button className="bg-[#4514F9] hover:bg-[#3810C7]">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Sort */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar proyectos..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Status</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allStatuses.map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={statusFilter.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setStatusFilter([...statusFilter, status])
                              } else {
                                setStatusFilter(statusFilter.filter(s => s !== status))
                              }
                            }}
                          />
                          <Label
                            htmlFor={`status-${status}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {status}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {statusFilter.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => setStatusFilter([])}
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Cliente</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los clientes</SelectItem>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.empresa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Archivados</Label>
                    <Select value={archivedFilter} onValueChange={(v) => setArchivedFilter(v as typeof archivedFilter)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Solo activos</SelectItem>
                        <SelectItem value="archived">Solo archivados</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-[200px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Por defecto</SelectItem>
                <SelectItem value="delay">Días de retraso (mayor primero)</SelectItem>
                <SelectItem value="startDate">Fecha de inicio</SelectItem>
                <SelectItem value="endDate">Fecha de entrega</SelectItem>
                <SelectItem value="name">Nombre (A-Z)</SelectItem>
                <SelectItem value="client">Cliente (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Projects Grid - Activos */}
      {filteredAndSortedProjects.active.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[#0E0734] mb-4">Proyectos Activos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedProjects.active.map((project) => {
              const daysDelay = calculateDaysDelay(project.endDate)
              const isUpdating = updatingProjectId === project.id

              return (
                <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="space-y-4 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link href={`/projects/${project.id}`}>
                          <h3 className="font-semibold text-lg text-[#0E0734] mb-1 hover:underline truncate">
                            {project.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">{project.client}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleArchiveToggle(project.id, project.archived || false)
                          }}
                          disabled={isUpdating}
                          title="Archivar proyecto"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Status Selector */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusSelector
                        value={project.status}
                        onValueChange={(newStatus) => handleStatusChange(project.id, newStatus)}
                        disabled={isUpdating}
                      />
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium text-[#4514F9]">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {project.completedFeatures}/{project.features} funcionalidades
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground">Inicio</p>
                        <p className="font-medium">
                          {formatDateForDisplay(project.startDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Entrega</p>
                        <p className="font-medium">
                          {formatDateForDisplay(project.endDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        {daysDelay !== null && daysDelay > 0 && (
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-[#E02814]" />
                            <span className="text-xs font-medium text-[#E02814]">
                              {daysDelay} día{daysDelay !== 1 ? 's' : ''} de retraso
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Responsible */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <div className="h-8 w-8 rounded-full bg-[#4514F9] flex items-center justify-center text-white text-sm font-medium">
                        {project.responsible
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="text-sm text-muted-foreground">{project.responsible}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Projects Grid - Finalizados */}
      {filteredAndSortedProjects.finalized.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-[#0E0734] mb-4">Proyectos Finalizados</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedProjects.finalized.map((project) => {
              const isUpdating = updatingProjectId === project.id

              return (
                <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col opacity-75">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link href={`/projects/${project.id}`}>
                          <h3 className="font-semibold text-lg text-[#0E0734] mb-1 hover:underline truncate">
                            {project.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">{project.client}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleArchiveToggle(project.id, project.archived || false)
                          }}
                          disabled={isUpdating}
                          title="Archivar proyecto"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusSelector
                        value={project.status}
                        onValueChange={(newStatus) => handleStatusChange(project.id, newStatus)}
                        disabled={isUpdating}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium text-[#4514F9]">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {project.completedFeatures}/{project.features} funcionalidades
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground">Inicio</p>
                        <p className="font-medium">
                          {formatDateForDisplay(project.startDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Entrega</p>
                        <p className="font-medium">
                          {formatDateForDisplay(project.endDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <div className="h-8 w-8 rounded-full bg-[#4514F9] flex items-center justify-center text-white text-sm font-medium">
                        {project.responsible
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="text-sm text-muted-foreground">{project.responsible}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Projects Grid - Archivados */}
      {filteredAndSortedProjects.archived.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-[#0E0734] mb-4">Proyectos Archivados</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedProjects.archived.map((project) => {
              const isUpdating = updatingProjectId === project.id

              return (
                <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col opacity-60">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link href={`/projects/${project.id}`}>
                          <h3 className="font-semibold text-lg text-[#0E0734] mb-1 hover:underline truncate">
                            {project.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">{project.client}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleArchiveToggle(project.id, true)
                          }}
                          disabled={isUpdating}
                          title="Desarchivar proyecto"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusSelector
                        value={project.status}
                        onValueChange={(newStatus) => handleStatusChange(project.id, newStatus)}
                        disabled={isUpdating}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium text-[#4514F9]">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {project.completedFeatures}/{project.features} funcionalidades
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground">Inicio</p>
                        <p className="font-medium">
                          {formatDateForDisplay(project.startDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Entrega</p>
                        <p className="font-medium">
                          {formatDateForDisplay(project.endDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <div className="h-8 w-8 rounded-full bg-[#4514F9] flex items-center justify-center text-white text-sm font-medium">
                        {project.responsible
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="text-sm text-muted-foreground">{project.responsible}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedProjects.active.length === 0 && 
       filteredAndSortedProjects.finalized.length === 0 && 
       filteredAndSortedProjects.archived.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter.length > 0 || clientFilter !== "all" || archivedFilter !== "active"
              ? "No se encontraron proyectos con los filtros seleccionados"
              : "No hay proyectos disponibles"}
          </p>
        </Card>
      )}

      {/* Status Info Dialog */}
      <StatusInfoDialog open={showStatusInfo} onOpenChange={setShowStatusInfo} />
    </div>
  )
}
