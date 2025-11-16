export type CotizacionDraft = {
  titulo: string
  clienteId: string
  clienteNombre: string
  tipoProyecto: "Dashboard" | "CRM" | "E-commerce" | "App Móvil" | "Website" | "Personalizado"
  descripcion: string
  usarTemplate: boolean
  templateId?: string

  alcance: {
    pantallas: { nombre: string; descripcion: string }[]
    funcionalidades: { nombre: string; descripcion: string; prioridad: "Alta" | "Media" | "Baja" }[]
    flujos: { nombre: string; pasos: string[] }[]
    integraciones: string[]
  }

  archivos: {
    nombre: string
    tipo: "Excel" | "Word" | "PDF" | "Imagen" | "Transcripción"
    url: string
    notas?: string
  }[]

  estimacion: {
    fases: {
      nombre: string
      descripcion: string
      horasArely: number
      horasGaby: number
      horasDesarrollador: number
    }[]
  }

  calculoEconomico: {
    roles: {
      rol: string
      horas: number
      tarifaPorHora: number
      total: number
    }[]
    horasTotales: number
    costoTotal: number
    mensualidad: number
    meses: number
    prototipado: { incluido: boolean; costo: number }
  }

  estado: CotizacionEstado
  contrato: CotizacionContrato
}

export type CotizacionEstado =
  | "Borrador"
  | "Enviada"
  | "En revisión"
  | "Aceptada"
  | "Generando Contrato"
  | "Contrato en Revisión"
  | "Enviada a Firma"
  | "Firmada"
  | "Rechazada"
  | "Convertida"

export type CotizacionContrato = {
  contratoGenerado: boolean
  contratoUrl?: string
  contratoRevisado: boolean
  enviadoAFirma: boolean
  docusignEnvelopeId?: string
  docusignStatus?: "sent" | "delivered" | "completed" | "declined" | "voided"
  fechaEnvioFirma?: string
  fechaFirmado?: string
  firmadoPor?: string
}
