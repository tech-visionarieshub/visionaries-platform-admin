"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Upload, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { QATask, QATaskCategory, QATaskStatus, QATaskType, QAImage } from "@/types/qa"
import { getIdToken } from "@/lib/firebase/visionaries-tech"
import { QAImageUploader } from "./qa-image-uploader"

interface QATaskEditorProps {
  task: QATask | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

const CATEGORIES: QATaskCategory[] = ["Funcionalidades Nuevas", "QA", "Bugs Generales", "Otra"]
const STATUSES: QATaskStatus[] = ["Pendiente", "En Progreso", "Completado", "Bloqueado", "Cancelado"]
const TYPES: QATaskType[] = ["Funcionalidad", "QA", "Bug"]

export function QATaskEditor({ task, projectId, open, onOpenChange, onSave }: QATaskEditorProps) {
  const [formData, setFormData] = useState<Partial<QATask>>({})
  const [loading, setLoading] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const { toast } = useToast()

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
      })
    }
  }, [task])

  const handleSave = async () => {
    if (!task?.id || !formData.titulo?.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('No hay token disponible')

      const response = await fetch(\`/api/projects/\${projectId}/qa-tasks/\${task.id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Error al guardar')

      toast({ title: "Tarea actualizada" })
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUploadSuccess = (newImage: QAImage) => {
    setFormData(prev => ({
      ...prev,
      imagenes: [...(prev.imagenes || []), newImage],
    }))
    setShowImageUploader(false)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarea QA</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={formData.categoria || "Funcionalidades Nuevas"}
                onValueChange={(value: QATaskCategory) => setFormData(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo || "Funcionalidad"}
                onValueChange={(value: QATaskType) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectContent>
                  {TYPES.map((type) => (
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
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="criterios">Criterios de Aceptación</Label>
            <Textarea
              id="criterios"
              value={formData.criterios_aceptacion || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, criterios_aceptacion: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios</Label>
            <Textarea
              id="comentarios"
              value={formData.comentarios || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Imágenes</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImageUploader(true)}
                disabled={!task}
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir
              </Button>
            </div>

            {formData.imagenes && formData.imagenes.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {formData.imagenes.map((image, index) => (
                  <Card key={index} className="p-2">
                    <img src={image.url} alt={image.name} className="w-full h-32 object-cover rounded-md" />
                    <p className="text-xs text-muted-foreground mt-1 truncate">{image.name}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hay imágenes</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar
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
