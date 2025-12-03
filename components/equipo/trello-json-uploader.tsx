"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

interface TrelloJsonUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
}

export function TrelloJsonUploader({ 
  open, 
  onOpenChange, 
  onUploadComplete 
}: TrelloJsonUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleClose = () => {
    if (!uploading) {
      setFile(null)
      setError(null)
      onOpenChange(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar que sea un archivo JSON
      if (!selectedFile.name.endsWith('.json')) {
        setError('El archivo debe ser un JSON (.json)')
        toast({
          title: "Error",
          description: "El archivo debe ser un JSON (.json)",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo JSON')
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo JSON",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Leer el archivo JSON
      const text = await file.text()
      let trelloData: any
      
      try {
        trelloData = JSON.parse(text)
      } catch (parseError) {
        throw new Error('El archivo no es un JSON válido')
      }

      // Validar estructura básica
      if (!trelloData.cards || !Array.isArray(trelloData.cards)) {
        throw new Error('El JSON no tiene la estructura esperada de Trello. Debe contener un array "cards".')
      }

      // Enviar al endpoint
      const token = await getIdToken()
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${API_BASE}/api/team-tasks/import-trello-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trelloData }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(error.error || 'Error procesando JSON de Trello')
      }

      const result = await response.json()
      
      toast({
        title: "✅ Tareas importadas",
        description: result.message || `Se importaron ${result.results?.created || 0} tareas desde Trello`,
      })

      // Recargar tareas
      if (onUploadComplete) {
        onUploadComplete()
      }

      // Cerrar diálogo
      handleClose()
    } catch (err: any) {
      console.error('Error subiendo JSON de Trello:', err)
      setError(err.message || 'Error al subir el archivo JSON')
      toast({
        title: "Error",
        description: err.message || "No se pudieron importar las tareas de Trello",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Tareas desde Trello JSON</DialogTitle>
          <DialogDescription>
            Sube un archivo JSON exportado de Trello. El sistema procesará las tarjetas pendientes usando IA y las convertirá en tareas, actualizando las existentes si coinciden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trello-json-file">Archivo JSON de Trello</Label>
            <Input
              id="trello-json-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !file}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Tareas
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


