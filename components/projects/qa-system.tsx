"use client"

import { useCallback, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, Upload as UploadIcon, RefreshCw, CheckCircle2, XCircle, Clock, TestTube } from "lucide-react"
import type { QATask, QATaskStatus } from "@/types/qa"
import { getIdToken } from "@/lib/firebase/visionaries-tech"
import { QATaskEditor } from "./qa-task-editor"
import { QAFileUploader } from "./qa-file-uploader"

const statusConfig: Record<QATaskStatus, { label: string; color: string; icon: typeof Clock }> = {
  Pendiente: { label: "Pendiente", color: "bg-gray-100 text-gray-700", icon: Clock },
  "En Progreso": { label: "En Progreso", color: "bg-blue-100 text-blue-700", icon: TestTube },
  Completado: { label: "Completado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  Bloqueado: { label: "Bloqueado", color: "bg-red-100 text-red-700", icon: XCircle },
  Cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-700", icon: XCircle },
}

interface QASystemProps {
  projectId: string
}

export function QASystem({ projectId }: QASystemProps) {
  const [tasks, setTasks] = useState<QATask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTask, setSelectedTask] = useState<QATask | null>(null)
  const [uploaderOpen, setUploaderOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getIdToken()
      if (!token) {
        console.error("[QA System] No token available")
        return
      }

      const response = await fetch(`/api/projects/${projectId}/qa-tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("No se pudieron cargar las tareas")
      }

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error("[QA System] Error loading tasks", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      loadTasks()
    }
  }, [projectId, loadTasks])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadTasks()
    setRefreshing(false)
  }, [loadTasks])

  const filteredTasks = tasks.filter((task) => {
    const comentarios = task.comentarios || ""
    const matchesSearch =
      task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comentarios.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.estado === statusFilter
    const matchesCategory = categoryFilter === "all" || task.categoria === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const metrics = (() => {
    const total = tasks.length
    const completados = tasks.filter((t) => t.estado === "Completado").length
    const enProgreso = tasks.filter((t) => t.estado === "En Progreso").length
    const pendientes = tasks.filter((t) => t.estado === "Pendiente").length
    const bloqueados = tasks.filter((t) => t.estado === "Bloqueado").length
    const cancelados = tasks.filter((t) => t.estado === "Cancelado").length
    const completionRate = total > 0 ? Math.round((completados / total) * 100) : 0
    return { total, completados, enProgreso, pendientes, bloqueados, cancelados, completionRate }
  })()

  const formatDate = (dateValue: QATask["createdAt"]) => {
    if (!dateValue) return "—"
    try {
      if (typeof dateValue === "string") {
        return new Date(dateValue).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
      }
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
      }
      // Firestore Timestamp
      // @ts-ignore
      if (dateValue?.toDate) {
        // @ts-ignore
        return dateValue.toDate().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
      }
      return "—"
    } catch {
      return "—"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4514F9]" />
        <span className="ml-2 text-muted-foreground">Cargando tareas QA...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Tareas</div>
          <div className="text-2xl font-bold text-[#0E0734]">{metrics.total}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Completados</div>
          <div className="text-2xl font-bold text-[#95C900]">{metrics.completados}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">En Progreso</div>
          <div className="text-2xl font-bold text-[#4514F9]">{metrics.enProgreso}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Pendientes</div>
          <div className="text-2xl font-bold text-gray-500">{metrics.pendientes}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Bloqueados</div>
          <div className="text-2xl font-bold text-[#E02814]">{metrics.bloqueados}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
          <div className="text-2xl font-bold text-[#4514F9]">{metrics.completionRate}%</div>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="tasks">Tareas QA ({tasks.length})</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.keys(statusConfig).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 h-9 text-sm">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="Funcionalidades Nuevas">Funcionalidades Nuevas</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="Bugs Generales">Bugs Generales</SelectItem>
                <SelectItem value="Otra">Otra</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualizar
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setUploaderOpen(true)}>
              <UploadIcon className="h-4 w-4" />
              Subir CSV/Excel
            </Button>
          </div>
        </div>

        <TabsContent value="tasks" className="space-y-2">
          {filteredTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {tasks.length === 0
                  ? "No hay tareas QA aún. Sube un archivo CSV/Excel para comenzar."
                  : "No se encontraron tareas con los filtros seleccionados."}
              </p>
            </Card>
          ) : (
            filteredTasks.map((task) => {
              const statusInfo = statusConfig[task.estado] || statusConfig.Pendiente
              const StatusIcon = statusInfo.icon
              return (
                <Card
                  key={task.id}
                  className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                            <Badge className={`text-xs px-1.5 py-0 ${statusInfo.color}`}>
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {task.categoria}
                            </Badge>
                            {task.imagenes && task.imagenes.length > 0 && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                {task.imagenes.length} imagen{task.imagenes.length !== 1 ? "es" : ""}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-[#0E0734] truncate">{task.titulo}</h4>
                          {task.comentarios && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{task.comentarios}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(task.createdAt)}</span>
                        </div>
                        {task.tipo && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {task.tipo}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      <QATaskEditor
        task={selectedTask}
        projectId={projectId}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
        onSave={async () => {
          await loadTasks()
          setSelectedTask(null)
        }}
      />

      <QAFileUploader
        projectId={projectId}
        open={uploaderOpen}
        onOpenChange={setUploaderOpen}
        onUploadComplete={async () => {
          await loadTasks()
        }}
      />
    </div>
  )
}
