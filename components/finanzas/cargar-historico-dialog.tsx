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
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface UploadResult {
  row: number
  success: boolean
  message: string
  egresoId?: string
}

interface CargarHistoricoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CargarHistoricoDialog({
  open,
  onOpenChange,
  onSuccess,
}: CargarHistoricoDialogProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    total: number
    success: number
    errors: number
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
      const formData = new FormData()
      formData.append("csv", csvFile)

      const response = await fetch("/api/egresos/upload-historical", {
        method: "POST",
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
        details: data.details,
      })

      if (data.summary.errors === 0) {
        toast.success(
          `✅ ${data.summary.success} egresos cargados exitosamente`
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
        toast.warning(
          `⚠️ ${data.summary.success} exitosos, ${data.summary.errors} con errores`
        )
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
          <DialogTitle>Cargar Histórico de Egresos</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con el histórico de egresos basados en horas.
            Las columnas de Factura y Comprobante deben contener URLs de Google Drive.
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
              El CSV debe tener las columnas: Línea de negocio, Categoría, Empresa,
              Equipo, Concepto, Subtotal, IVA, Total, Tipo, Mes, Status, Factura,
              Comprobante, Fecha pago
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
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{results.success} exitosos</span>
                  </div>
                  {results.errors > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>{results.errors} errores</span>
                    </div>
                  )}
                </div>
              </div>

              {results.errors > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-red-600">Errores:</p>
                  {results.details
                    .filter((r) => !r.success)
                    .map((result, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 bg-red-50 rounded border border-red-200"
                      >
                        <strong>Fila {result.row}:</strong> {result.message}
                      </div>
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
                Cargar Histórico
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

