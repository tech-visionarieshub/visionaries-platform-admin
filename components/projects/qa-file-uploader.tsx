"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { CSVColumnMapping, AnalyzeFileResponse } from "@/types/qa"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

interface QAFileUploaderProps {
  projectId: string
  onUploadComplete?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const QA_FIELDS = [
  { value: "id", label: "ID" },
  { value: "titulo", label: "Título" },
  { value: "categoria", label: "Categoría" },
  { value: "tipo", label: "Tipo" },
  { value: "criterios_aceptacion", label: "Criterios de Aceptación" },
  { value: "estado", label: "Estado" },
  { value: "comentarios", label: "Comentarios" },
] as const

export function QAFileUploader({ projectId, onUploadComplete, open, onOpenChange }: QAFileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeFileResponse | null>(null)
  const [mappings, setMappings] = useState<CSVColumnMapping[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validar tipo de archivo
    const fileName = selectedFile.name.toLowerCase()
    const isCSV = fileName.endsWith('.csv')
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

    if (!isCSV && !isExcel) {
      setError('Formato no soportado. Solo se aceptan CSV o Excel (.xlsx, .xls)')
      return
    }

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError('El archivo es demasiado grande. Tamaño máximo: 10MB')
      return
    }

    setFile(selectedFile)
    setError(null)
    setAnalysisResult(null)
    setMappings([])
  }

  const handleAnalyze = async () => {
    if (!file) return

    setAnalyzing(true)
    setError(null)

    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/projects/${projectId}/qa-tasks/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Error al analizar archivo')
      }

      const data: AnalyzeFileResponse = await response.json()
      setAnalysisResult(data)
      setMappings(data.suggestedMappings || [])
    } catch (err: any) {
      console.error('Error analizando archivo:', err)
      setError(err.message || 'Error al analizar el archivo')
      toast({
        title: "Error",
        description: err.message || 'Error al analizar el archivo',
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleMappingChange = (columnName: string, mappedField: string | null) => {
    setMappings(prev => prev.map(m => 
      m.columnName === columnName 
        ? { ...m, mappedField: mappedField as any }
        : m
    ))
  }

  const handleUpload = async () => {
    if (!file || mappings.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('mappings', JSON.stringify(mappings))

      const response = await fetch(`/api/projects/${projectId}/qa-tasks/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Error al subir tareas')
      }

      const data = await response.json()
      
      toast({
        title: "✅ Tareas creadas",
        description: `Se crearon ${data.count || 0} tareas QA exitosamente`,
      })

      // Resetear estado
      setFile(null)
      setAnalysisResult(null)
      setMappings([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Cerrar dialog y refrescar lista
      onOpenChange(false)
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (err: any) {
      console.error('Error subiendo tareas:', err)
      setError(err.message || 'Error al subir las tareas')
      toast({
        title: "Error",
        description: err.message || 'Error al subir las tareas',
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!analyzing && !uploading) {
      setFile(null)
      setAnalysisResult(null)
      setMappings([])
      setError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Tareas QA desde Archivo</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV o Excel con las tareas QA. El sistema analizará automáticamente las columnas y sugerirá cómo mapearlas a los campos estándar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Paso 1: Seleccionar archivo */}
          <div className="space-y-2">
            <Label>Archivo CSV/Excel</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="qa-file-input"
              />
              <label htmlFor="qa-file-input">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar archivo
                  </span>
                </Button>
              </label>
              {file && (
                <div className="flex items-center gap-2 flex-1">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      setAnalysisResult(null)
                      setMappings([])
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Paso 2: Analizar archivo */}
          {file && !analysisResult && (
            <div className="flex justify-end">
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <File className="mr-2 h-4 w-4" />
                    Analizar archivo
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Paso 3: Mapeo de columnas */}
          {analysisResult && mappings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Mapeo de Columnas</h3>
                <div className="text-sm text-muted-foreground">
                  {analysisResult.headers.length} columnas detectadas
                </div>
              </div>

              <Card className="p-4 space-y-3">
                {mappings.map((mapping) => (
                  <div key={mapping.columnName} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{mapping.columnName}</Label>
                      {mapping.confidence !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Confianza: {Math.round(mapping.confidence * 100)}%
                        </div>
                      )}
                    </div>
                    <Select
                      value={mapping.mappedField || "none"}
                      onValueChange={(value) => handleMappingChange(mapping.columnName, value === "none" ? null : value)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Seleccionar campo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No mapear (ir a comentarios)</SelectItem>
                        {QA_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </Card>

              {/* Preview de filas de ejemplo */}
              {analysisResult.sampleRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Vista previa (primeras 3 filas)</h4>
                  <Card className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {analysisResult.headers.map((header) => (
                              <th key={header} className="text-left p-2 font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.sampleRows.slice(0, 3).map((row, idx) => (
                            <tr key={idx} className="border-b">
                              {analysisResult.headers.map((header) => (
                                <td key={header} className="p-2 text-muted-foreground">
                                  {String(row[header] || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* Botón de upload */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose} disabled={uploading}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Crear Tareas
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

