"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertCircle, Link2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

interface UploadResult {
  row: number
  success: boolean
  message: string
  clienteId?: string
  hasProjects?: boolean
  empresa?: string
}

interface CargarClientesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CargarClientesDialog({
  open,
  onOpenChange,
  onSuccess,
}: CargarClientesDialogProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    total: number
    success: number
    errors: number
    skipped: number
    withProjects?: number
    details: UploadResult[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast.error("Por favor selecciona un archivo CSV")
        return
      }
      setCsvFile(file)
      setResults(null)
    }
  }

  const handleUpload = async () => {
    if (!csvFile) {
      toast.error("Por favor selecciona un archivo CSV")
      return
    }

    setUploading(true)
    setProgress(0)
    setResults(null)

    try {
      // Obtener token de autenticación
      const token = await getIdToken()
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const formData = new FormData()
      formData.append("csv", csvFile)

      const response = await fetch("/api/clientes/upload-historical", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar el CSV")
      }

      setProgress(100)
      setResults({
        total: data.summary.total,
        success: data.summary.success,
        errors: data.summary.errors,
        skipped: data.summary.skipped,
        withProjects: data.summary.withProjects || 0,
        details: data.details,
      })

      if (data.summary.errors === 0 && data.summary.skipped === 0) {
        toast.success(
          `✅ ${data.summary.success} clientes cargados exitosamente`
        )
        if (onSuccess) {
          onSuccess()
        }
        // Cerrar después de 2 segundos si todo fue exitoso
        setTimeout(() => {
          onOpenChange(false)
          setCsvFile(null)
          setResults(null)
          setProgress(0)
        }, 2000)
      } else {
        const message = [
          data.summary.success > 0 && `${data.summary.success} exitosos`,
          data.summary.skipped > 0 && `${data.summary.skipped} omitidos`,
          data.summary.errors > 0 && `${data.summary.errors} con errores`,
        ].filter(Boolean).join(', ')
        
        toast.warning(`⚠️ ${message}`)
        if (data.summary.success > 0 && onSuccess) {
          onSuccess()
        }
      }
    } catch (error: any) {
      console.error("Error uploading CSV:", error)
      toast.error(`Error: ${error.message || "Error desconocido"}`)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false)
      setCsvFile(null)
      setResults(null)
      setProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cargar Clientes desde CSV</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con los datos de los clientes. Los campos vacíos o con "-" serán tratados como opcionales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Archivo CSV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
                className="flex-1"
              />
              {csvFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{csvFile.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              El CSV debe tener las columnas: Empresa, Persona Cobranza, Correo Cobranza,
              CC Cobranza, Cuenta de pago, Datos de pago, Razón Social, RFC, CP, Fiscal Regime,
              UsoCFDI, Calle, Colonia, Localidad, No. Exterior, No. Interior, Municipio,
              Estado, Pais
            </p>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Procesando archivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results && (
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Resultados de la carga</h4>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  {results.success > 0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{results.success} exitosos</span>
                    </div>
                  )}
                  {results.withProjects && results.withProjects > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Link2 className="h-4 w-4" />
                      <span>{results.withProjects} con proyectos</span>
                    </div>
                  )}
                  {results.skipped > 0 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{results.skipped} omitidos</span>
                    </div>
                  )}
                  {results.errors > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>{results.errors} errores</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mostrar clientes con proyectos */}
              {results.withProjects && results.withProjects > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700">Clientes con proyectos en la plataforma:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {results.details
                      .filter((r) => r.success && r.hasProjects)
                      .map((result, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
                          <Link2 className="h-3 w-3 text-blue-600" />
                          <span className="font-medium">{result.empresa || `Fila ${result.row}`}</span>
                          <span className="text-muted-foreground">- Tiene proyectos activos</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {(results.errors > 0 || results.skipped > 0) && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium">Detalles de errores y omisiones:</p>
                  {results.details
                    .filter((r) => !r.success)
                    .map((result, idx) => (
                      <Alert
                        key={idx}
                        variant={result.message.includes('ya existe') ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        <AlertCircle className="h-3 w-3" />
                        <AlertDescription>
                          <strong>Fila {result.row}:</strong> {result.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            {results ? "Cerrar" : "Cancelar"}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!csvFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Cargar Clientes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

