"use client"

import { useEffect, useState } from "react"
import { getCotizacionesConfig } from "@/lib/api/config-api"

export function PasoCalculoEconomico({ data, onChange }: any) {
  const [config, setConfig] = useState<any>(null)
  const [incluirPrototipado, setIncluirPrototipado] = useState(false)
  const [mesesProyecto, setMesesProyecto] = useState(3)

  useEffect(() => {
    async function loadConfig() {
      try {
        const configData = await getCotizacionesConfig()
        setConfig(configData)
      } catch (err) {
        console.error('Error loading config:', err)
      }
    }
    loadConfig()
  }, [])

  useEffect(() => {
    if (config && data.estimacion?.fases) {
      calcularEconomico()
    }
  }, [config, data.estimacion, incluirPrototipado, mesesProyecto])

  const calcularEconomico = () => {
    if (!config) return

    const fases = data.estimacion?.fases || []
    const horasArely = fases.reduce((sum: number, f: any) => sum + (f.horasArely || 0), 0)
    const horasGaby = fases.reduce((sum: number, f: any) => sum + (f.horasGaby || 0), 0)
    const horasDesarrollador = fases.reduce((sum: number, f: any) => sum + (f.horasDesarrollador || 0), 0)

    // Paso 1: Calcular pago mínimo del desarrollador
    const pagoDesarrollador = horasDesarrollador * config.tarifas.desarrollador

    // Paso 2: Ese monto debe ser el 27% del total
    let precioTotal = pagoDesarrollador / (config.porcentajes.desarrollador / 100)

    // Paso 3: Calcular pago de Gaby
    const pagoGaby = precioTotal * (config.porcentajes.gaby / 100)
    const tarifaGabyCalculada = pagoGaby / horasGaby

    // Paso 4: Validar que tarifa de Gaby >= $1,000
    if (tarifaGabyCalculada < config.tarifas.gaby) {
      const pagoGabyMinimo = horasGaby * config.tarifas.gaby
      precioTotal = pagoGabyMinimo / (config.porcentajes.gaby / 100)
    }

    // Calcular desglose
    const desglose = [
      {
        concepto: "Impuestos",
        porcentaje: config.porcentajes.impuestos,
        monto: precioTotal * (config.porcentajes.impuestos / 100),
      },
      {
        concepto: "Arely (Gestión/QA)",
        porcentaje: config.porcentajes.arely,
        monto: precioTotal * (config.porcentajes.arely / 100),
      },
      {
        concepto: "Desarrollador (Back/Deploy)",
        porcentaje: config.porcentajes.desarrollador,
        monto: precioTotal * (config.porcentajes.desarrollador / 100),
      },
      {
        concepto: "Gastos Operativos",
        porcentaje: config.porcentajes.gastosOperativos,
        monto: precioTotal * (config.porcentajes.gastosOperativos / 100),
      },
      {
        concepto: "Marketing",
        porcentaje: config.porcentajes.marketing,
        monto: precioTotal * (config.porcentajes.marketing / 100),
      },
      {
        concepto: "Ahorro",
        porcentaje: config.porcentajes.ahorro,
        monto: precioTotal * (config.porcentajes.ahorro / 100),
      },
      {
        concepto: "Gaby (Diseño/Front)",
        porcentaje: config.porcentajes.gaby,
        monto: precioTotal * (config.porcentajes.gaby / 100),
      },
    ]

    // Agregar prototipado si aplica
    let costoPrototipado = 0
    if (incluirPrototipado) {
      const numFronts = data.alcance?.pantallas?.length || 1
      costoPrototipado = numFronts * config.reglas.costoPrototipadoPorFront * config.reglas.tipoCambioUSD
    }

    const totalConPrototipado = precioTotal + costoPrototipado

    // Calcular mensualidad
    let mensualidad = totalConPrototipado / mesesProyecto

    // Validar mensualidad mínima
    if (mensualidad < config.reglas.mensualidadMinima) {
      mensualidad = config.reglas.mensualidadMinima
      const nuevoTotal = mensualidad * mesesProyecto
      precioTotal = nuevoTotal - costoPrototipado
    }

    onChange({
      ...data,
      desglose: {
        desglose,
        horasTotales: horasArely + horasGaby + horasDesarrollador,
        costoTotal: precioTotal,
        costoPrototipado,
        totalConPrototipado,
        mensualidad,
        meses: mesesProyecto,
        incluirPrototipado,
      },
    })
  }

  if (!config) return <div>Cargando configuración...</div>

  const desglose = data.desglose?.desglose || []

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          El cálculo económico se realiza automáticamente basado en las horas estimadas y la configuración del sistema.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Incluir Prototipado</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={incluirPrototipado}
              onChange={(e) => setIncluirPrototipado(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-muted-foreground">
              ${config.reglas.costoPrototipadoPorFront} USD por pantalla
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Duración del Proyecto (meses)</label>
          <input
            type="number"
            min="1"
            value={mesesProyecto}
            onChange={(e) => setMesesProyecto(Number.parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Concepto</th>
              <th className="text-right p-3 text-sm font-semibold">%</th>
              <th className="text-right p-3 text-sm font-semibold">Monto</th>
            </tr>
          </thead>
          <tbody>
            {desglose.map((item: any, index: number) => (
              <tr key={index} className="border-t">
                <td className="p-3 text-sm">{item.concepto}</td>
                <td className="p-3 text-sm text-right">{item.porcentaje}%</td>
                <td className="p-3 text-sm text-right font-medium">
                  ${item.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {incluirPrototipado && data.desglose?.costoPrototipado > 0 && (
              <tr className="border-t bg-muted/30">
                <td className="p-3 text-sm">Prototipado ({data.alcance?.pantallas?.length || 0} pantallas)</td>
                <td className="p-3 text-sm text-right">-</td>
                <td className="p-3 text-sm text-right font-medium">
                  ${data.desglose.costoPrototipado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
            <tr className="border-t bg-primary/10">
              <td className="p-3 font-semibold">Total</td>
              <td className="p-3 text-right font-semibold">100%</td>
              <td className="p-3 text-right font-semibold text-primary">
                ${(data.desglose?.totalConPrototipado || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Horas Totales</p>
          <p className="text-2xl font-bold">{data.desglose?.horasTotales || 0}h</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Duración</p>
          <p className="text-2xl font-bold">{mesesProyecto} meses</p>
        </div>
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Mensualidad</p>
          <p className="text-2xl font-bold text-primary">
            ${(data.desglose?.mensualidad || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {data.desglose?.mensualidad < config.reglas.mensualidadMinima && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            ⚠️ La mensualidad se ajustó al mínimo de ${config.reglas.mensualidadMinima.toLocaleString("es-MX")} MXN
          </p>
        </div>
      )}
    </div>
  )
}
