"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, FileText, Loader2, CheckCircle2, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"

// Mock data para documentos de Drive
const mockDriveDocuments = [
  { id: "1", name: "PRD - Sistema de Autenticación.docx", url: "https://drive.google.com/..." },
  { id: "2", name: "Especificaciones - Dashboard Analytics.pdf", url: "https://drive.google.com/..." },
  { id: "3", name: "Requerimientos - App Mobile.docx", url: "https://drive.google.com/..." },
]

// Mock team members
const mockTeamMembers = [
  { id: "1", name: "Carlos Ruiz", role: "Frontend", availability: 30 },
  { id: "2", name: "Ana García", role: "Backend", availability: 40 },
  { id: "3", name: "Luis Torres", role: "Fullstack", availability: 35 },
  { id: "4", name: "María López", role: "QA", availability: 25 },
]

interface GeneratedTask {
  id: string
  type: "epic" | "story" | "task"
  title: string
  description: string
  acceptanceCriteria: string[]
  estimatedHours: number
  suggestedAssignee: string
  priority: "low" | "medium" | "high"
  parent?: string
}

export function AITaskGenerator() {
  const [selectedDoc, setSelectedDoc] = useState("")
  const [driveUrl, setDriveUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Simular generación con IA
  const handleGenerate = async () => {
    if (!selectedDoc && !driveUrl) {
      toast.error("Selecciona un documento o ingresa un link de Drive")
      return
    }

    setIsGenerating(true)

    // Simular delay de procesamiento
    await new Promise((r) => setTimeout(r, 3000))

    // Generar tasks mock
    const mockGenerated: GeneratedTask[] = [
      {
        id: "epic-1",
        type: "epic",
        title: "Sistema de Autenticación Completo",
        description: "Implementar sistema de autenticación con múltiples proveedores y gestión de sesiones",
        acceptanceCriteria: [
          "Usuarios pueden registrarse con email/password",
          "Integración con Google y GitHub OAuth",
          "Sistema de recuperación de contraseña",
          "Gestión de sesiones y tokens",
        ],
        estimatedHours: 80,
        suggestedAssignee: "Ana García",
        priority: "high",
      },
      {
        id: "story-1",
        type: "story",
        title: "Registro de usuarios con email",
        description: "Permitir a los usuarios crear cuenta usando email y contraseña",
        acceptanceCriteria: [
          "Formulario de registro con validación",
          "Verificación de email",
          "Encriptación de contraseñas",
        ],
        estimatedHours: 16,
        suggestedAssignee: "Carlos Ruiz",
        priority: "high",
        parent: "epic-1",
      },
      {
        id: "task-1",
        type: "task",
        title: "Crear componente de formulario de registro",
        description: "Desarrollar el componente React para el formulario de registro con validación en tiempo real",
        acceptanceCriteria: [
          "Validación de email format",
          "Validación de contraseña (min 8 caracteres)",
          "Mensajes de error claros",
        ],
        estimatedHours: 4,
        suggestedAssignee: "Carlos Ruiz",
        priority: "high",
        parent: "story-1",
      },
      {
        id: "task-2",
        type: "task",
        title: "Implementar API endpoint de registro",
        description: "Crear endpoint POST /api/auth/register con validación y encriptación",
        acceptanceCriteria: [
          "Validar datos de entrada",
          "Encriptar contraseña con bcrypt",
          "Guardar usuario en base de datos",
        ],
        estimatedHours: 6,
        suggestedAssignee: "Ana García",
        priority: "high",
        parent: "story-1",
      },
      {
        id: "task-3",
        type: "task",
        title: "Configurar envío de email de verificación",
        description: "Integrar servicio de email para enviar verificación al registrarse",
        acceptanceCriteria: [
          "Generar token de verificación",
          "Enviar email con link de verificación",
          "Validar token al hacer clic",
        ],
        estimatedHours: 6,
        suggestedAssignee: "Ana García",
        priority: "medium",
        parent: "story-1",
      },
      {
        id: "story-2",
        type: "story",
        title: "OAuth con Google y GitHub",
        description: "Implementar autenticación con proveedores externos",
        acceptanceCriteria: [
          "Botones de OAuth en UI",
          "Flujo de autorización completo",
          "Creación automática de usuario",
        ],
        estimatedHours: 24,
        suggestedAssignee: "Luis Torres",
        priority: "high",
        parent: "epic-1",
      },
      {
        id: "story-3",
        type: "story",
        title: "Recuperación de contraseña",
        description: "Sistema para que usuarios puedan resetear su contraseña",
        acceptanceCriteria: [
          "Formulario de solicitud de reset",
          "Email con link temporal",
          "Formulario de nueva contraseña",
        ],
        estimatedHours: 12,
        suggestedAssignee: "Carlos Ruiz",
        priority: "medium",
        parent: "epic-1",
      },
    ]

    setGeneratedTasks(mockGenerated)
    setIsGenerating(false)
    setShowPreview(true)
    toast.success("Tasks generadas exitosamente con IA")
  }

  const handleEditTask = (taskId: string) => {
    toast.info("Edición de task (funcionalidad mock)")
  }

  const handleDeleteTask = (taskId: string) => {
    setGeneratedTasks((prev) => prev.filter((t) => t.id !== taskId))
    toast.success("Task eliminada")
  }

  const handleConfirmImport = () => {
    toast.success(`${generatedTasks.length} tasks importadas al backlog`)
    setShowPreview(false)
    setGeneratedTasks([])
    setSelectedDoc("")
    setDriveUrl("")
  }

  const totalHours = generatedTasks.reduce((sum, task) => sum + task.estimatedHours, 0)
  const epicCount = generatedTasks.filter((t) => t.type === "epic").length
  const storyCount = generatedTasks.filter((t) => t.type === "story").length
  const taskCount = generatedTasks.filter((t) => t.type === "task").length

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Generación Automática con IA</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Seleccionar documento de Google Drive</Label>
              <Select value={selectedDoc} onValueChange={setSelectedDoc}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un documento..." />
                </SelectTrigger>
                <SelectContent>
                  {mockDriveDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {doc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground">o</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <div>
              <Label>Link de Google Drive</Label>
              <Input
                placeholder="https://docs.google.com/document/d/..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
              />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || (!selectedDoc && !driveUrl)} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Epics, Stories y Tasks
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview de Tasks Generadas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Epics</div>
                <div className="text-2xl font-bold">{epicCount}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Stories</div>
                <div className="text-2xl font-bold">{storyCount}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Tasks</div>
                <div className="text-2xl font-bold">{taskCount}</div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Total Horas</div>
                <div className="text-2xl font-bold">{totalHours}h</div>
              </Card>
            </div>

            {/* Tasks List */}
            <div className="space-y-2">
              {generatedTasks.map((task) => (
                <Card key={task.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={task.type === "epic" ? "default" : task.type === "story" ? "secondary" : "outline"}
                        >
                          {task.type}
                        </Badge>
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                        {task.parent && <span className="text-xs text-muted-foreground">→ {task.parent}</span>}
                      </div>

                      <div>
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                      </div>

                      {task.acceptanceCriteria.length > 0 && (
                        <div className="text-xs">
                          <div className="font-medium mb-1">Criterios de aceptación:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            {task.acceptanceCriteria.map((criteria, i) => (
                              <li key={i}>{criteria}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>⏱️ {task.estimatedHours}h estimadas</span>
                        <span>👤 {task.suggestedAssignee}</span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditTask(task.id)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleConfirmImport} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Importar {generatedTasks.length} Tasks al Backlog
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Availability */}
      <Card className="p-4">
        <h4 className="font-medium text-sm mb-3">Disponibilidad del Equipo</h4>
        <div className="space-y-2">
          {mockTeamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{member.name}</span>
                <span className="text-muted-foreground ml-2">({member.role})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(member.availability / 40) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">{member.availability}h/sem</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
