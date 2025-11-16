"use client"

import { Plus, X } from "lucide-react"

export function PasoEstimacion({ data, onChange }: any) {
  const addFase = () => {
    onChange({
      ...data,
      estimacion: {
        ...data.estimacion,
        fases: [
          ...(data.estimacion?.fases || []),
          {
            nombre: "",
            descripcion: "",
            horasArely: 0,
            horasGaby: 0,
            horasDesarrollador: 0,
          },
        ],
      },
    })
  }

  const updateFase = (index: number, field: string, value: any) => {
    const fases = [...(data.estimacion?.fases || [])]
    fases[index] = { ...fases[index], [field]: value }
    onChange({ ...data, estimacion: { ...data.estimacion, fases } })
  }

  const removeFase = (index: number) => {
    const fases = (data.estimacion?.fases || []).filter((_: any, i: number) => i !== index)
    onChange({ ...data, estimacion: { ...data.estimacion, fases } })
  }

  const calcularTotales = () => {
    const fases = data.estimacion?.fases || []
    return {
      arely: fases.reduce((sum: number, f: any) => sum + (f.horasArely || 0), 0),
      gaby: fases.reduce((sum: number, f: any) => sum + (f.horasGaby || 0), 0),
      desarrollador: fases.reduce((sum: number, f: any) => sum + (f.horasDesarrollador || 0), 0),
    }
  }

  const totales = calcularTotales()
  const totalGeneral = totales.arely + totales.gaby + totales.desarrollador

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fases del Proyecto</h3>
        <button
          onClick={addFase}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Agregar Fase
        </button>
      </div>

      <div className="space-y-4">
        {(data.estimacion?.fases || []).map((fase: any, index: number) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre de la fase"
                value={fase.nombre}
                onChange={(e) => updateFase(index, "nombre", e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button onClick={() => removeFase(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              placeholder="Descripción de la fase"
              value={fase.descripcion}
              onChange={(e) => updateFase(index, "descripcion", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={2}
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Horas Arely (Gestión/QA)</label>
                <input
                  type="number"
                  min="0"
                  value={fase.horasArely || 0}
                  onChange={(e) => updateFase(index, "horasArely", Number.parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Horas Gaby (Diseño/Front)</label>
                <input
                  type="number"
                  min="0"
                  value={fase.horasGaby || 0}
                  onChange={(e) => updateFase(index, "horasGaby", Number.parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Horas Dev (Back/Deploy)</label>
                <input
                  type="number"
                  min="0"
                  value={fase.horasDesarrollador || 0}
                  onChange={(e) => updateFase(index, "horasDesarrollador", Number.parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Total fase: {(fase.horasArely || 0) + (fase.horasGaby || 0) + (fase.horasDesarrollador || 0)} horas
            </div>
          </div>
        ))}
      </div>

      {(data.estimacion?.fases || []).length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Totales por Rol</h4>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Arely</p>
              <p className="text-lg font-semibold">{totales.arely}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gaby</p>
              <p className="text-lg font-semibold">{totales.gaby}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Desarrollador</p>
              <p className="text-lg font-semibold">{totales.desarrollador}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total General</p>
              <p className="text-lg font-semibold text-primary">{totalGeneral}h</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
