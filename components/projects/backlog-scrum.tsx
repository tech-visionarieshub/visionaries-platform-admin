"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, User, Plus, Search, GitBranch, MoreHorizontal, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FlatTask {
  id: string
  type: "epic" | "story" | "task"
  title: string
  description: string
  epicTitle?: string
  storyTitle?: string
  assignee: string
  estimatedHours: number
  actualHours: number
  status: "backlog" | "todo" | "in-progress" | "review" | "done"
  priority: "high" | "medium" | "low"
  githubBranch?: string
  commits?: number
  storyPoints?: number
  sprint?: string
}

const mockFlatBacklog: FlatTask[] = [
  {
    id: "task-1",
    type: "task",
    title: "Diseñar formulario de registro",
    description: "Crear UI del formulario con validaciones",
    epicTitle: "Sistema de Autenticación",
    storyTitle: "Registro de usuarios",
    assignee: "Juan Pérez",
    estimatedHours: 4,
    actualHours: 3.5,
    status: "done",
    priority: "high",
    githubBranch: "feature/register-form",
    commits: 8,
    sprint: "Sprint 1",
  },
  {
    id: "task-2",
    type: "task",
    title: "Implementar API de registro",
    description: "Endpoint para crear nuevos usuarios en el backend",
    epicTitle: "Sistema de Autenticación",
    storyTitle: "Registro de usuarios",
    assignee: "Juan Pérez",
    estimatedHours: 6,
    actualHours: 7,
    status: "done",
    priority: "high",
    githubBranch: "feature/register-api",
    commits: 12,
    sprint: "Sprint 1",
  },
  {
    id: "task-3",
    type: "task",
    title: "Implementar JWT authentication",
    description: "Configurar JWT con access y refresh tokens",
    epicTitle: "Sistema de Autenticación",
    storyTitle: "Login y autenticación",
    assignee: "María García",
    estimatedHours: 8,
    actualHours: 6,
    status: "in-progress",
    priority: "high",
    githubBranch: "feature/jwt-auth",
    commits: 15,
    sprint: "Sprint 1",
  },
  {
    id: "task-4",
    type: "task",
    title: "Crear página de login",
    description: "UI de login con validaciones y manejo de errores",
    epicTitle: "Sistema de Autenticación",
    storyTitle: "Login y autenticación",
    assignee: "María García",
    estimatedHours: 4,
    actualHours: 0,
    status: "todo",
    priority: "high",
    sprint: "Sprint 1",
  },
  {
    id: "task-5",
    type: "task",
    title: "Diseñar grid de productos",
    description: "Layout responsive del catálogo con cards",
    epicTitle: "Catálogo de Productos",
    storyTitle: "Listado de productos",
    assignee: "Ana López",
    estimatedHours: 6,
    actualHours: 5,
    status: "done",
    priority: "high",
    githubBranch: "feature/product-grid",
    commits: 10,
    sprint: "Sprint 2",
  },
  {
    id: "task-6",
    type: "task",
    title: "Implementar paginación",
    description: "Sistema de paginación con infinite scroll",
    epicTitle: "Catálogo de Productos",
    storyTitle: "Listado de productos",
    assignee: "Ana López",
    estimatedHours: 4,
    actualHours: 2,
    status: "in-progress",
    priority: "medium",
    githubBranch: "feature/pagination",
    commits: 5,
    sprint: "Sprint 2",
  },
  {
    id: "task-7",
    type: "task",
    title: "Crear filtros de búsqueda",
    description: "Filtros por categoría, precio, marca",
    epicTitle: "Catálogo de Productos",
    storyTitle: "Búsqueda y filtros",
    assignee: "Luis Torres",
    estimatedHours: 8,
    actualHours: 0,
    status: "todo",
    priority: "high",
    sprint: "Sprint 2",
  },
  {
    id: "task-8",
    type: "task",
    title: "Implementar búsqueda full-text",
    description: "Búsqueda con Elasticsearch o similar",
    epicTitle: "Catálogo de Productos",
    storyTitle: "Búsqueda y filtros",
    assignee: "Luis Torres",
    estimatedHours: 12,
    actualHours: 0,
    status: "backlog",
    priority: "medium",
  },
  {
    id: "task-9",
    type: "task",
    title: "Diseñar componente de carrito",
    description: "UI del carrito con resumen de compra",
    epicTitle: "Carrito y Checkout",
    storyTitle: "Carrito de compras",
    assignee: "Sofia Ruiz",
    estimatedHours: 6,
    actualHours: 0,
    status: "backlog",
    priority: "medium",
  },
  {
    id: "task-10",
    type: "task",
    title: "Implementar lógica de carrito",
    description: "Agregar, editar, eliminar productos del carrito",
    epicTitle: "Carrito y Checkout",
    storyTitle: "Carrito de compras",
    assignee: "Sofia Ruiz",
    estimatedHours: 8,
    actualHours: 0,
    status: "backlog",
    priority: "medium",
  },
]

const statusConfig = {
  backlog: { label: "Backlog", color: "bg-gray-500" },
  todo: { label: "To Do", color: "bg-blue-500" },
  "in-progress": { label: "In Progress", color: "bg-purple-500" },
  review: { label: "Review", color: "bg-amber-500" },
  done: { label: "Done", color: "bg-green-500" },
}

export function BacklogScrum() {
  const [tasks, setTasks] = useState(mockFlatBacklog)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<FlatTask | null>(null)
  const [sortColumn, setSortColumn] = useState<string>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority
    const matchesAssignee = filterAssignee === "all" || task.assignee === filterAssignee

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })

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

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const toggleAllTasks = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t.id)))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0E0734]">Backlog del Proyecto</h2>
          <p className="text-xs text-muted-foreground">{filteredTasks.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedTasks.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedTasks.size} seleccionadas
            </Badge>
          )}
          <Button className="bg-[#4514F9] hover:bg-[#3810C7] h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nueva Task
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
              <SelectItem value="Juan Pérez">Juan Pérez</SelectItem>
              <SelectItem value="María García">María García</SelectItem>
              <SelectItem value="Ana López">Ana López</SelectItem>
              <SelectItem value="Luis Torres">Luis Torres</SelectItem>
              <SelectItem value="Sofia Ruiz">Sofia Ruiz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-10 p-2">
                <Checkbox
                  checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                  onCheckedChange={toggleAllTasks}
                />
              </TableHead>
              <TableHead className="w-24 p-2 text-xs font-semibold">ID</TableHead>
              <TableHead className="p-2 text-xs font-semibold">Título</TableHead>
              <TableHead className="w-40 p-2 text-xs font-semibold">Epic / Story</TableHead>
              <TableHead className="w-32 p-2 text-xs font-semibold">Responsable</TableHead>
              <TableHead className="w-24 p-2 text-xs font-semibold text-center">Horas</TableHead>
              <TableHead className="w-28 p-2 text-xs font-semibold">Estado</TableHead>
              <TableHead className="w-20 p-2 text-xs font-semibold">Prioridad</TableHead>
              <TableHead className="w-10 p-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow
                key={task.id}
                className="hover:bg-muted/50 cursor-pointer border-b"
                onClick={() => setSelectedTask(task)}
              >
                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedTasks.has(task.id)} onCheckedChange={() => toggleTaskSelection(task.id)} />
                </TableCell>
                <TableCell className="p-2">
                  <code className="text-xs font-mono text-muted-foreground">{task.id}</code>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#0E0734] truncate max-w-md">{task.title}</span>
                    {task.githubBranch && (
                      <div className="flex items-center gap-1 text-[#4514F9]">
                        <GitBranch className="h-3 w-3" />
                        <span className="text-xs">{task.commits}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="text-xs space-y-0.5">
                    <div className="font-medium text-[#4514F9] truncate">{task.epicTitle}</div>
                    <div className="text-muted-foreground truncate">{task.storyTitle}</div>
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs truncate">{task.assignee}</span>
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="text-center">
                    <div
                      className={`text-xs font-medium ${
                        task.actualHours > task.estimatedHours ? "text-[#E02814]" : "text-muted-foreground"
                      }`}
                    >
                      {task.actualHours}h / {task.estimatedHours}h
                    </div>
                    {task.actualHours > task.estimatedHours && (
                      <div className="text-xs text-[#E02814]">
                        +{(task.actualHours - task.estimatedHours).toFixed(1)}h
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[task.status].color}`} />
                    <span className="text-xs">{statusConfig[task.status].label}</span>
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <Badge className={`${getPriorityColor(task.priority)} text-xs px-1.5 py-0`} variant="outline">
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell className="p-2">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <code className="text-sm font-mono text-muted-foreground">{selectedTask?.id}</code>
              <span>{selectedTask?.title}</span>
            </DialogTitle>
            <DialogDescription>{selectedTask?.description}</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Epic</div>
                  <div className="text-sm font-medium text-[#4514F9]">{selectedTask.epicTitle}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Story</div>
                  <div className="text-sm">{selectedTask.storyTitle}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Responsable</div>
                  <div className="text-sm flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {selectedTask.assignee}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Estado</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[selectedTask.status].color}`} />
                    <span className="text-sm">{statusConfig[selectedTask.status].label}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Prioridad</div>
                  <Badge className={`${getPriorityColor(selectedTask.priority)} text-xs`} variant="outline">
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Horas</div>
                  <div className="text-sm flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span className={selectedTask.actualHours > selectedTask.estimatedHours ? "text-[#E02814]" : ""}>
                      {selectedTask.actualHours}h / {selectedTask.estimatedHours}h
                    </span>
                  </div>
                </div>
              </div>
              {selectedTask.githubBranch && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">GitHub</div>
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-[#4514F9]" />
                    <code className="text-xs bg-muted px-2 py-1 rounded">{selectedTask.githubBranch}</code>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{selectedTask.commits} commits</span>
                    <Button variant="ghost" size="sm" className="h-6 ml-auto">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver en GitHub
                    </Button>
                  </div>
                </div>
              )}
              {selectedTask.sprint && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Sprint</div>
                  <Badge variant="outline" className="text-[#4514F9]">
                    {selectedTask.sprint}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
