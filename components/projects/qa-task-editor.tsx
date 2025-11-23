"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Sparkles, Upload, Download, Trash2, Image as ImageIcon, Link as LinkIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { QATask, QATaskCategory, QATaskStatus, QATaskType, QAImage } from "@/types/qa"
import { getIdToken } from "@/lib/firebase/visionaries-tech"
import { QAImageUploader } from "./qa-image-uploader"
import { getFeatures } from "@/lib/api/features-api"
import type { Feature } from "@/types/feature"
import Link from "next/link"

interface QATaskEditorProps {
  task: QATask | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

const CATEGORIES: QATaskCategory[] = ["Funcionalidad", "QA", "Bugs Generales", "Otra"]
const STATUSES: QATaskStatus[] = ["Pendiente", "En Progreso", "Completado", "Bloqueado", "Cancelado"]
const TYPES: QATaskType[] = ["Funcionalidad", "QA", "Bug"]

export function QATaskEditor({ task, projectId, open, onOpenChange, onSave }: QATaskEditorProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<QATask>>({})
  const [loading, setLoading] = useState(false)
  const [generatingCriteria, setGeneratingCriteria] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [features, setFeatures] = useState<Feature[]>([])
  const [loadingFeatures, setLoadingFeatures] = useState(false)

  const defaultState = useMemo(() => ({
    titulo: "",
    categoria: CATEGORIES[0],
    tipo: TYPES[0],
    criterios_aceptacion: "",
    comentarios: "",
    estado: "Pendiente" as QATaskStatus,
    imagenes: [] as QAImage[],
  }), [])

  useEffect(() => {
    if (task) {
      setFormData({
        id: task.id,
        titulo: task.titulo,
        categoria: task.categoria,
        tipo: task.tipo,
        criterios_aceptacion: task.criterios_aceptacion,
        comentarios: task.comentarios,
        estado: task.estado,
        imagenes: task.imagenes || [],
        featureId: task.featureId,
        featureTitle: task.featureTitle,
        featureNote: task.featureNote,
      })
    } else {
      setFormData(defaultState)
    }
  }, [task, defaultState])

  // Cargar funcionalidades cuando se abre el editor
  useEffect(() => {
    if (open && projectId) {
      loadFeatures()
    }
  }, [open, projectId])

  const loadFeatures = async () => {
    try {
      setLoadingFeatures(true)
      const data = await getFeatures(projectId)
      setFeatures(data)
    } catch (error) {
      console.error('[QATaskEditor] Error loading features:', error)
    } finally {
      setLoadingFeatures(false)
    }
  }

  const handleSave = async () => {
    if (!task?.id) {
      toast({ title: "Error", description: "No se encontró la tarea a actualizar", variant: "destructive" })
      return
    }
    if (!formData.titulo?.trim()) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error("No hay token disponible")
      // Validar que solo uno de featureId o featureNote esté presente
      if (formData.featureId && formData.featureNote) {
        toast({ 
          title: "Error", 
          description: "No se puede especificar funcionalidad y anotación al mismo tiempo", 
          variant: "destructive" 
        })
        return
      }

      const response = await fetch(`/api/projects/${projectId}/qa-tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          titulo: formData.titulo,
          categoria: formData.categoria,
          tipo: formData.tipo,
          criterios_aceptacion: formData.criterios_aceptacion,
          comentarios: formData.comentarios,
          estado: formData.estado,
          imagenes: formData.imagenes || [],
          featureId: formData.featureId || undefined,
          featureNote: formData.featureNote || undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudo actualizar la tarea")
      }
      toast({ title: "Tarea actualizada", description: "Los cambios se guardaron correctamente" })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[QA Task Editor] Error saving task", error)
      toast({ title: "Error", description: error.message || "No se pudo actualizar la tarea", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCriteria = async () => {
    if (!task?.id || !formData.titulo) return
    setGeneratingCriteria(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error("No hay token disponible")
      const response = await fetch(`/api/projects/${projectId}/qa-tasks/${task.id}/generate-criteria`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          titulo: formData.titulo,
          categoria: formData.categoria,
          tipo: formData.tipo,
          comentarios: formData.comentarios,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No fue posible generar los criterios")
      }
      const data = await response.json()
      setFormData(prev => ({ ...prev, criterios_aceptacion: data.criteria }))
      toast({ title: "Criterios generados", description: "Puedes ajustarlos antes de guardar" })
    } catch (error: any) {
      console.error("[QA Task Editor] Error generating criteria", error)
      toast({ title: "Error", description: error.message || "No fue posible generar criterios", variant: "destructive" })
    } finally {
      setGeneratingCriteria(false)
    }
  }

  const handleImageDelete = async (imageUrl: string) => {
    if (!task?.id) return
    try {
      const token = await getIdToken()
      if (!token) throw new Error("No hay token disponible")
      const response = await fetch(`/api/projects/${projectId}/qa-tasks/${task.id}/images?imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudo eliminar la imagen")
      }
      setFormData(prev => ({ ...prev, imagenes: prev.imagenes?.filter(image => image.url !== imageUrl) || [] }))
      toast({ title: "Imagen eliminada", description: "Se eliminó correctamente" })
    } catch (error: any) {
      console.error("[QA Task Editor] Error deleting image", error)
      toast({ title: "Error", description: error.message || "No se pudo eliminar la imagen", variant: "destructive" })
    }
  }

  const handleImageUploadSuccess = (newImage: QAImage) => {
    setFormData(prev => ({ ...prev, imagenes: [...(prev.imagenes || []), newImage] }))
    setShowImageUploader(false)
    toast({ title: "Imagen subida", description: "Ya se agregó a la tarea" })
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task ? (
              <>
                <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
                <span>Editar Tarea QA</span>
              </>
            ) : (
              "Tarea QA"
            )}
          </DialogTitle>
          <DialogDescription>
            Actualiza los campos necesarios y guarda los cambios para tener un historial completo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {task && (
            <div className="space-y-2">
              <Label>ID</Label>
              <Input value={task.id} disabled className="font-mono text-xs" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ej. Validar login con Google"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={formData.categoria || CATEGORIES[0]}
                onValueChange={(value: QATaskCategory) => setFormData(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo || TYPES[0]}
                onValueChange={(value: QATaskType) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.estado || "Pendiente"}
                onValueChange={(value: QATaskStatus) => setFormData(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="criterios">Criterios de aceptación</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateCriteria}
                disabled={generatingCriteria || !formData.titulo}
                className="gap-2"
              >
                {generatingCriteria ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Auto-generar
              </Button>
            </div>
            <Textarea
              id="criterios"
              rows={4}
              placeholder="Especifica qué debe cumplirse para aprobar la tarea"
              value={formData.criterios_aceptacion || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, criterios_aceptacion: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios</Label>
            <Textarea
              id="comentarios"
              rows={3}
              placeholder="Notas adicionales, links, referencias..."
              value={formData.comentarios || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
            />
          </div>

          {/* Sección de Funcionalidad de Origen */}
          <div className="space-y-2 border-t pt-4">
            <Label>Funcionalidad de Origen</Label>
            {formData.featureId ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-[#4514F9]" />
                    <span className="text-sm font-medium">{formData.featureTitle || 'Funcionalidad vinculada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${projectId}/backlog`} target="_blank">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Ver Funcionalidad
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, featureId: undefined, featureTitle: undefined }))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="feature-select">Vincular Funcionalidad</Label>
                  <Select
                    value={formData.featureId || ""}
                    onValueChange={(value) => {
                      const selectedFeature = features.find(f => f.id === value)
                      setFormData(prev => ({
                        ...prev,
                        featureId: value || undefined,
                        featureTitle: selectedFeature?.title,
                        featureNote: undefined, // Limpiar anotación si se selecciona funcionalidad
                      }))
                    }}
                    disabled={loadingFeatures}
                  >
                    <SelectTrigger id="feature-select">
                      <SelectValue placeholder={loadingFeatures ? "Cargando..." : "Seleccionar funcionalidad"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin funcionalidad</SelectItem>
                      {features.map(feature => (
                        <SelectItem key={feature.id} value={feature.id}>
                          {feature.epicTitle} - {feature.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground text-center">o</div>
                <div className="space-y-2">
                  <Label htmlFor="feature-note">Anotación de Origen</Label>
                  <Textarea
                    id="feature-note"
                    rows={2}
                    placeholder="Anotación cuando no hay funcionalidad asociada..."
                    value={formData.featureNote || ""}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        featureNote: e.target.value || undefined,
                        featureId: undefined, // Limpiar featureId si se agrega anotación
                        featureTitle: undefined,
                      }))
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa este campo si la tarea QA no proviene de una funcionalidad específica
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Imágenes / Evidencia</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImageUploader(true)}
                disabled={!task}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Subir imagen
              </Button>
            </div>

            {formData.imagenes && formData.imagenes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {formData.imagenes.map((image) => (
                  <Card key={image.url} className="p-2">
                    <div className="relative group">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          onClick={() => window.open(image.url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => handleImageDelete(image.url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 truncate">{image.name}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aún no se han subido imágenes</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.titulo?.trim()} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </DialogFooter>

        {showImageUploader && task && (
          <QAImageUploader
            projectId={projectId}
            taskId={task.id}
            open={showImageUploader}
            onOpenChange={setShowImageUploader}
            onUploadSuccess={handleImageUploadSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
