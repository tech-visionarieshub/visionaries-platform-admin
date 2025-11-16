"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Clock, Bug, TestTube, Search, Filter, GitBranch, User } from "lucide-react"

// Mock data
const mockTestCases = [
  {
    id: "TC-001",
    taskId: "TASK-12",
    taskTitle: "Sistema de autenticación",
    title: "Validar login con credenciales correctas",
    status: "passed",
    assignee: "María García",
    priority: "high",
    acceptanceCriteria: [
      "Usuario puede ingresar email y contraseña",
      "Sistema valida credenciales contra la base de datos",
      "Redirección al dashboard después de login exitoso",
    ],
    lastTested: "2024-01-15",
    githubIssue: "#234",
  },
  {
    id: "TC-002",
    taskId: "TASK-12",
    taskTitle: "Sistema de autenticación",
    title: "Validar manejo de credenciales incorrectas",
    status: "failed",
    assignee: "María García",
    priority: "high",
    acceptanceCriteria: [
      "Mostrar mensaje de error claro",
      "No revelar si el email existe o no",
      "Bloquear después de 3 intentos fallidos",
    ],
    lastTested: "2024-01-15",
    bugs: 1,
  },
  {
    id: "TC-003",
    taskId: "TASK-15",
    taskTitle: "Dashboard de métricas",
    title: "Verificar carga de gráficos",
    status: "testing",
    assignee: "Carlos Ruiz",
    priority: "medium",
    acceptanceCriteria: [
      "Gráficos cargan en menos de 2 segundos",
      "Datos son precisos y actualizados",
      "Responsive en mobile y desktop",
    ],
    lastTested: "2024-01-16",
  },
  {
    id: "TC-004",
    taskId: "TASK-18",
    taskTitle: "Exportación de reportes",
    title: "Exportar reporte a PDF",
    status: "pending",
    assignee: "Ana López",
    priority: "low",
    acceptanceCriteria: [
      "PDF se genera correctamente",
      "Formato y estilos se mantienen",
      "Descarga automática al finalizar",
    ],
  },
]

const mockBugs = [
  {
    id: "BUG-001",
    testCaseId: "TC-002",
    taskId: "TASK-12",
    title: "Error 500 al intentar login con email muy largo",
    severity: "high",
    status: "open",
    assignee: "Pedro Martínez",
    reportedBy: "María García",
    reportedDate: "2024-01-15",
    description: "Al ingresar un email con más de 100 caracteres, el servidor responde con error 500",
    stepsToReproduce: [
      "Ir a página de login",
      "Ingresar email con 150 caracteres",
      "Click en 'Iniciar sesión'",
      "Observar error 500",
    ],
    githubIssue: "#235",
  },
  {
    id: "BUG-002",
    testCaseId: "TC-003",
    taskId: "TASK-15",
    title: "Gráfico de barras no se renderiza en Safari",
    severity: "medium",
    status: "in-progress",
    assignee: "Pedro Martínez",
    reportedBy: "Carlos Ruiz",
    reportedDate: "2024-01-16",
    description: "El gráfico de barras del dashboard no se muestra correctamente en Safari 16+",
    githubIssue: "#236",
  },
]

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-gray-100 text-gray-700", icon: Clock },
  testing: { label: "En Prueba", color: "bg-blue-100 text-blue-700", icon: TestTube },
  passed: { label: "Aprobado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700", icon: XCircle },
  fixed: { label: "Corregido", color: "bg-purple-100 text-purple-700", icon: CheckCircle2 },
  verified: { label: "Verificado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
}

const severityConfig = {
  low: { label: "Baja", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Media", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Crítica", color: "bg-red-100 text-red-700" },
}

const bugStatusConfig = {
  open: { label: "Abierto", color: "bg-red-100 text-red-700" },
  "in-progress": { label: "En Progreso", color: "bg-blue-100 text-blue-700" },
  fixed: { label: "Corregido", color: "bg-purple-100 text-purple-700" },
  verified: { label: "Verificado", color: "bg-green-100 text-green-700" },
  closed: { label: "Cerrado", color: "bg-gray-100 text-gray-700" },
}

export function QASystem() {
  const [testCases, setTestCases] = useState(mockTestCases)
  const [bugs, setBugs] = useState(mockBugs)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null)
  const [selectedBug, setSelectedBug] = useState<any>(null)

  const filteredTestCases = testCases.filter((tc) => {
    const matchesSearch =
      tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tc.taskTitle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredBugs = bugs.filter((bug) => {
    const matchesSearch = bug.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || bug.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getQAMetrics = () => {
    const total = testCases.length
    const passed = testCases.filter((tc) => tc.status === "passed").length
    const failed = testCases.filter((tc) => tc.status === "failed").length
    const testing = testCases.filter((tc) => tc.status === "testing").length
    const pending = testCases.filter((tc) => tc.status === "pending").length
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

    return { total, passed, failed, testing, pending, passRate }
  }

  const metrics = getQAMetrics()

  return (
    <div className="space-y-4">
      {/* Métricas QA */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Tests</div>
          <div className="text-2xl font-bold text-[#0E0734]">{metrics.total}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Aprobados</div>
          <div className="text-2xl font-bold text-[#95C900]">{metrics.passed}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Fallidos</div>
          <div className="text-2xl font-bold text-[#E02814]">{metrics.failed}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">En Prueba</div>
          <div className="text-2xl font-bold text-[#4514F9]">{metrics.testing}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Pendientes</div>
          <div className="text-2xl font-bold text-gray-500">{metrics.pending}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Pass Rate</div>
          <div className="text-2xl font-bold text-[#4514F9]">{metrics.passRate}%</div>
        </Card>
      </div>

      <Tabs defaultValue="test-cases" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="test-cases">Test Cases ({testCases.length})</TabsTrigger>
            <TabsTrigger value="bugs">Bugs ({bugs.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9 text-sm">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="testing">En Prueba</SelectItem>
                <SelectItem value="passed">Aprobado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="test-cases" className="space-y-2">
          {filteredTestCases.map((tc) => {
            const StatusIcon = statusConfig[tc.status as keyof typeof statusConfig].icon
            return (
              <Card
                key={tc.id}
                className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTestCase(tc)}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{tc.id}</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {tc.taskId}
                          </Badge>
                          <Badge
                            className={`text-xs px-1.5 py-0 ${statusConfig[tc.status as keyof typeof statusConfig].color}`}
                          >
                            {statusConfig[tc.status as keyof typeof statusConfig].label}
                          </Badge>
                          {tc.bugs && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              <Bug className="h-3 w-3 mr-1" />
                              {tc.bugs}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-[#0E0734] truncate">{tc.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{tc.taskTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{tc.assignee}</span>
                      </div>
                      {tc.lastTested && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{tc.lastTested}</span>
                        </div>
                      )}
                      {tc.githubIssue && (
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          <span>{tc.githubIssue}</span>
                        </div>
                      )}
                      <Badge
                        className={`text-xs px-1.5 py-0 ${tc.priority === "high" ? "bg-red-100 text-red-700" : tc.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        {tc.priority === "high" ? "Alta" : tc.priority === "medium" ? "Media" : "Baja"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="bugs" className="space-y-2">
          {filteredBugs.map((bug) => (
            <Card
              key={bug.id}
              className="p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedBug(bug)}
            >
              <div className="flex items-start gap-3">
                <Bug className="h-4 w-4 mt-0.5 text-[#E02814] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{bug.id}</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {bug.testCaseId}
                        </Badge>
                        <Badge
                          className={`text-xs px-1.5 py-0 ${bugStatusConfig[bug.status as keyof typeof bugStatusConfig].color}`}
                        >
                          {bugStatusConfig[bug.status as keyof typeof bugStatusConfig].label}
                        </Badge>
                        <Badge
                          className={`text-xs px-1.5 py-0 ${severityConfig[bug.severity as keyof typeof severityConfig].color}`}
                        >
                          {severityConfig[bug.severity as keyof typeof severityConfig].label}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-medium text-[#0E0734] truncate">{bug.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{bug.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{bug.assignee}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{bug.reportedDate}</span>
                    </div>
                    {bug.githubIssue && (
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        <span>{bug.githubIssue}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog para ver detalles del test case */}
      {selectedTestCase && (
        <Dialog open={!!selectedTestCase} onOpenChange={() => setSelectedTestCase(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{selectedTestCase.id}</span>
                <span>{selectedTestCase.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Relacionada</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedTestCase.taskId}</Badge>
                  <span className="text-sm">{selectedTestCase.taskTitle}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Criterios de Aceptación</label>
                <ul className="mt-2 space-y-1">
                  {selectedTestCase.acceptanceCriteria?.map((criteria: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#95C900] mt-0.5 flex-shrink-0" />
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Marcar como Aprobado
                </Button>
                <Button size="sm" variant="outline">
                  Reportar Bug
                </Button>
                <Button size="sm" variant="outline">
                  Ver en GitHub
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para ver detalles del bug */}
      {selectedBug && (
        <Dialog open={!!selectedBug} onOpenChange={() => setSelectedBug(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-[#E02814]" />
                <span className="font-mono text-sm text-muted-foreground">{selectedBug.id}</span>
                <span>{selectedBug.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedBug.description}</p>
              </div>
              {selectedBug.stepsToReproduce && (
                <div>
                  <label className="text-sm font-medium">Pasos para Reproducir</label>
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    {selectedBug.stepsToReproduce.map((step: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Reportado por</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedBug.reportedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Asignado a</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedBug.assignee}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Marcar como Corregido
                </Button>
                <Button size="sm" variant="outline">
                  Ver en GitHub
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
