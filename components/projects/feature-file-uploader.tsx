"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

interface FeatureFileUploaderProps {
  projectId: string
  onUploadComplete?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FeatureColumnMapping {
  columnName: string
  mappedField: string | null
  confidence?: number
}

interface FeatureAnalyzeFileResponse {
  headers: string[]
  suggestedMappings: FeatureColumnMapping[]
  sampleRows: Record<string, any>[]
}

const FEATURE_FIELDS = [
  { value: "epicTitle", label: "Epic (Requerido)" },
  { value: "title", label: "Título (Requerido)" },
  { value: "description", label: "Descripción" },
  { value: "criteriosAceptacion", label: "Criterios de Aceptación" },
  { value: "comentarios", label: "Comentarios" },
  { value: "tipo", label: "Tipo (Funcionalidad/QA/Bug)" },
  { value: "categoria", label: "Categoría" },
  { value: "priority", label: "Prioridad" },
  { value: "assignee", label: "Responsable" },
  { value: "estimatedHours", label: "Horas Estimadas" },
  { value: "actualHours", label: "Horas Reales" },
  { value: "storyPoints", label: "Story Points" },
  { value: "sprint", label: "Sprint" },
] as const

export function FeatureFileUploader({ projectId, onUploadComplete, open, onOpenChange }: FeatureFileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<FeatureAnalyzeFileResponse | null>(null)
  const [mappings, setMappings] = useState<FeatureColumnMapping[]>([])
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

      const response = await fetch(`/api/projects/${projectId}/features/analyze`, {
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

      const data: FeatureAnalyzeFileResponse = await response.json()
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
        ? { ...m, mappedField }
        : m
    ))
  }

  const handleUpload = async () => {
    if (!file || mappings.length === 0) return

    // Validar que epicTitle y title estén mapeados
    const hasEpicTitle = mappings.some(m => m.mappedField === 'epicTitle')
    const hasTitle = mappings.some(m => m.mappedField === 'title')

    if (!hasEpicTitle) {
      setError('Debes mapear al menos una columna a "Epic (Requerido)"')
      toast({
        title: "Error",
        description: 'El campo Epic es requerido',
        variant: "destructive",
      })
      return
    }

    if (!hasTitle) {
      setError('Debes mapear al menos una columna a "Título (Requerido)"')
      toast({
        title: "Error",
        description: 'El campo Título es requerido',
        variant: "destructive",
      })
      return
    }

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

      const response = await fetch(`/api/projects/${projectId}/features/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Error al subir funcionalidades')
      }

      const data = await response.json()
      
      toast({
        title: "✅ Funcionalidades creadas",
        description: `Se crearon ${data.count || 0} funcionalidades exitosamente`,
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
      console.error('Error subiendo funcionalidades:', err)
      setError(err.message || 'Error al subir las funcionalidades')
      toast({
        title: "Error",
        description: err.message || 'Error al subir las funcionalidades',
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
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Subir Funcionalidades desde Archivo</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV o Excel con las funcionalidades. El sistema analizará automáticamente las columnas y sugerirá cómo mapearlas a los campos estándar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 w-full overflow-x-hidden">
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
                id="feature-file-input"
              />
              <label htmlFor="feature-file-input">
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
            <div className="space-y-4 w-full overflow-x-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">Mapeo de Columnas</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona a qué campo corresponde cada columna de tu archivo. Epic y Título son requeridos.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {analysisResult.headers.length} columnas detectadas
                </div>
              </div>

              <Card className="p-6 space-y-4 w-full overflow-x-hidden">
                {mappings.map((mapping, index) => (
                  <div key={`mapping-${index}-${mapping.columnName}`} className="flex flex-col sm:flex-row items-start gap-4 pb-4 border-b last:border-0 w-full">
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <Label className="text-base font-semibold block mb-2 break-words">{mapping.columnName}</Label>
                      {mapping.confidence !== undefined && (
                        <div className="text-sm text-muted-foreground font-medium">
                          Confianza: {Math.round(mapping.confidence * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="w-full sm:w-auto sm:min-w-[300px] sm:max-w-[450px] flex-shrink-0">
                      <Select
                        value={mapping.mappedField || "none"}
                        onValueChange={(value) => handleMappingChange(mapping.columnName, value === "none" ? null : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar campo" />
                        </SelectTrigger>
                        <SelectContent className="w-full max-w-[450px]">
                          <SelectItem value="none" className="whitespace-normal">
                            No mapear (ir a descripción)
                          </SelectItem>
                          {FEATURE_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value} className="whitespace-normal">
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Preview de filas de ejemplo */}
              {analysisResult.sampleRows.length > 0 && (
                <div className="space-y-3 w-full">
                  <h4 className="text-base font-semibold">Vista previa (primeras 3 filas)</h4>
                  <Card className="p-4 w-full">
                    <div className="w-full max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            {analysisResult.headers.map((header) => (
                              <th key={header} className="text-left p-3 font-medium bg-muted/50 whitespace-nowrap">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.sampleRows.slice(0, 3).map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/30">
                              {analysisResult.headers.map((header) => (
                                <td key={`${idx}-${header}`} className="p-3 text-muted-foreground break-words max-w-[300px]">
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
                      Crear Funcionalidades
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

