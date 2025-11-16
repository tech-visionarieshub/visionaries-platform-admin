export type EstadoCotizacion =
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

export type TipoProyecto = "Dashboard" | "CRM" | "E-commerce" | "App Móvil" | "Website" | "Personalizado"

export type ContratoInfo = {
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

export type Cotizacion = {
  id: string
  folio: string
  titulo: string
  clienteId: string
  clienteNombre: string
  estado: EstadoCotizacion
  tipoProyecto: TipoProyecto
  fechaCreacion: string
  fechaEnvio?: string
  fechaRespuesta?: string

  alcance: {
    descripcion: string
    pantallas: { nombre: string; descripcion: string }[]
    funcionalidades: { nombre: string; descripcion: string; prioridad: "Alta" | "Media" | "Baja" }[]
    flujos: { nombre: string; pasos: string[] }[]
  }

  archivosInput: {
    nombre: string
    tipo: "Excel" | "Word" | "PDF" | "Imagen" | "Transcripción"
    url: string
  }[]

  desglose: {
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

  contrato: ContratoInfo

  // IDs de vinculación
  proyectoId?: string
  templateId?: string
}

export const mockCotizaciones: Cotizacion[] = [
  {
    id: "1",
    folio: "COT-2025-001",
    titulo: "Sistema de Gestión de Inventarios",
    clienteId: "1",
    clienteNombre: "Tech Solutions SA de CV",
    estado: "Convertida",
    tipoProyecto: "Dashboard",
    fechaCreacion: "2025-01-15",
    fechaEnvio: "2025-01-16",
    fechaRespuesta: "2025-01-20",
    alcance: {
      descripcion:
        "Sistema completo de gestión de inventarios con control de entradas, salidas, alertas de stock mínimo y reportes en tiempo real.",
      pantallas: [
        { nombre: "Dashboard", descripcion: "Vista general con métricas de inventario" },
        { nombre: "Catálogo de Productos", descripcion: "Gestión completa de productos" },
        { nombre: "Movimientos", descripcion: "Registro de entradas y salidas" },
        { nombre: "Reportes", descripcion: "Reportes detallados y exportación" },
      ],
      funcionalidades: [
        { nombre: "Control de Stock", descripcion: "Seguimiento en tiempo real", prioridad: "Alta" },
        { nombre: "Alertas Automáticas", descripcion: "Notificaciones de stock mínimo", prioridad: "Alta" },
        { nombre: "Multi-almacén", descripcion: "Gestión de múltiples ubicaciones", prioridad: "Media" },
      ],
      flujos: [],
    },
    archivosInput: [],
    desglose: {
      roles: [
        { rol: "Arely", horas: 24, tarifaPorHora: 500, total: 12000 },
        { rol: "Gaby", horas: 96, tarifaPorHora: 1200, total: 115200 },
        { rol: "Desarrollador", horas: 120, tarifaPorHora: 800, total: 96000 },
      ],
      horasTotales: 240,
      costoTotal: 384000,
      mensualidad: 64000,
      meses: 6,
      prototipado: { incluido: false, costo: 0 },
    },
    contrato: {
      contratoGenerado: true,
      contratoUrl: "https://example.com/contratos/COT-2025-001.pdf",
      contratoRevisado: true,
      enviadoAFirma: true,
      docusignEnvelopeId: "envelope-123",
      docusignStatus: "completed",
      fechaEnvioFirma: "2025-01-21",
      fechaFirmado: "2025-01-22",
      firmadoPor: "Juan Pérez - Tech Solutions",
    },
    proyectoId: "1",
  },
  {
    id: "2",
    folio: "COT-2025-002",
    titulo: "CRM para Ventas y Marketing",
    clienteId: "2",
    clienteNombre: "Innovatech Labs",
    estado: "En revisión",
    tipoProyecto: "CRM",
    fechaCreacion: "2025-01-25",
    fechaEnvio: "2025-01-26",
    alcance: {
      descripcion:
        "CRM completo para gestión de leads, oportunidades, seguimiento de ventas y automatización de marketing.",
      pantallas: [
        { nombre: "Dashboard de Ventas", descripcion: "KPIs y métricas de ventas" },
        { nombre: "Gestión de Leads", descripcion: "Pipeline y seguimiento de prospectos" },
        { nombre: "Oportunidades", descripcion: "Control de oportunidades de venta" },
        { nombre: "Campañas de Marketing", descripcion: "Gestión y seguimiento de campañas" },
      ],
      funcionalidades: [
        { nombre: "Pipeline Visual", descripcion: "Kanban de oportunidades", prioridad: "Alta" },
        { nombre: "Automatización", descripcion: "Workflows automáticos", prioridad: "Alta" },
        { nombre: "Email Marketing", descripcion: "Campañas por correo", prioridad: "Media" },
      ],
      flujos: [],
    },
    archivosInput: [{ nombre: "Procesos actuales.xlsx", tipo: "Excel", url: "#" }],
    desglose: {
      roles: [
        { rol: "Arely", horas: 32, tarifaPorHora: 500, total: 16000 },
        { rol: "Gaby", horas: 128, tarifaPorHora: 1200, total: 153600 },
        { rol: "Desarrollador", horas: 160, tarifaPorHora: 800, total: 128000 },
      ],
      horasTotales: 320,
      costoTotal: 512000,
      mensualidad: 64000,
      meses: 8,
      prototipado: { incluido: true, costo: 600 },
    },
    contrato: {
      contratoGenerado: false,
      contratoRevisado: false,
      enviadoAFirma: false,
    },
  },
  {
    id: "3",
    folio: "COT-2025-003",
    titulo: "E-commerce de Productos Artesanales",
    clienteId: "3",
    clienteNombre: "Digital Commerce Inc",
    estado: "Firmada",
    tipoProyecto: "E-commerce",
    fechaCreacion: "2025-02-01",
    fechaEnvio: "2025-02-02",
    alcance: {
      descripcion:
        "Tienda en línea completa con catálogo de productos, carrito de compras, checkout y panel de administración.",
      pantallas: [
        { nombre: "Home", descripcion: "Landing page con productos destacados" },
        { nombre: "Catálogo", descripcion: "Listado de productos con filtros" },
        { nombre: "Detalle de Producto", descripcion: "Información completa del producto" },
        { nombre: "Carrito", descripcion: "Carrito de compras" },
        { nombre: "Checkout", descripcion: "Proceso de pago" },
        { nombre: "Admin Panel", descripcion: "Gestión de productos y pedidos" },
      ],
      funcionalidades: [
        { nombre: "Pagos en línea", descripcion: "Integración con Stripe", prioridad: "Alta" },
        { nombre: "Gestión de pedidos", descripcion: "Tracking de pedidos", prioridad: "Alta" },
        { nombre: "Cupones", descripcion: "Sistema de descuentos", prioridad: "Media" },
      ],
      flujos: [],
    },
    archivosInput: [],
    desglose: {
      roles: [
        { rol: "Arely", horas: 40, tarifaPorHora: 500, total: 20000 },
        { rol: "Gaby", horas: 160, tarifaPorHora: 1200, total: 192000 },
        { rol: "Desarrollador", horas: 200, tarifaPorHora: 800, total: 160000 },
      ],
      horasTotales: 400,
      costoTotal: 640000,
      mensualidad: 80000,
      meses: 8,
      prototipado: { incluido: true, costo: 1200 },
    },
    contrato: {
      contratoGenerado: true,
      contratoUrl: "https://example.com/contratos/COT-2025-003.pdf",
      contratoRevisado: true,
      enviadoAFirma: true,
      docusignEnvelopeId: "envelope-456",
      docusignStatus: "completed",
      fechaEnvioFirma: "2025-02-05",
      fechaFirmado: "2025-02-07",
      firmadoPor: "María García - Digital Commerce",
    },
  },
  {
    id: "4",
    folio: "COT-2025-004",
    titulo: "App Móvil de Delivery",
    clienteId: "1",
    clienteNombre: "Tech Solutions SA de CV",
    estado: "Rechazada",
    tipoProyecto: "App Móvil",
    fechaCreacion: "2025-02-05",
    fechaEnvio: "2025-02-06",
    fechaRespuesta: "2025-02-10",
    alcance: {
      descripcion: "Aplicación móvil para iOS y Android con seguimiento en tiempo real de pedidos y pagos integrados.",
      pantallas: [
        { nombre: "Login", descripcion: "Autenticación de usuarios" },
        { nombre: "Home", descripcion: "Restaurantes cercanos" },
        { nombre: "Menú", descripcion: "Catálogo de productos" },
        { nombre: "Carrito", descripcion: "Pedido actual" },
        { nombre: "Tracking", descripcion: "Seguimiento en tiempo real" },
      ],
      funcionalidades: [
        { nombre: "Geolocalización", descripcion: "Tracking GPS en tiempo real", prioridad: "Alta" },
        { nombre: "Pagos móviles", descripcion: "Integración con pasarelas", prioridad: "Alta" },
        { nombre: "Push Notifications", descripcion: "Notificaciones de estado", prioridad: "Alta" },
      ],
      flujos: [],
    },
    archivosInput: [],
    desglose: {
      roles: [
        { rol: "Arely", horas: 48, tarifaPorHora: 500, total: 24000 },
        { rol: "Gaby", horas: 192, tarifaPorHora: 1200, total: 230400 },
        { rol: "Desarrollador", horas: 240, tarifaPorHora: 800, total: 192000 },
      ],
      horasTotales: 480,
      costoTotal: 768000,
      mensualidad: 96000,
      meses: 8,
      prototipado: { incluido: true, costo: 1800 },
    },
    contrato: {
      contratoGenerado: false,
      contratoRevisado: false,
      enviadoAFirma: false,
    },
  },
  {
    id: "5",
    folio: "COT-2025-005",
    titulo: "Website Corporativo con Blog",
    clienteId: "4",
    clienteNombre: "Global Consulting Group",
    estado: "Borrador",
    tipoProyecto: "Website",
    fechaCreacion: "2025-02-08",
    alcance: {
      descripcion: "Sitio web corporativo moderno con secciones de servicios, equipo, casos de éxito y blog integrado.",
      pantallas: [
        { nombre: "Home", descripcion: "Landing principal con hero y servicios" },
        { nombre: "Servicios", descripcion: "Catálogo de servicios ofrecidos" },
        { nombre: "Nosotros", descripcion: "Equipo y valores de la empresa" },
        { nombre: "Blog", descripcion: "Artículos y noticias" },
        { nombre: "Contacto", descripcion: "Formulario de contacto" },
      ],
      funcionalidades: [
        { nombre: "CMS para Blog", descripcion: "Gestión de contenido", prioridad: "Alta" },
        { nombre: "Formularios", descripcion: "Contacto y cotizaciones", prioridad: "Alta" },
        { nombre: "SEO", descripcion: "Optimización para buscadores", prioridad: "Media" },
      ],
      flujos: [],
    },
    archivosInput: [],
    desglose: {
      roles: [
        { rol: "Arely", horas: 16, tarifaPorHora: 500, total: 8000 },
        { rol: "Gaby", horas: 64, tarifaPorHora: 1200, total: 76800 },
        { rol: "Desarrollador", horas: 80, tarifaPorHora: 800, total: 64000 },
      ],
      horasTotales: 160,
      costoTotal: 256000,
      mensualidad: 64000,
      meses: 4,
      prototipado: { incluido: true, costo: 600 },
    },
    contrato: {
      contratoGenerado: false,
      contratoRevisado: false,
      enviadoAFirma: false,
    },
  },
  {
    id: "6",
    folio: "COT-2025-006",
    titulo: "Sistema de Recursos Humanos",
    clienteId: "2",
    clienteNombre: "Innovatech Labs",
    estado: "Contrato en Revisión",
    tipoProyecto: "Dashboard",
    fechaCreacion: "2025-02-10",
    fechaEnvio: "2025-02-11",
    alcance: {
      descripcion:
        "Plataforma para gestión de empleados, nómina, vacaciones, evaluaciones de desempeño y control de asistencia.",
      pantallas: [
        { nombre: "Dashboard RH", descripcion: "Métricas de recursos humanos" },
        { nombre: "Empleados", descripcion: "Base de datos de empleados" },
        { nombre: "Nómina", descripcion: "Cálculo y gestión de nómina" },
        { nombre: "Vacaciones", descripcion: "Solicitudes y aprobaciones" },
        { nombre: "Evaluaciones", descripcion: "Desempeño y feedback" },
      ],
      funcionalidades: [
        { nombre: "Cálculo de Nómina", descripcion: "Automatización de cálculos", prioridad: "Alta" },
        { nombre: "Workflow de Aprobaciones", descripcion: "Vacaciones y permisos", prioridad: "Alta" },
        { nombre: "Reportes", descripcion: "Analytics de RH", prioridad: "Media" },
      ],
      flujos: [],
    },
    archivosInput: [],
    desglose: {
      roles: [
        { rol: "Arely", horas: 28, tarifaPorHora: 500, total: 14000 },
        { rol: "Gaby", horas: 112, tarifaPorHora: 1200, total: 134400 },
        { rol: "Desarrollador", horas: 140, tarifaPorHora: 800, total: 112000 },
      ],
      horasTotales: 280,
      costoTotal: 448000,
      mensualidad: 64000,
      meses: 7,
      prototipado: { incluido: false, costo: 0 },
    },
    contrato: {
      contratoGenerado: true,
      contratoUrl: "https://example.com/contratos/COT-2025-006.pdf",
      contratoRevisado: false,
      enviadoAFirma: false,
    },
  },
]

export function getCotizacionById(id: string): Cotizacion | undefined {
  return mockCotizaciones.find((c) => c.id === id)
}

export function getCotizacionesByCliente(clienteId: string): Cotizacion[] {
  return mockCotizaciones.filter((c) => c.clienteId === clienteId)
}

export function getCotizacionesByEstado(estado: EstadoCotizacion): Cotizacion[] {
  return mockCotizaciones.filter((c) => c.estado === estado)
}

export function getCotizaciones(): Cotizacion[] {
  return mockCotizaciones
}
