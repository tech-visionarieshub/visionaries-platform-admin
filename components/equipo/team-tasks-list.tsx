"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, User, Plus, Search, Play, Pause, Check, Sparkles, Edit, Trash2, MoreHorizontal, Calendar, LayoutGrid, GanttChart, CalendarDays } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getTeamTasks, updateTeamTask, deleteTeamTask, trackTeamTaskTime, type TeamTask } from "@/lib/api/team-tasks-api"
import { getUsers, type User } from "@/lib/api/users-api"
import { getProjects } from "@/lib/api/projects-api"
import { connectTrello, disconnectTrello, syncTrelloTasks, getTrelloConnectionStatus } from "@/lib/api/trello-api"
import type { TeamTaskStatus, TeamTaskPriority, TeamTaskCategory } from "@/types/team-task"
import { TeamTaskEditor } from "./team-task-editor"
import { TranscriptTaskGenerator } from "./transcript-task-generator"
import { TeamTasksKanban } from "./team-tasks-kanban"
import { TeamTasksGantt } from "./team-tasks-gantt"
import { TeamTasksCalendar } from "./team-tasks-calendar"
import { Link2, Link2Off, RefreshCw } from "lucide-react"

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-gray-500" },
  "in-progress": { label: "En Progreso", color: "bg-purple-500" },
  review: { label: "En Revisión", color: "bg-amber-500" },
  completed: { label: "Completada", color: "bg-green-500" },
  cancelled: { label: "Cancelada", color: "bg-red-500" },
}

const priorityConfig = {
  high: { label: "Alta", color: "text-[#E02814] bg-[#E02814]/10" },
  medium: { label: "Media", color: "text-[#F59E0B] bg-[#F59E0B]/10" },
  low: { label: "Baja", color: "text-[#4BBAFF] bg-[#4BBAFF]/10" },
}

export function TeamTasksList() {
  const { toast } = useToast()
  
  const [tasks, setTasks] = useState<TeamTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null)
  const [taskToEdit, setTaskToEdit] = useState<TeamTask | null>(null)
  const [showTaskEditor, setShowTaskEditor] = useState(false)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [showTranscriptGenerator, setShowTranscriptGenerator] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string; clientName?: string }>>([])
  const [activeView, setActiveView] = useState<"table" | "kanban" | "gantt" | "calendar">("table")
  const [trelloConnected, setTrelloConnected] = useState(false)
  const [syncingTrello, setSyncingTrello] = useState(false)

  // Cargar tareas
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const filters: {
        status?: TeamTaskStatus
        assignee?: string
        projectId?: string
        category?: TeamTaskCategory
      } = {}

      if (filterStatus !== 'all') filters.status = filterStatus as TeamTaskStatus
      if (filterAssignee !== 'all') filters.assignee = filterAssignee
      if (filterProject !== 'all') filters.projectId = filterProject
      if (filterCategory !== 'all') filters.category = filterCategory as TeamTaskCategory

      const data = await getTeamTasks(filters)
      setTasks(data)
    } catch (error: any) {
      console.error('[TeamTasksList] Error loading tasks:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las tareas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterAssignee, filterProject, filterCategory, toast])

  useEffect(() => {
    loadTasks()
    loadUsers()
    loadProjects()
    checkTrelloConnection()

    // Verificar si hay parámetros de callback de Trello en la URL
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('trello_connected') === 'true') {
      toast({
        title: "Trello conectado",
        description: "Tu cuenta de Trello ha sido conectada exitosamente",
      })
      checkTrelloConnection()
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (urlParams.get('trello_error')) {
      const error = urlParams.get('trello_error')
      toast({
        title: "Error conectando Trello",
        description: error === 'missing_params' 
          ? 'Faltan parámetros en la respuesta de Trello'
          : error === 'token_not_found'
          ? 'No se encontró el token de autorización'
          : `Error: ${error}`,
        variant: "destructive",
      })
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [loadTasks, toast])

  const checkTrelloConnection = async () => {
    try {
      const status = await getTrelloConnectionStatus()
      setTrelloConnected(status.connected)
      return status.connected
    } catch (error) {
      console.error('[checkTrelloConnection] Error:', error)
      setTrelloConnected(false)
      return false
    }
  }

  const loadUsers = async () => {
    try {
      const usersList = await getUsers()
      setUsers(usersList)
    } catch (error: any) {
      console.error('[TeamTasksList] Error loading users:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const projectsList = await getProjects()
      setProjects(projectsList.map(p => ({
        id: p.id,
        name: p.name,
        clientName: p.clientName,
      })))
    } catch (error: any) {
      console.error('[TeamTasksList] Error loading projects:', error)
    }
  }

  // Filtrar tareas por búsqueda
  const filteredTasks = tasks.filter(task => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = task.title.toLowerCase().includes(query)
      const matchesDescription = task.description?.toLowerCase().includes(query)
      const matchesCategory = (task.category === 'Otra' ? task.customCategory : task.category)?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription && !matchesCategory) return false
    }
    return true
  })

  const handleTimeTracking = async (task: TeamTask, action: 'start' | 'pause' | 'complete') => {
    try {
      // Actualizar optimísticamente
      if (action === 'start') {
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id 
              ? { ...t, startedAt: new Date(), status: 'in-progress' as TeamTaskStatus }
              : t
          )
        )
      } else if (action === 'pause') {
        setTasks(prevTasks => 
          prevTasks.map(t => {
            if (t.id === task.id && t.startedAt) {
              const startedAtDate = t.startedAt instanceof Date ? t.startedAt : new Date(t.startedAt)
              const elapsedSeconds = Math.floor((new Date().getTime() - startedAtDate.getTime()) / 1000)
              const currentAccumulated = t.accumulatedTime || 0
              return {
                ...t,
                startedAt: undefined,
                accumulatedTime: currentAccumulated + elapsedSeconds
              }
            }
            return t
          })
        )
      } else if (action === 'complete') {
        const totalSeconds = task.accumulatedTime || 0
        const actualHours = Math.round((totalSeconds / 3600) * 10) / 10
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id 
              ? { ...t, startedAt: undefined, actualHours, status: 'completed' as TeamTaskStatus }
              : t
          )
        )
      }
      
      const result = await trackTeamTaskTime(task.id, action)
      
      // Actualizar con la respuesta del servidor
      if (result.task) {
        setTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? { ...t, ...result.task } : t)
        )
      }
      
      toast({
        title: action === 'start' ? 'Timer iniciado' : action === 'pause' ? 'Timer pausado' : 'Tarea completada',
        description: result.message,
      })
    } catch (error: any) {
      loadTasks()
      toast({
        title: "Error",
        description: error.message || "No se pudo ejecutar la acción",
        variant: "destructive",
      })
    }
  }

  const handleAssigneeChange = async (taskId: string, newAssignee: string) => {
    try {
      await updateTeamTask(taskId, { assignee: newAssignee === 'unassigned' ? undefined : newAssignee })
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, assignee: newAssignee === 'unassigned' ? undefined : newAssignee } : t
        )
      )
      toast({
        title: "Responsable actualizado",
        description: "El responsable de la tarea ha sido actualizado",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el responsable",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TeamTaskStatus) => {
    try {
      await updateTeamTask(taskId, { status: newStatus })
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      )
      toast({
        title: "Estado actualizado",
        description: "El estado de la tarea ha sido actualizado",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return
    }

    try {
      await deleteTeamTask(taskId)
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId))
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la tarea",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return '0h'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Función para formatear fecha sin problemas de zona horaria
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return '-'
    try {
      let d: Date
      if (typeof date === 'string') {
        d = new Date(date)
        if (isNaN(d.getTime())) {
          return '-'
        }
      } else {
        d = date
        if (isNaN(d.getTime())) {
          return '-'
        }
      }
      
      // Usar UTC para obtener la fecha correcta sin importar la zona horaria
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      return `${day}/${month}/${year}`
    } catch (error) {
      console.error('[formatDate] Error:', error)
      return '-'
    }
  }

  // Función para calcular días de retraso
  const getDaysOverdue = (dueDate: Date | string | undefined): number | null => {
    if (!dueDate) return null
    try {
      let due: Date
      if (typeof dueDate === 'string') {
        due = new Date(dueDate)
        if (isNaN(due.getTime())) {
          return null
        }
      } else {
        due = new Date(dueDate)
        if (isNaN(due.getTime())) {
          return null
        }
      }
      
      // Usar UTC para comparar fechas sin problemas de zona horaria
      const today = new Date()
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      const dueUTC = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()))
      
      const diffTime = todayUTC.getTime() - dueUTC.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays > 0 ? diffDays : null
    } catch (error) {
      console.error('[getDaysOverdue] Error:', error)
      return null
    }
  }

  const getCurrentTime = (task: TeamTask) => {
    if (!task.startedAt) return null
    const startedAtDate = task.startedAt instanceof Date 
      ? task.startedAt 
      : new Date(task.startedAt)
    const elapsedSeconds = Math.floor((new Date().getTime() - startedAtDate.getTime()) / 1000)
    return elapsedSeconds
  }

  // Función para generar un color único para cada responsable basado en su email
  const getAssigneeColor = (email: string | undefined): string => {
    if (!email) return 'bg-gray-200 text-gray-600'
    
    // Paleta de colores predefinida
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-300',
      'bg-green-100 text-green-700 border-green-300',
      'bg-purple-100 text-purple-700 border-purple-300',
      'bg-pink-100 text-pink-700 border-pink-300',
      'bg-yellow-100 text-yellow-700 border-yellow-300',
      'bg-indigo-100 text-indigo-700 border-indigo-300',
      'bg-red-100 text-red-700 border-red-300',
      'bg-teal-100 text-teal-700 border-teal-300',
      'bg-orange-100 text-orange-700 border-orange-300',
      'bg-cyan-100 text-cyan-700 border-cyan-300',
      'bg-amber-100 text-amber-700 border-amber-300',
      'bg-emerald-100 text-emerald-700 border-emerald-300',
    ]
    
    // Generar un índice determinístico basado en el email
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const handleConnectTrello = async () => {
    try {
      const { authUrl } = await connectTrello()
      // Redirigir a Trello para autorización
      window.location.href = authUrl
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo conectar con Trello",
        variant: "destructive",
      })
    }
  }

  const handleDisconnectTrello = async () => {
    if (!confirm('¿Estás seguro de que quieres desconectar tu cuenta de Trello?')) {
      return
    }

    try {
      await disconnectTrello()
      setTrelloConnected(false)
      toast({
        title: "Desconectado",
        description: "Tu cuenta de Trello ha sido desconectada",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo desconectar Trello",
        variant: "destructive",
      })
    }
  }

  const handleSyncTrello = async () => {
    // Verificar conexión antes de sincronizar
    if (!trelloConnected) {
      toast({
        title: "Trello no conectado",
        description: "Por favor conecta tu cuenta de Trello primero haciendo clic en 'Conectar Trello'",
        variant: "destructive",
      })
      return
    }

    try {
      setSyncingTrello(true)
      
      // Verificar conexión nuevamente antes de sincronizar
      const status = await getTrelloConnectionStatus()
      if (!status.connected) {
        setTrelloConnected(false)
        toast({
          title: "Trello no conectado",
          description: "Tu cuenta de Trello no está conectada. Por favor conéctala primero.",
          variant: "destructive",
        })
        return
      }

      const result = await syncTrelloTasks()
      
      toast({
        title: "Sincronización completada",
        description: result.message,
      })

      // Recargar tareas
      await loadTasks()
      await checkTrelloConnection()
    } catch (error: any) {
      // Si el error es que no está conectado, actualizar el estado
      if (error.message?.includes('No tienes una cuenta de Trello conectada')) {
        setTrelloConnected(false)
        toast({
          title: "Trello no conectado",
          description: "Por favor conecta tu cuenta de Trello primero haciendo clic en 'Conectar Trello'",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "No se pudieron sincronizar las tareas de Trello",
          variant: "destructive",
        })
      }
    } finally {
      setSyncingTrello(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0E0734]">Tareas del Equipo</h2>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {trelloConnected ? (
            <>
              <Button 
                variant="outline" 
                className="h-8 text-xs"
                onClick={handleSyncTrello}
                disabled={syncingTrello || !trelloConnected}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncingTrello ? 'animate-spin' : ''}`} />
                {syncingTrello ? 'Sincronizando...' : 'Sincronizar Trello'}
              </Button>
              <Button 
                variant="outline" 
                className="h-8 text-xs"
                onClick={handleDisconnectTrello}
                disabled={syncingTrello}
              >
                <Link2Off className="h-3.5 w-3.5 mr-1" />
                Desconectar Trello
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              className="h-8 text-xs"
              onClick={handleConnectTrello}
            >
              <Link2 className="h-3.5 w-3.5 mr-1" />
              Conectar Trello
            </Button>
          )}
          <Button 
            variant="outline" 
            className="h-8 text-xs"
            onClick={() => setShowTranscriptGenerator(true)}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Generar desde Transcript
          </Button>
          <Button 
            className="bg-[#4514F9] hover:bg-[#3810C7] h-8 text-xs"
            onClick={() => {
              setTaskToEdit(null)
              setShowTaskEditor(true)
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder={filterStatus === 'all' ? 'Todos los estados' : 'Estado'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in-progress">En Progreso</SelectItem>
              <SelectItem value="review">En Revisión</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger>
              <SelectValue placeholder={filterAssignee === 'all' ? 'Todos los responsables' : 'Responsable'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los responsables</SelectItem>
              {users.map(user => (
                <SelectItem key={user.email} value={user.email}>
                  {user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger>
              <SelectValue placeholder={filterProject === 'all' ? 'Todos los proyectos' : 'Proyecto'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder={filterCategory === 'all' ? 'Todas las categorías' : 'Categoría'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {['Propuestas', 'Startups', 'Evolution', 'Pathway', 'Desarrollo', 'QA', 'Portal Admin', 'Aura', 'Redes Sociales', 'Conferencias', 'Inversión', 'Pagos', 'Otra'].map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Pestañas de vista */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Tabla
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <GanttChart className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          {/* Tabla de tareas */}
          <Card className="p-2">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando tareas...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay tareas que mostrar</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Título</TableHead>
                  <TableHead className="w-32">Categoría</TableHead>
                  <TableHead className="w-40">Responsable</TableHead>
                  <TableHead className="w-40">Proyecto</TableHead>
                  <TableHead className="w-32">Estado</TableHead>
                  <TableHead className="w-28">Prioridad</TableHead>
                  <TableHead className="w-32">Fecha Límite</TableHead>
                  <TableHead className="w-32">Retraso</TableHead>
                  <TableHead className="w-32">Horas</TableHead>
                  <TableHead className="w-40">Tiempo</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const currentTime = getCurrentTime(task)
                  const totalTime = (task.accumulatedTime || 0) + (currentTime || 0)
                  const isRunning = !!task.startedAt

                  return (
                    <TableRow 
                      key={task.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        // No abrir detalles si se hace click en un botón o select
                        const target = e.target as HTMLElement
                        if (target.closest('button') || target.closest('[role="combobox"]') || target.closest('[role="option"]')) {
                          return
                        }
                        setSelectedTask(task)
                        setShowTaskDetails(true)
                      }}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {task.category === 'Otra' ? (task.customCategory || 'Otra') : task.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {task.assignee && (
                            <div className={`w-3 h-3 rounded-full border ${getAssigneeColor(task.assignee).split(' ')[0]}`} />
                          )}
                          <Select
                            value={task.assignee || 'unassigned'}
                            onValueChange={(value) => handleAssigneeChange(task.id, value)}
                          >
                            <SelectTrigger className={`h-7 text-xs w-32 ${task.assignee ? getAssigneeColor(task.assignee) : 'bg-gray-100 text-gray-600'}`}>
                              <SelectValue>
                                {task.assignee 
                                  ? users.find(u => u.email === task.assignee)?.displayName || task.assignee
                                  : 'Sin asignar'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Sin asignar</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.email} value={user.email}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getAssigneeColor(user.email).split(' ')[0]}`} />
                                    {user.displayName}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.projectName ? (
                          <span className="text-xs">{task.projectName}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.status}
                          onValueChange={(value) => handleStatusChange(task.id, value as TeamTaskStatus)}
                        >
                          <SelectTrigger className="h-7 text-xs w-28">
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
                      </TableCell>
                      <TableCell>
                        <Badge className={`${priorityConfig[task.priority].color} text-xs px-1.5 py-0`} variant="outline">
                          {priorityConfig[task.priority].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {task.dueDate ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const daysOverdue = getDaysOverdue(task.dueDate)
                          if (daysOverdue !== null && task.status !== 'completed' && task.status !== 'cancelled') {
                            return (
                              <Badge variant="destructive" className="text-xs">
                                {daysOverdue} día{daysOverdue !== 1 ? 's' : ''} de retraso
                              </Badge>
                            )
                          }
                          return <span className="text-xs text-muted-foreground">-</span>
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {task.actualHours ? (
                            <span>{task.actualHours}h</span>
                          ) : task.estimatedHours ? (
                            <span className="text-muted-foreground">{task.estimatedHours}h est.</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isRunning && (
                            <div className="flex items-center gap-1 text-xs text-purple-600">
                              <Clock className="h-3 w-3 animate-spin" />
                              {formatTime(currentTime)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {!isRunning && task.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleTimeTracking(task, 'start')}
                                title="Iniciar timer"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {isRunning && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleTimeTracking(task, 'pause')}
                                title="Pausar timer"
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            )}
                            {task.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleTimeTracking(task, 'complete')}
                                title="Completar tarea"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground ml-1">
                            {formatTime(totalTime)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTaskToEdit(task)
                              setShowTaskEditor(true)
                            }}
                            title="Editar tarea"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(task.id)
                            }}
                            title="Eliminar tarea"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <TeamTasksKanban
            tasks={filteredTasks}
            users={users}
            onTaskClick={(task) => {
              setSelectedTask(task)
              setShowTaskDetails(true)
            }}
            onTaskEdit={(task) => {
              setTaskToEdit(task)
              setShowTaskEditor(true)
            }}
            onTaskDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <TeamTasksGantt
            tasks={filteredTasks}
            users={users}
            onTaskClick={(task) => {
              setSelectedTask(task)
              setShowTaskDetails(true)
            }}
            onTaskEdit={(task) => {
              setTaskToEdit(task)
              setShowTaskEditor(true)
            }}
            onTaskDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <TeamTasksCalendar
            tasks={filteredTasks}
            users={users}
            onTaskClick={(task) => {
              setSelectedTask(task)
              setShowTaskDetails(true)
            }}
            onTaskEdit={(task) => {
              setTaskToEdit(task)
              setShowTaskEditor(true)
            }}
            onTaskDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TeamTaskEditor
        open={showTaskEditor}
        onOpenChange={setShowTaskEditor}
        task={taskToEdit}
        onSuccess={() => {
          loadTasks()
          setTaskToEdit(null)
        }}
      />

      {/* Dialog de Detalles */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] sm:!max-w-[90vw] md:!max-w-[85vw] lg:!max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{selectedTask?.id}</span>
              <span>{selectedTask?.title}</span>
            </DialogTitle>
            <DialogDescription>{selectedTask?.description || "Sin descripción"}</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Categoría</div>
                  <Badge variant="outline" className="text-sm">
                    {selectedTask.category === 'Otra' ? (selectedTask.customCategory || 'Otra') : selectedTask.category}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Estado</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[selectedTask.status]?.color || 'bg-gray-500'}`} />
                    <span className="text-sm">{statusConfig[selectedTask.status]?.label || selectedTask.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Prioridad</div>
                  <Badge className={`${priorityConfig[selectedTask.priority].color} text-sm px-2 py-0.5`} variant="outline">
                    {priorityConfig[selectedTask.priority].label}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Responsable</div>
                  <div className={`text-sm flex items-center gap-1.5 px-2 py-1 rounded ${selectedTask.assignee ? getAssigneeColor(selectedTask.assignee) : 'bg-gray-100 text-gray-600'}`}>
                    {selectedTask.assignee && (
                      <div className={`w-2.5 h-2.5 rounded-full ${getAssigneeColor(selectedTask.assignee).split(' ')[0]}`} />
                    )}
                    <User className="h-3.5 w-3.5" />
                    {selectedTask.assignee 
                      ? users.find(u => u.email === selectedTask.assignee)?.displayName || selectedTask.assignee
                      : 'Sin asignar'}
                  </div>
                </div>
                {selectedTask.projectName && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Proyecto</div>
                    <div className="text-sm">{selectedTask.projectName}</div>
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Fecha Límite</div>
                    <div className="text-sm flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {(() => {
                        let d: Date
                        if (typeof selectedTask.dueDate === 'string') {
                          d = new Date(selectedTask.dueDate)
                          if (isNaN(d.getTime())) {
                            d = new Date()
                          }
                        } else {
                          d = selectedTask.dueDate
                          if (isNaN(d.getTime())) {
                            d = new Date()
                          }
                        }
                        // Usar métodos locales para evitar problemas de zona horaria
                        const year = d.getFullYear()
                        const month = d.getMonth()
                        const day = d.getDate()
                        const localDate = new Date(year, month, day)
                        return localDate.toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      })()}
                      {(() => {
                        const daysOverdue = getDaysOverdue(selectedTask.dueDate)
                        if (daysOverdue !== null && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled') {
                          return (
                            <Badge variant="destructive" className="text-xs ml-2">
                              {daysOverdue} día{daysOverdue !== 1 ? 's' : ''} de retraso
                            </Badge>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Horas Estimadas</div>
                  <div className="text-sm">
                    {selectedTask.estimatedHours ? `${selectedTask.estimatedHours}h` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Horas Reales</div>
                  <div className="text-sm">
                    {selectedTask.actualHours ? `${selectedTask.actualHours}h` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Tiempo Acumulado</div>
                  <div className="text-sm flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime((selectedTask.accumulatedTime || 0) + (getCurrentTime(selectedTask) || 0))}
                  </div>
                </div>
              </div>

              {selectedTask.description && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Descripción</div>
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                    {selectedTask.description}
                  </div>
                </div>
              )}

              {selectedTask.comentarios && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Comentarios / Notas</div>
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                    {selectedTask.comentarios}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Creada: {new Date(selectedTask.createdAt).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowTaskDetails(false)
                      setTaskToEdit(selectedTask)
                      setShowTaskEditor(true)
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TranscriptTaskGenerator
        open={showTranscriptGenerator}
        onOpenChange={setShowTranscriptGenerator}
        onGenerateComplete={() => {
          loadTasks()
        }}
      />
    </div>
  )
}

