"use client"

export function PasoAlcance({ data, onChange }: any) {
  const addPantalla = () => {
    onChange({
      ...data,
      alcance: {
        ...data.alcance,
        pantallas: [...(data.alcance?.pantallas || []), { nombre: "", descripcion: "" }],
      },
    })
  }

  const updatePantalla = (index: number, field: string, value: string) => {
    const pantallas = [...(data.alcance?.pantallas || [])]
    pantallas[index] = { ...pantallas[index], [field]: value }
    onChange({ ...data, alcance: { ...data.alcance, pantallas } })
  }

  const removePantalla = (index: number) => {
    const pantallas = (data.alcance?.pantallas || []).filter((_: any, i: number) => i !== index)
    onChange({ ...data, alcance: { ...data.alcance, pantallas } })
  }

  const addFuncionalidad = () => {
    onChange({
      ...data,
      alcance: {
        ...data.alcance,
        funcionalidades: [
          ...(data.alcance?.funcionalidades || []),
          { nombre: "", descripcion: "", prioridad: "Media" },
        ],
      },
    })
  }

  const updateFuncionalidad = (index: number, field: string, value: string) => {
    const funcionalidades = [...(data.alcance?.funcionalidades || [])]
    funcionalidades[index] = { ...funcionalidades[index], [field]: value }
    onChange({ ...data, alcance: { ...data.alcance, funcionalidades } })
  }

  const removeFuncionalidad = (index: number) => {
    const funcionalidades = (data.alcance?.funcionalidades || []).filter((_: any, i: number) => i !== index)
    onChange({ ...data, alcance: { ...data.alcance, funcionalidades } })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pantallas / Vistas</h3>
          <button onClick={addPantalla} className="text-sm text-primary hover:underline">
            + Agregar Pantalla
          </button>
        </div>

        <div className="space-y-3">
          {(data.alcance?.pantallas || []).map((pantalla: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la pantalla"
                  value={pantalla.nombre}
                  onChange={(e) => updatePantalla(index, "nombre", e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={() => removePantalla(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Eliminar
                </button>
              </div>
              <textarea
                placeholder="Descripción de la pantalla"
                value={pantalla.descripcion}
                onChange={(e) => updatePantalla(index, "descripcion", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Funcionalidades</h3>
          <button onClick={addFuncionalidad} className="text-sm text-primary hover:underline">
            + Agregar Funcionalidad
          </button>
        </div>

        <div className="space-y-3">
          {(data.alcance?.funcionalidades || []).map((func: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la funcionalidad"
                  value={func.nombre}
                  onChange={(e) => updateFuncionalidad(index, "nombre", e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <select
                  value={func.prioridad}
                  onChange={(e) => updateFuncionalidad(index, "prioridad", e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
                <button
                  onClick={() => removeFuncionalidad(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Eliminar
                </button>
              </div>
              <textarea
                placeholder="Descripción de la funcionalidad"
                value={func.descripcion}
                onChange={(e) => updateFuncionalidad(index, "descripcion", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
