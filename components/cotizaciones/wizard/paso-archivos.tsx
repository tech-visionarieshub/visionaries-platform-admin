"use client"

import { Upload, FileText, X } from "lucide-react"

export function PasoArchivos({ data, onChange }: any) {
  const addArchivo = (file: any) => {
    const nuevoArchivo = {
      nombre: file.name,
      tipo:
        file.type.includes("excel") || file.name.endsWith(".xlsx")
          ? "Excel"
          : file.type.includes("word") || file.name.endsWith(".docx")
            ? "Word"
            : file.type.includes("pdf")
              ? "PDF"
              : file.type.includes("image")
                ? "Imagen"
                : "Transcripción",
      url: URL.createObjectURL(file),
      notas: "",
    }

    onChange({
      ...data,
      archivosInput: [...(data.archivosInput || []), nuevoArchivo],
    })
  }

  const removeArchivo = (index: number) => {
    const archivos = (data.archivosInput || []).filter((_: any, i: number) => i !== index)
    onChange({ ...data, archivosInput: archivos })
  }

  const updateNotas = (index: number, notas: string) => {
    const archivos = [...(data.archivosInput || [])]
    archivos[index] = { ...archivos[index], notas }
    onChange({ ...data, archivosInput: archivos })
  }

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">Arrastra archivos aquí o haz click para seleccionar</p>
        <input
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              Array.from(e.target.files).forEach(addArchivo)
            }
          }}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 cursor-pointer"
        >
          Seleccionar archivos
        </label>
        <p className="text-xs text-muted-foreground mt-2">Excel, Word, PDF, Imágenes, Transcripciones</p>
      </div>

      {(data.archivosInput || []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Archivos subidos</h3>
          {data.archivosInput.map((archivo: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{archivo.nombre}</p>
                    <p className="text-sm text-muted-foreground">{archivo.tipo}</p>
                  </div>
                </div>
                <button onClick={() => removeArchivo(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                placeholder="Notas sobre este archivo..."
                value={archivo.notas}
                onChange={(e) => updateNotas(index, e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
