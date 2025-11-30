"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Edit, X, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getIdToken } from "@/lib/firebase/visionaries-tech"
import { generateTeamTasksFromTranscript, createTeamTask } from "@/lib/api/team-tasks-api"
import { useUser } from "@/hooks/use-user"
import type { TeamTaskCategory } from "@/types/team-task"

interface TranscriptTaskGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerateComplete?: () => void
}

interface GeneratedTask {
  title: string
  description: string
  category: TeamTaskCategory
  customCategory?: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'review' | 'completed' | 'cancelled'
  estimatedHours: number
  isPossibleDuplicate?: boolean
  duplicateOf?: string | null
  similarityScore?: number
}

type Step = 'input' | 'review' | 'confirming'

export function TranscriptTaskGenerator({ 
  open, 
  onOpenChange, 
  onGenerateComplete 
}: TranscriptTaskGeneratorProps) {
  const [transcript, setTranscript] = useState("")
  const [currentStep, setCurrentStep] = useState<Step>('input')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<GeneratedTask | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useUser()

  const MIN_LENGTH = 100
  const MAX_LENGTH = 100000
  const characterCount = transcript.length

  const handleClose = () => {
    if (!generating && !creating) {
      setTranscript("")
      setCurrentStep('input')
      setGeneratedTasks([])
      setSelectedTasks(new Set())
      setEditingIndex(null)
      setEditFormData(null)
      setError(null)
      onOpenChange(false)
    }
  }

  const handleGenerate = async () => {
    if (transcript.trim().length < MIN_LENGTH) {
      setError(`El transcript debe tener al menos ${MIN_LENGTH} caracteres`)
      toast({
        title: "Error",
        description: `El transcript debe tener al menos ${MIN_LENGTH} caracteres`,
        variant: "destructive",
      })
      return
    }

    if (transcript.trim().length > MAX_LENGTH) {
      setError(`El transcript no puede exceder ${MAX_LENGTH} caracteres`)
      toast({
        title: "Error",
        description: `El transcript no puede exceder ${MAX_LENGTH} caracteres`,
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const tasks = await generateTeamTasksFromTranscript(transcript.trim())
      
      setGeneratedTasks(tasks)
      // Seleccionar todas por defecto, excepto las que son posibles duplicados
      const defaultSelected = new Set(
        tasks
          .map((_: GeneratedTask, index: number) => index)
          .filter((index: number) => !tasks[index].isPossibleDuplicate)
      )
      setSelectedTasks(defaultSelected)
      setCurrentStep('review')
      
      const duplicatesCount = tasks.filter((t: GeneratedTask) => t.isPossibleDuplicate).length
      toast({
        title: "✅ Tareas generadas",
        description: `Se generaron ${tasks.length} tareas${duplicatesCount > 0 ? ` (${duplicatesCount} posibles duplicados detectados)` : ''}`,
      })
    } catch (err: any) {
      console.error('Error generando tareas:', err)
      setError(err.message || 'Error al generar las tareas')
      toast({
        title: "Error",
        description: err.message || 'Error al generar las tareas',
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const toggleTaskSelection = (index: number) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTasks(newSelected)
  }

  const toggleAllTasks = () => {
    if (selectedTasks.size === generatedTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(generatedTasks.map((_, index) => index)))
    }
  }

  const handleEditTask = (index: number) => {
    setEditingIndex(index)
    setEditFormData({ ...generatedTasks[index] })
  }

  const handleSaveEditedTask = () => {
    if (editingIndex !== null && editFormData) {
      const updated = [...generatedTasks]
      updated[editingIndex] = editFormData
      setGeneratedTasks(updated)
      setEditFormData(null)
      setEditingIndex(null)
      toast({
        title: "Tarea actualizada",
        description: "Los cambios se han guardado localmente",
      })
    }
  }

  const handleCreateTasks = async () => {
    if (selectedTasks.size === 0) {
      toast({
        title: "No hay selección",
        description: "Selecciona al menos una tarea para agregar",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    setError(null)

    try {
      const tasksToCreate = Array.from(selectedTasks)
        .map(index => {
          const task = generatedTasks[index]
          // Remover campos de duplicado antes de enviar
          const { isPossibleDuplicate, duplicateOf, similarityScore, ...taskData } = task
          return taskData
        })
        .filter(Boolean)

      // Crear tareas una por una
      for (const taskData of tasksToCreate) {
        await createTeamTask({
          ...taskData,
          createdBy: user?.email || 'unknown',
          assignee: user?.email || undefined,
        })
      }
      
      toast({
        title: "✅ Tareas creadas",
        description: `Se crearon ${tasksToCreate.length} tareas exitosamente`,
      })

      // Resetear y cerrar
      handleClose()
      if (onGenerateComplete) {
        onGenerateComplete()
      }
    } catch (err: any) {
      console.error('Error creando tareas:', err)
      setError(err.message || 'Error al crear las tareas')
      toast({
        title: "Error",
        description: err.message || 'Error al crear las tareas',
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

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

  const duplicatesCount = generatedTasks.filter(t => t.isPossibleDuplicate).length

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent 
          className="!max-w-[85vw] !w-[85vw] max-h-[95vh] overflow-y-auto overflow-x-hidden"
        >
          <DialogHeader>
            <DialogTitle>Generar Tareas desde Transcript</DialogTitle>
            <DialogDescription>
              Pega el transcript de una reunión y el sistema generará automáticamente las tareas mencionadas usando IA. Las tareas similares a las existentes se marcarán como posibles duplicados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 w-full overflow-x-hidden">
            {/* Paso 1: Input de Transcript */}
            {currentStep === 'input' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transcript">Transcript de la Reunión</Label>
                  <Textarea
                    id="transcript"
                    value={transcript}
                    onChange={(e) => {
                      setTranscript(e.target.value)
                      setError(null)
                    }}
                    placeholder="Pega aquí el transcript de la reunión..."
                    rows={12}
                    className="font-mono text-sm"
                    disabled={generating}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {characterCount < MIN_LENGTH 
                        ? `Mínimo ${MIN_LENGTH} caracteres (faltan ${MIN_LENGTH - characterCount})`
                        : characterCount > MAX_LENGTH
                        ? `Excede el límite de ${MAX_LENGTH} caracteres`
                        : `${characterCount} / ${MAX_LENGTH} caracteres`}
                    </span>
                    {characterCount > MAX_LENGTH && (
                      <span className="text-destructive">El transcript es demasiado largo</span>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleClose} disabled={generating}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating || characterCount < MIN_LENGTH || characterCount > MAX_LENGTH}>
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando con IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generar Tareas
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 2: Revisión y Selección */}
            {currentStep === 'review' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Tareas Generadas</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedTasks.size} de {generatedTasks.length} seleccionadas
                      {duplicatesCount > 0 && (
                        <span className="ml-2 text-yellow-600">
                          • {duplicatesCount} posible{duplicatesCount > 1 ? 's' : ''} duplicado{duplicatesCount > 1 ? 's' : ''} detectado{duplicatesCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllTasks}
                      className="text-xs"
                    >
                      {selectedTasks.size === generatedTasks.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep('input')}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Volver
                    </Button>
                  </div>
                </div>

                <Card className="overflow-visible">
                  <div className="max-h-[500px] overflow-y-auto overflow-x-visible">
                    <div className="w-full">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-14">
                              <Checkbox
                                checked={selectedTasks.size === generatedTasks.length && generatedTasks.length > 0}
                                onCheckedChange={toggleAllTasks}
                              />
                            </TableHead>
                            <TableHead className="w-[500px]">Título</TableHead>
                            <TableHead className="w-32">Categoría</TableHead>
                            <TableHead className="w-32">Prioridad</TableHead>
                            <TableHead className="w-28">Horas</TableHead>
                            <TableHead className="w-28">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generatedTasks.map((task, index) => (
                            <TableRow 
                              key={index}
                              className={task.isPossibleDuplicate ? "bg-yellow-50/50 border-yellow-200 hover:bg-yellow-50" : ""}
                            >
                              <TableCell className="w-14">
                                <Checkbox
                                  checked={selectedTasks.has(index)}
                                  onCheckedChange={() => toggleTaskSelection(index)}
                                />
                              </TableCell>
                              <TableCell className="w-[500px]">
                                <div className="space-y-1 pr-2">
                                  <div className="flex items-start gap-2 flex-wrap">
                                    <span className="text-sm font-medium break-words">{task.title}</span>
                                    {task.isPossibleDuplicate && (
                                      <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 whitespace-nowrap flex-shrink-0">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Posible duplicado
                                      </Badge>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground break-words">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.isPossibleDuplicate && task.duplicateOf && (
                                    <p className="text-xs text-yellow-700 italic break-words">
                                      Similar a: "{task.duplicateOf}"
                                      {task.similarityScore && (
                                        <span className="ml-1">({Math.round(task.similarityScore * 100)}% similar)</span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="w-32">
                                <Badge variant="outline" className="text-xs">
                                  {task.category === 'Otra' ? (task.customCategory || 'Otra') : task.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-32">
                                <Badge className={`${getPriorityColor(task.priority)} text-xs px-1.5 py-0`} variant="outline">
                                  {task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-28">
                                <span className="text-xs">{task.estimatedHours}h</span>
                              </TableCell>
                              <TableCell className="w-28">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditTask(index)}
                                  title="Editar tarea"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </Card>

                {duplicatesCount > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-semibold mb-1">Tareas similares detectadas</p>
                      <p>
                        Se detectaron {duplicatesCount} tarea{duplicatesCount > 1 ? 's' : ''} que podrían ser similares a tareas existentes. 
                        Por defecto, estas tareas no están seleccionadas. Revisa cada una y decide si deseas agregarla o si ya existe.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('input')} disabled={creating}>
                    Volver
                  </Button>
                  <Button onClick={handleCreateTasks} disabled={creating || selectedTasks.size === 0}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Agregar Tareas Seleccionadas ({selectedTasks.size})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de edición inline */}
      <Dialog open={editingIndex !== null && editFormData !== null} onOpenChange={(open) => {
        if (!open) {
          setEditFormData(null)
          setEditingIndex(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la tarea antes de agregarla
            </DialogDescription>
          </DialogHeader>

          {editFormData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Prioridad</Label>
                  <Select
                    value={editFormData.priority}
                    onValueChange={(value: 'high' | 'medium' | 'low') => setEditFormData({ ...editFormData, priority: value })}
                  >
                    <SelectTrigger id="edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-hours">Horas Estimadas</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={editFormData.estimatedHours}
                    onChange={(e) => setEditFormData({ ...editFormData, estimatedHours: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setEditFormData(null)
                  setEditingIndex(null)
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEditedTask}>
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

