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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Edit, X, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

interface TranscriptFeatureGeneratorProps {
  projectId: string
  onGenerateComplete?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface GeneratedFeature {
  epicTitle: string
  title: string
  description: string
  criteriosAceptacion?: string
  comentarios?: string
  tipo: 'Funcionalidad' | 'QA' | 'Bug'
  categoria: 'Funcionalidad' | 'QA' | 'Bugs Generales' | 'Otra'
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'completed'
  priority: 'high' | 'medium' | 'low'
  estimatedHours: number
  storyPoints?: number
  isPossibleDuplicate?: boolean
  duplicateOf?: string | null
  similarityScore?: number
}

type Step = 'input' | 'review' | 'confirming'

export function TranscriptFeatureGenerator({ 
  projectId, 
  onGenerateComplete, 
  open, 
  onOpenChange 
}: TranscriptFeatureGeneratorProps) {
  const [transcript, setTranscript] = useState("")
  const [currentStep, setCurrentStep] = useState<Step>('input')
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generatedFeatures, setGeneratedFeatures] = useState<GeneratedFeature[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(new Set())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<GeneratedFeature | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const MIN_LENGTH = 100
  const MAX_LENGTH = 100000 // Aumentado para soportar reuniones de 1-2 horas
  const characterCount = transcript.length

  const handleClose = () => {
    if (!generating && !creating) {
      setTranscript("")
      setCurrentStep('input')
      setGeneratedFeatures([])
      setSelectedFeatures(new Set())
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
      const token = await getIdToken()
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/features/generate-from-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ transcript: transcript.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al generar funcionalidades')
      }

      const data = await response.json()
      
      console.log('[Transcript Generator] Respuesta recibida:', {
        success: data.success,
        count: data.count,
        featuresLength: data.features?.length || 0
      })
      
      if (!data.features || data.features.length === 0) {
        console.error('[Transcript Generator] No se generaron features. Datos recibidos:', data)
        throw new Error('No se generaron funcionalidades desde el transcript. Esto puede deberse a:\n- El transcript no contiene requisitos o funcionalidades claras\n- El transcript es demasiado largo y necesita ser procesado por partes\n- Intenta ser más específico sobre las funcionalidades mencionadas en la reunión')
      }

      setGeneratedFeatures(data.features)
      // Seleccionar todas por defecto, excepto las que son posibles duplicados
      const defaultSelected = new Set(
        data.features
          .map((_: GeneratedFeature, index: number) => index)
          .filter((index: number) => !data.features[index].isPossibleDuplicate)
      )
      setSelectedFeatures(defaultSelected)
      setCurrentStep('review')
      
      const duplicatesCount = data.features.filter((f: GeneratedFeature) => f.isPossibleDuplicate).length
      toast({
        title: "✅ Funcionalidades generadas",
        description: `Se generaron ${data.features.length} funcionalidades${duplicatesCount > 0 ? ` (${duplicatesCount} posibles duplicados detectados)` : ''}`,
      })
    } catch (err: any) {
      console.error('Error generando funcionalidades:', err)
      setError(err.message || 'Error al generar las funcionalidades')
      toast({
        title: "Error",
        description: err.message || 'Error al generar las funcionalidades',
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const toggleFeatureSelection = (index: number) => {
    const newSelected = new Set(selectedFeatures)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedFeatures(newSelected)
  }

  const toggleAllFeatures = () => {
    if (selectedFeatures.size === generatedFeatures.length) {
      setSelectedFeatures(new Set())
    } else {
      setSelectedFeatures(new Set(generatedFeatures.map((_, index) => index)))
    }
  }

  const handleEditFeature = (index: number) => {
    setEditingIndex(index)
    setEditFormData({ ...generatedFeatures[index] })
  }

  const handleSaveEditedFeature = () => {
    if (editingIndex !== null && editFormData) {
      const updated = [...generatedFeatures]
      updated[editingIndex] = editFormData
      setGeneratedFeatures(updated)
      setEditFormData(null)
      setEditingIndex(null)
      toast({
        title: "Funcionalidad actualizada",
        description: "Los cambios se han guardado localmente",
      })
    }
  }

  const handleCreateFeatures = async () => {
    if (selectedFeatures.size === 0) {
      toast({
        title: "No hay selección",
        description: "Selecciona al menos una funcionalidad para agregar",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    setError(null)

    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const featuresToCreate = Array.from(selectedFeatures)
        .map(index => {
          const feature = generatedFeatures[index]
          // Remover campos de duplicado antes de enviar
          const { isPossibleDuplicate, duplicateOf, similarityScore, ...featureData } = feature
          return featureData
        })
        .filter(Boolean)

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/features/create-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ features: featuresToCreate }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || 'Error al crear funcionalidades')
      }

      const data = await response.json()
      
      toast({
        title: "✅ Funcionalidades creadas",
        description: `Se crearon ${data.count || 0} funcionalidades exitosamente`,
      })

      // Resetear y cerrar
      handleClose()
      if (onGenerateComplete) {
        onGenerateComplete()
      }
    } catch (err: any) {
      console.error('Error creando funcionalidades:', err)
      setError(err.message || 'Error al crear las funcionalidades')
      toast({
        title: "Error",
        description: err.message || 'Error al crear las funcionalidades',
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

  const duplicatesCount = generatedFeatures.filter(f => f.isPossibleDuplicate).length

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent 
          className="!max-w-[85vw] !w-[85vw] max-h-[95vh] overflow-y-auto overflow-x-hidden"
        >
          <DialogHeader>
            <DialogTitle>Generar Funcionalidades desde Transcript</DialogTitle>
            <DialogDescription>
              Pega el transcript de una reunión con el cliente y el sistema generará automáticamente las funcionalidades mencionadas usando IA. Las funcionalidades similares a las existentes se marcarán como posibles duplicados.
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
                    placeholder="Pega aquí el transcript de la reunión con el cliente..."
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
                        Generar Funcionalidades
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
                    <h3 className="font-semibold">Funcionalidades Generadas</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedFeatures.size} de {generatedFeatures.length} seleccionadas
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
                      onClick={toggleAllFeatures}
                      className="text-xs"
                    >
                      {selectedFeatures.size === generatedFeatures.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
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
                                checked={selectedFeatures.size === generatedFeatures.length && generatedFeatures.length > 0}
                                onCheckedChange={toggleAllFeatures}
                              />
                            </TableHead>
                            <TableHead className="w-56">Epic</TableHead>
                            <TableHead className="w-[500px]">Título</TableHead>
                            <TableHead className="w-32">Prioridad</TableHead>
                            <TableHead className="w-28">Horas</TableHead>
                            <TableHead className="w-36">Estado</TableHead>
                            <TableHead className="w-28">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generatedFeatures.map((feature, index) => (
                            <TableRow 
                              key={index}
                              className={feature.isPossibleDuplicate ? "bg-yellow-50/50 border-yellow-200 hover:bg-yellow-50" : ""}
                            >
                              <TableCell className="w-14">
                                <Checkbox
                                  checked={selectedFeatures.has(index)}
                                  onCheckedChange={() => toggleFeatureSelection(index)}
                                />
                              </TableCell>
                              <TableCell className="w-56">
                                <span className="text-xs font-medium text-[#4514F9] break-words">{feature.epicTitle}</span>
                              </TableCell>
                              <TableCell className="w-[500px]">
                                <div className="space-y-1 pr-2">
                                  <div className="flex items-start gap-2 flex-wrap">
                                    <span className="text-sm font-medium break-words">{feature.title}</span>
                                    {feature.isPossibleDuplicate && (
                                      <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 whitespace-nowrap flex-shrink-0">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Posible duplicado
                                      </Badge>
                                    )}
                                  </div>
                                  {feature.description && (
                                    <p className="text-xs text-muted-foreground break-words">
                                      {feature.description}
                                    </p>
                                  )}
                                  {feature.isPossibleDuplicate && feature.duplicateOf && (
                                    <p className="text-xs text-yellow-700 italic break-words">
                                      Similar a: "{feature.duplicateOf}"
                                      {feature.similarityScore && (
                                        <span className="ml-1">({Math.round(feature.similarityScore * 100)}% similar)</span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="w-32">
                                <Badge className={`${getPriorityColor(feature.priority)} text-xs px-1.5 py-0`} variant="outline">
                                  {feature.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-28">
                                <span className="text-xs">{feature.estimatedHours}h</span>
                              </TableCell>
                              <TableCell className="w-36">
                                {feature.isPossibleDuplicate ? (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                    Revisar
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Nueva
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="w-28">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditFeature(index)}
                                  title="Editar funcionalidad"
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
                      <p className="font-semibold mb-1">Funcionalidades similares detectadas</p>
                      <p>
                        Se detectaron {duplicatesCount} funcionalidad{duplicatesCount > 1 ? 'es' : ''} que podrían ser similares a funcionalidades existentes en el proyecto. 
                        Por defecto, estas funcionalidades no están seleccionadas. Revisa cada una y decide si deseas agregarla o si ya existe en el proyecto.
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
                  <Button onClick={handleCreateFeatures} disabled={creating || selectedFeatures.size === 0}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Agregar Funcionalidades Seleccionadas ({selectedFeatures.size})
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
            <DialogTitle>Editar Funcionalidad</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la funcionalidad antes de agregarla al proyecto
            </DialogDescription>
          </DialogHeader>

          {editFormData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-epicTitle">Epic *</Label>
                <Input
                  id="edit-epicTitle"
                  value={editFormData.epicTitle}
                  onChange={(e) => setEditFormData({ ...editFormData, epicTitle: e.target.value })}
                  required
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="edit-criterios">Criterios de Aceptación</Label>
                <Textarea
                  id="edit-criterios"
                  value={editFormData.criteriosAceptacion || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, criteriosAceptacion: e.target.value })}
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
                <Button onClick={handleSaveEditedFeature}>
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
