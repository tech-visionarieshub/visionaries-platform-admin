"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
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

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

export function QAImageUploader({ projectId, taskId, open, onOpenChange, onUploadSuccess }: QAImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (selectedFile: File) => {
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast({ title: "Tipo de archivo no válido", description: "Solo se aceptan imágenes", variant: "destructive" })
      return
    }

    if (selectedFile.size > MAX_SIZE) {
      toast({
        title: "Archivo demasiado grande",
        description: `El tamaño máximo es ${MAX_SIZE / 1024 / 1024}MB`,
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Error", description: "Selecciona un archivo primero", variant: "destructive" })
      return
    }

    setUploading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error("No hay token disponible")

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/projects/${projectId}/qa-tasks/${taskId}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "No se pudo subir la imagen")
      }

      const data = await response.json()
      onUploadSuccess(data.image)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("[QA Image Uploader] Error uploading image", error)
      toast({ title: "Error", description: error.message || "No se pudo subir la imagen", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (uploading) return
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Imagen</DialogTitle>
          <DialogDescription>Sube una imagen o screenshot (máx. 5MB)</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-[#4514F9] bg-[#4514F9]/5' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />

            {file ? (
              <div className="space-y-2">
                <ImageIcon className="h-12 w-12 text-[#4514F9] mx-auto" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <Button variant="outline" size="sm" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }} className="gap-2">
                  <X className="h-4 w-4" />
                  Cambiar archivo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-sm text-muted-foreground">Arrastra una imagen aquí o haz clic para seleccionar</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Seleccionar archivo
                </Button>
                <p className="text-xs text-muted-foreground">Formatos permitidos: JPG, PNG, GIF, WEBP. Máx 5MB.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading} className="gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Subiendo..." : "Subir Imagen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
