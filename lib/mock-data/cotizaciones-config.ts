export type CotizacionesConfig = {
  // Tarifas por rol (MXN/hora)
  tarifas: {
    desarrolladorMin: number
    gabyMin: number
  }

  // Porcentajes de distribución (deben sumar 100%)
  porcentajes: {
    impuestos: number
    arely: number
    desarrollador: number
    gastosOperativos: number
    marketing: number
    ahorro: number
    gaby: number
  }

  // Reglas de negocio
  reglas: {
    mensualidadMinima: number
    horasTrabajoSemana: number
    costoPrototipadoUSD: number
    tipoCambioUSD: number
  }
}

// Configuración por defecto basada en el prompt
const defaultConfig: CotizacionesConfig = {
  tarifas: {
    desarrolladorMin: 800, // $800 MXN/hora
    gabyMin: 1000, // $1,000 MXN/hora
  },
  porcentajes: {
    impuestos: 2,
    arely: 5,
    desarrollador: 27,
    gastosOperativos: 18.15,
    marketing: 3,
    ahorro: 5,
    gaby: 40,
  },
  reglas: {
    mensualidadMinima: 64000, // $64,000 MXN
    horasTrabajoSemana: 20,
    costoPrototipadoUSD: 600, // $600 USD por front
    tipoCambioUSD: 20, // Tipo de cambio USD a MXN
  },
}

// Almacenamiento en localStorage
const CONFIG_KEY = "cotizaciones_config"

export function getCotizacionesConfig(): CotizacionesConfig {
  if (typeof window === "undefined") return defaultConfig

  const stored = localStorage.getItem(CONFIG_KEY)
  if (!stored) return defaultConfig

  try {
    return JSON.parse(stored)
  } catch {
    return defaultConfig
  }
}

export function saveCotizacionesConfig(config: CotizacionesConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function resetCotizacionesConfig(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CONFIG_KEY)
}

// Validaciones
export function validateConfig(config: CotizacionesConfig): string[] {
  const errors: string[] = []

  // Validar que los porcentajes sumen 100%
  const totalPorcentajes = Object.values(config.porcentajes).reduce((sum, val) => sum + val, 0)
  if (Math.abs(totalPorcentajes - 100) > 0.01) {
    errors.push(`Los porcentajes deben sumar 100% (actualmente: ${totalPorcentajes.toFixed(2)}%)`)
  }

  // Validar tarifa mínima de Gaby
  if (config.tarifas.gabyMin < 1000) {
    errors.push("La tarifa de Gaby no puede ser menor a $1,000/hora")
  }

  // Validar porcentaje de desarrollador
  if (config.porcentajes.desarrollador < 27) {
    errors.push("El porcentaje del desarrollador debe ser mínimo 27%")
  }

  // Validar valores positivos
  if (config.tarifas.desarrolladorMin <= 0) {
    errors.push("La tarifa del desarrollador debe ser mayor a 0")
  }

  if (config.reglas.mensualidadMinima <= 0) {
    errors.push("La mensualidad mínima debe ser mayor a 0")
  }

  if (config.reglas.tipoCambioUSD <= 0) {
    errors.push("El tipo de cambio debe ser mayor a 0")
  }

  return errors
}

// Calcular tarifa de Arely automáticamente
export function calcularTarifaArely(config: CotizacionesConfig): number {
  // La tarifa de Arely se calcula proporcionalmente según su porcentaje
  const tarifaDev = config.tarifas.desarrolladorMin
  const porcentajeDev = config.porcentajes.desarrollador
  const porcentajeArely = config.porcentajes.arely

  // Si el dev gana $800/hora con 27%, Arely con 5% ganaría:
  return (tarifaDev * porcentajeArely) / porcentajeDev
}
