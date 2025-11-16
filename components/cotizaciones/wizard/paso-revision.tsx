"use client"

import { FileText, Download, Send } from "lucide-react"

export function PasoRevision({ data, onComplete }: any) {
  const generarPrompts = () => {
    alert("Generación de prompts para v0 (simulado con IA)")
  }

  const generarMensaje = () => {
    alert("Generación de mensaje para cliente (simulado con IA)")
  }

  const descargarPDF = () => {
    alert("Descarga de PDF (simulado)")
  }

  const guardarBorrador = () => {
    onComplete("Borrador")
  }

  const enviarCliente = () => {
    onComplete("Enviada")
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          ✓ Cotización lista para revisión. Verifica todos los datos antes de enviar al cliente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold">Información del Proyecto</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Título:</span>
              <span className="ml-2 font-medium">{data.titulo}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cliente:</span>
              <span className="ml-2 font-medium">{data.clienteNombre}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span>
              <span className="ml-2 font-medium">{data.tipoProyecto}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Resumen Económico</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-2 font-medium">
                ${(data.desglose?.totalConPrototipado || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Mensualidad:</span>
              <span className="ml-2 font-medium">
                ${(data.desglose?.mensualidad || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Duración:</span>
              <span className="ml-2 font-medium">{data.desglose?.meses || 0} meses</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Alcance</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Pantallas:</span>
            <span className="ml-2 font-medium">{data.alcance?.pantallas?.length || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Funcionalidades:</span>
            <span className="ml-2 font-medium">{data.alcance?.funcionalidades?.length || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Archivos subidos:</span>
            <span className="ml-2 font-medium">{data.archivosInput?.length || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Horas totales:</span>
            <span className="ml-2 font-medium">{data.desglose?.horasTotales || 0}h</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Entregables</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={generarPrompts}
            className="flex items-center justify-center gap-2 px-4 py-3 border rounded-md hover:bg-muted/50 text-sm"
          >
            <FileText className="h-4 w-4" />
            Generar Prompts v0
          </button>
          <button
            onClick={generarMensaje}
            className="flex items-center justify-center gap-2 px-4 py-3 border rounded-md hover:bg-muted/50 text-sm"
          >
            <Send className="h-4 w-4" />
            Mensaje Cliente
          </button>
          <button
            onClick={descargarPDF}
            className="flex items-center justify-center gap-2 px-4 py-3 border rounded-md hover:bg-muted/50 text-sm"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="border-t pt-6 flex gap-3">
        <button onClick={guardarBorrador} className="flex-1 px-6 py-3 border rounded-md hover:bg-muted/50 font-medium">
          Guardar como Borrador
        </button>
        <button
          onClick={enviarCliente}
          className="flex-1 px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
        >
          Enviar al Cliente
        </button>
      </div>
    </div>
  )
}
