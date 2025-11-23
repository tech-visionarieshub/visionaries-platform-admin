"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, User, Plus, Search, GitBranch, MoreHorizontal, ExternalLink, Loader2, Upload, TestTube, ChevronDown, ChevronRight, Play, Pause, Check, Sparkles } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getFeatures, updateFeature, moveFeatureToQA, type Feature } from "@/lib/api/features-api"
import { trackFeatureTime } from "@/lib/api/time-tracking-api"
import { getProjectTeam, type TeamMember } from "@/lib/api/project-team-api"
import type { FeatureStatus, FeaturePriority } from "@/types/feature"
import Link from "next/link"
import { FeatureEditor } from "./feature-editor"
import { FeatureFileUploader } from "./feature-file-uploader"

const statusConfig = {
  backlog: { label: "Backlog", color: "bg-gray-500" },
  todo: { label: "To Do", color: "bg-blue-500" },
  "in-progress": { label: "In Progress", color: "bg-purple-500" },
  review: { label: "Review", color: "bg-amber-500" },
  done: { label: "Done", color: "bg-green-500" },
  completed: { label: "Completed", color: "bg-green-600" },
}

export function BacklogScrum() {
  const params = useParams()
  const projectId = params.id as string
  const { toast } = useToast()
  
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterEpic, setFilterEpic] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set())
  const [showFeatureEditor, setShowFeatureEditor] = useState(false)
  const [showFileUploader, setShowFileUploader] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [reEstimating, setReEstimating] = useState(false)

  // Cargar funcionalidades
  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFeatures(projectId)
      setFeatures(data)
    } catch (error: any) {
      console.error('[BacklogScrum] Error loading features:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las funcionalidades",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [projectId, toast])

  useEffect(() => {
    if (projectId) {
      loadFeatures()
      loadTeamMembers()
    }
  }, [projectId, loadFeatures])

  const loadTeamMembers = async () => {
    try {
      const members = await getProjectTeam(projectId)
      setTeamMembers(members)
    } catch (error: any) {
      console.error('[BacklogScrum] Error loading team members:', error)
    }
  }

  // Obtener lista de epics únicos
  const epics = Array.from(new Set(features.map(f => f.epicTitle))).sort()
  
  // Obtener lista de assignees únicos
  const assignees = Array.from(new Set(features.map(f => f.assignee).filter(Boolean))).sort()

  // Agrupar features por epic
  const featuresByEpic = epics.reduce((acc, epic) => {
    acc[epic] = features.filter(f => f.epicTitle === epic)
    return acc
  }, {} as Record<string, Feature[]>)

  const filteredFeatures = features.filter((feature) => {
    const matchesSearch =
      searchQuery === "" ||
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || feature.status === filterStatus
    const matchesPriority = filterPriority === "all" || feature.priority === filterPriority
    const matchesEpic = filterEpic === "all" || feature.epicTitle === filterEpic
    const matchesAssignee = filterAssignee === "all" || feature.assignee === filterAssignee

    return matchesSearch && matchesStatus && matchesPriority && matchesEpic && matchesAssignee
  })

  // Agrupar features filtradas por epic
  const filteredFeaturesByEpic = epics.reduce((acc, epic) => {
    const epicFeatures = filteredFeatures.filter(f => f.epicTitle === epic)
    if (epicFeatures.length > 0) {
      acc[epic] = epicFeatures
    }
    return acc
  }, {} as Record<string, Feature[]>)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-[#E02814] bg-[#E02814]/10"
      case "medium":
        return "text-[#F59E0B] bg-[#F59E0B]/10"
      case "low":
        return "text-[#4BBAFF] bg-[#4BBAFF]/10"
      default:
        return "text-gray-500 bg-gray-100"
    }
  }

  const toggleFeatureSelection = (featureId: string) => {
    const newSelected = new Set(selectedFeatures)
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId)
    } else {
      newSelected.add(featureId)
    }
    setSelectedFeatures(newSelected)
  }

  const toggleAllFeatures = () => {
    if (selectedFeatures.size === filteredFeatures.length) {
      setSelectedFeatures(new Set())
    } else {
      setSelectedFeatures(new Set(filteredFeatures.map((f) => f.id)))
    }
  }

  const toggleEpic = (epic: string) => {
    const newExpanded = new Set(expandedEpics)
    if (newExpanded.has(epic)) {
      newExpanded.delete(epic)
    } else {
      newExpanded.add(epic)
    }
    setExpandedEpics(newExpanded)
  }

  const handleMoveToQA = async (feature: Feature) => {
    try {
      await moveFeatureToQA(projectId, feature.id)
      toast({
        title: "✅ Tarea QA creada",
        description: `La funcionalidad "${feature.title}" se ha movido a QA`,
      })
      loadFeatures() // Recargar para ver el qaTaskId
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo mover la funcionalidad a QA",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (featureId: string, newStatus: FeatureStatus) => {
    try {
      await updateFeature(projectId, featureId, { status: newStatus })
      toast({
        title: "Estado actualizado",
        description: "La funcionalidad se ha actualizado correctamente",
      })
      loadFeatures() // Recargar para ver cambios (puede haber creado QA automáticamente)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleTimeTracking = async (feature: Feature, action: 'start' | 'pause' | 'complete') => {
    try {
      const result = await trackFeatureTime(projectId, feature.id, action)
      toast({
        title: action === 'start' ? 'Timer iniciado' : action === 'pause' ? 'Timer pausado' : 'Tarea completada',
        description: result.message,
      })
      loadFeatures() // Recargar para ver cambios
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo ejecutar la acción",
        variant: "destructive",
      })
    }
  }

  const handleReEstimate = async () => {
    try {
      setReEstimating(true)
      const token = await import('@/lib/firebase/visionaries-tech').then(m => m.getIdToken())
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/features/re-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(error.error || 'Error al re-estimar funcionalidades')
      }

      const data = await response.json()
      toast({
        title: "✅ Re-estimación completada",
        description: data.message || `Se estimaron ${data.updatedCount} funcionalidades`,
      })
      loadFeatures() // Recargar para ver los cambios
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo re-estimar las funcionalidades",
        variant: "destructive",
      })
    } finally {
      setReEstimating(false)
    }
  }

  const handleAssigneeChange = async (featureId: string, newAssignee: string) => {
    try {
      // Convertir "unassigned" a undefined para guardar sin asignación
      const assigneeValue = newAssignee === "unassigned" ? undefined : newAssignee
      await updateFeature(projectId, featureId, { assignee: assigneeValue })
      toast({
        title: "Responsable actualizado",
        description: "El responsable se ha actualizado correctamente",
      })
      loadFeatures() // Recargar para ver cambios
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el responsable",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4514F9]" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0E0734]">Funcionalidades del Proyecto</h2>
          <p className="text-xs text-muted-foreground">{filteredFeatures.length} funcionalidades</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedFeatures.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedFeatures.size} seleccionadas
            </Badge>
          )}
          <Button 
            variant="outline" 
            className="h-8 text-xs"
            onClick={handleReEstimate}
            disabled={reEstimating || features.length === 0}
          >
            {reEstimating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Estimando...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Re-estimar con IA
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="h-8 text-xs"
            onClick={() => setShowFileUploader(true)}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Subir CSV/Excel
          </Button>
          <Button 
            className="bg-[#4514F9] hover:bg-[#3810C7] h-8 text-xs"
            onClick={() => setShowFeatureEditor(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nueva Funcionalidad
          </Button>
        </div>
      </div>

      <Card className="p-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          <Select value={filterEpic} onValueChange={setFilterEpic}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Epic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Epics</SelectItem>
              {epics.map(epic => (
                <SelectItem key={epic} value={epic}>
                  {epic} ({featuresByEpic[epic]?.length || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {assignees.map(assignee => (
                <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {Object.keys(filteredFeaturesByEpic).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No hay funcionalidades que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(filteredFeaturesByEpic).map(([epic, epicFeatures]) => (
              <div key={epic} className="border-b last:border-0">
                {/* Header del Epic */}
                <div 
                  className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleEpic(epic)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {expandedEpics.has(epic) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-sm text-[#4514F9]">{epic}</span>
                    <Badge variant="secondary" className="text-xs">
                      {epicFeatures.length} funcionalidades
                    </Badge>
                  </div>
                </div>

                {/* Features del Epic */}
                {expandedEpics.has(epic) && (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="w-10 p-2">
                          <Checkbox
                            checked={epicFeatures.every(f => selectedFeatures.has(f.id)) && epicFeatures.length > 0}
                            onCheckedChange={() => {
                              const allSelected = epicFeatures.every(f => selectedFeatures.has(f.id))
                              const newSelected = new Set(selectedFeatures)
                              if (allSelected) {
                                epicFeatures.forEach(f => newSelected.delete(f.id))
                              } else {
                                epicFeatures.forEach(f => newSelected.add(f.id))
                              }
                              setSelectedFeatures(newSelected)
                            }}
                          />
                        </TableHead>
                        <TableHead className="w-24 p-2 text-xs font-semibold">ID</TableHead>
                        <TableHead className="p-2 text-xs font-semibold">Título</TableHead>
                        <TableHead className="w-32 p-2 text-xs font-semibold">Responsable</TableHead>
                        <TableHead className="w-24 p-2 text-xs font-semibold text-center">Horas</TableHead>
                        <TableHead className="w-28 p-2 text-xs font-semibold">Estado</TableHead>
                        <TableHead className="w-20 p-2 text-xs font-semibold">Prioridad</TableHead>
                        <TableHead className="w-24 p-2 text-xs font-semibold text-center">Timer</TableHead>
                        <TableHead className="w-32 p-2 text-xs font-semibold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {epicFeatures.map((feature) => (
                        <TableRow
                          key={feature.id}
                          className="hover:bg-muted/50 border-b"
                        >
                          <TableCell className="p-2">
                            <Checkbox 
                              checked={selectedFeatures.has(feature.id)} 
                              onCheckedChange={() => toggleFeatureSelection(feature.id)} 
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <code className="text-xs font-mono text-muted-foreground">{feature.id.substring(0, 8)}</code>
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex items-center gap-2">
                              <span 
                                className="text-xs font-medium text-[#0E0734] truncate max-w-md cursor-pointer"
                                onClick={() => setSelectedFeature(feature)}
                              >
                                {feature.title}
                              </span>
                              {feature.githubBranch && (
                                <div className="flex items-center gap-1 text-[#4514F9]">
                                  <GitBranch className="h-3 w-3" />
                                  <span className="text-xs">{feature.commits || 0}</span>
                                </div>
                              )}
                              {feature.qaTaskId && (
                                <Link href={`/projects/${projectId}/qa`}>
                                  <Badge variant="outline" className="text-xs cursor-pointer">
                                    <TestTube className="h-3 w-3 mr-1" />
                                    QA
                                  </Badge>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={feature.assignee || 'unassigned'}
                              onValueChange={(value) => handleAssigneeChange(feature.id, value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectTrigger className="h-7 text-xs w-32">
                                <SelectValue placeholder="Sin asignar">
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <span className="text-xs truncate">
                                      {feature.assignee 
                                        ? teamMembers.find(m => m.email === feature.assignee)?.displayName || feature.assignee
                                        : 'Sin asignar'}
                                    </span>
                                  </div>
                                </SelectValue>
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
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-0.5">
                                Est: {feature.estimatedHours || 0}h
                              </div>
                              <div
                                className={`text-xs font-medium ${
                                  (feature.actualHours || 0) > (feature.estimatedHours || 0) ? "text-[#E02814]" : "text-foreground"
                                }`}
                              >
                                Real: {feature.actualHours?.toFixed(1) || 0}h
                              </div>
                              {(feature.actualHours || 0) > (feature.estimatedHours || 0) && (
                                <div className="text-xs text-[#E02814]">
                                  +{((feature.actualHours || 0) - (feature.estimatedHours || 0)).toFixed(1)}h
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={feature.status}
                              onValueChange={(value) => handleStatusChange(feature.id, value as FeatureStatus)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectTrigger className="h-7 text-xs w-28">
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
                          </TableCell>
                          <TableCell className="p-2">
                            <Badge className={`${getPriorityColor(feature.priority)} text-xs px-1.5 py-0`} variant="outline">
                              {feature.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              {feature.startedAt ? (
                                <>
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                                    Corriendo
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleTimeTracking(feature, 'pause')
                                    }}
                                    title="Pausar"
                                  >
                                    <Pause className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTimeTracking(feature, 'start')
                                  }}
                                  title="Iniciar timer"
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              {!feature.startedAt && (feature.status !== 'done' && feature.status !== 'completed') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTimeTracking(feature, 'complete')
                                  }}
                                  title="Completar tarea"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex items-center gap-1">
                              {(feature.status === 'done' || feature.status === 'completed') && !feature.qaTaskId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMoveToQA(feature)
                                  }}
                                >
                                  <TestTube className="h-3 w-3 mr-1" />
                                  Enviar a QA
                                </Button>
                              )}
                              {feature.qaTaskId && (
                                <Link href={`/projects/${projectId}/qa`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Ver QA
                                  </Button>
                                </Link>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedFeature(feature)
                                }}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <code className="text-sm font-mono text-muted-foreground">{selectedFeature?.id.substring(0, 8)}</code>
              <span>{selectedFeature?.title}</span>
            </DialogTitle>
            <DialogDescription>{selectedFeature?.description}</DialogDescription>
          </DialogHeader>
          {selectedFeature && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Epic</div>
                  <div className="text-sm font-medium text-[#4514F9]">{selectedFeature.epicTitle}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Responsable</div>
                  <div className="text-sm flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {selectedFeature.assignee || 'Sin asignar'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Estado</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[selectedFeature.status]?.color || 'bg-gray-500'}`} />
                    <span className="text-sm">{statusConfig[selectedFeature.status]?.label || selectedFeature.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Prioridad</div>
                  <Badge className={`${getPriorityColor(selectedFeature.priority)} text-xs`} variant="outline">
                    {selectedFeature.priority}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Horas</div>
                  <div className="text-sm flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Est: {selectedFeature.estimatedHours || 0}h</div>
                      <div className={`text-xs font-medium ${(selectedFeature.actualHours || 0) > (selectedFeature.estimatedHours || 0) ? "text-[#E02814]" : ""}`}>
                        Real: {selectedFeature.actualHours?.toFixed(1) || 0}h
                      </div>
                    </div>
                  </div>
                </div>
                {selectedFeature.qaTaskId && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Tarea QA</div>
                    <Link href={`/projects/${projectId}/qa`}>
                      <Badge variant="outline" className="text-xs cursor-pointer">
                        <TestTube className="h-3 w-3 mr-1" />
                        Ver Tarea QA
                      </Badge>
                    </Link>
                  </div>
                )}
              </div>
              {selectedFeature.githubBranch && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">GitHub</div>
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-[#4514F9]" />
                    <code className="text-xs bg-muted px-2 py-1 rounded">{selectedFeature.githubBranch}</code>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{selectedFeature.commits || 0} commits</span>
                    <Button variant="ghost" size="sm" className="h-6 ml-auto">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver en GitHub
                    </Button>
                  </div>
                </div>
              )}
              {selectedFeature.sprint && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Sprint</div>
                  <Badge variant="outline" className="text-[#4514F9]">
                    {selectedFeature.sprint}
                  </Badge>
                </div>
              )}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2">
                  {selectedFeature.startedAt ? (
                    <>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                        Timer corriendo
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTimeTracking(selectedFeature, 'pause')}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pausar
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTimeTracking(selectedFeature, 'start')}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Iniciar Timer
                    </Button>
                  )}
                  {!selectedFeature.startedAt && (selectedFeature.status !== 'done' && selectedFeature.status !== 'completed') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleTimeTracking(selectedFeature, 'complete')
                        setSelectedFeature(null)
                      }}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Completar
                    </Button>
                  )}
                </div>
                {(selectedFeature.status === 'done' || selectedFeature.status === 'completed') && !selectedFeature.qaTaskId && (
                  <Button
                    onClick={() => {
                      handleMoveToQA(selectedFeature)
                      setSelectedFeature(null)
                    }}
                    className="w-full"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Enviar a QA
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feature Editor */}
      <FeatureEditor
        open={showFeatureEditor}
        onOpenChange={setShowFeatureEditor}
        projectId={projectId}
        feature={selectedFeature}
        onSuccess={loadFeatures}
      />

      {/* Feature File Uploader */}
      <FeatureFileUploader
        open={showFileUploader}
        onOpenChange={setShowFileUploader}
        projectId={projectId}
        onUploadComplete={loadFeatures}
      />
    </div>
  )
}
