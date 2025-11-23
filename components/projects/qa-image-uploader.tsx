"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { QAImage } from "@/types/qa"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

interface QAImageUploaderProps {
  projectId: string
  taskId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess: (image: QAImage) => void
}

export function QAImageUploader({ projectId, taskId, open, onOpenChange, onUploadSuccess }: QAImageUploaderProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede ser mayor a 10MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error("No hay token disponible")

      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/projects/${projectId}/qa-tasks/${taskId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir imagen')
      }

      const data = await response.json()
      onUploadSuccess(data.image)
      onOpenChange(false)
    } catch (error: any) {
      console.error('[QA Image Uploader] Error:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }, [projectId, taskId, toast, onUploadSuccess, onOpenChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir Imagen</DialogTitle>
          <DialogDescription>
            Arrastra una imagen aquí o haz clic para seleccionar
          </DialogDescription>
        </DialogHeader>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }`}
        >
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Haz clic para seleccionar o arrastra aquí
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF hasta 10MB
                  </p>
                </div>
              </>
            )}
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
