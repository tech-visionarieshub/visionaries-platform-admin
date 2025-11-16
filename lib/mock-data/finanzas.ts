// Clientes
export const mockClientes = [
  {
    id: "1",
    empresa: "TechCorp Solutions",
    personaCobranza: "Ana García",
    correoCobranza: "cobranza@techcorp.example.com",
    ccCobranza: "contabilidad@techcorp.example.com",
    cuentaPago: "BBVA BANCOMER",
    datosPago: "CLABE: 012 580 01234567890 1",
    razonSocial: "TECHCORP SOLUTIONS SA DE CV",
    rfc: "TCS200101ABC",
    cp: "64000",
    regimenFiscal: "601 - General de Ley Personas Morales",
    usoCFDI: "G03 - Gastos en general",
    calle: "AV. TECNOLOGÍA",
    colonia: "PARQUE INDUSTRIAL",
    localidad: "MONTERREY",
    noExterior: "100",
    noInterior: "",
    municipio: "MONTERREY",
    estado: "NUEVO LEÓN",
    pais: "MÉXICO",
  },
  {
    id: "2",
    empresa: "Innovatech SA",
    personaCobranza: "Carlos Martínez",
    correoCobranza: "facturacion@innovatech.example.com",
    ccCobranza: "",
    cuentaPago: "SANTANDER",
    datosPago: "CLABE: 014 180 09876543210 8",
    razonSocial: "INNOVATECH SA DE CV",
    rfc: "INN180523XYZ",
    cp: "64720",
    regimenFiscal: "612 - Personas Físicas con Actividades Empresariales",
    usoCFDI: "G03 - Gastos en general",
    calle: "BLVD. INNOVACIÓN",
    colonia: "CENTRO",
    localidad: "MONTERREY",
    noExterior: "450",
    noInterior: "3",
    municipio: "MONTERREY",
    estado: "NUEVO LEÓN",
    pais: "MÉXICO",
  },
  {
    id: "3",
    empresa: "Digital Systems",
    personaCobranza: "María López",
    correoCobranza: "cobranza@digitalsys.example.com",
    ccCobranza: "admin@digitalsys.example.com",
    cuentaPago: "BANORTE",
    datosPago: "CLABE: 072 580 11223344556 7",
    razonSocial: "DIGITAL SYSTEMS SC",
    rfc: "DSY150910DEF",
    cp: "67185",
    regimenFiscal: "601 - General de Ley Personas Morales",
    usoCFDI: "G03 - Gastos en general",
    calle: "CALLE DIGITAL",
    colonia: "ZONA EMPRESARIAL",
    localidad: "GUADALUPE",
    noExterior: "2500",
    noInterior: "",
    municipio: "GUADALUPE",
    estado: "NUEVO LEÓN",
    pais: "MÉXICO",
  },
]

// Facturas
export type Factura = {
  id: string
  empresa: string
  razonSocial: string
  rfc: string
  folio: string
  subtotal: number
  iva: number
  total: number
  status: "Pagada" | "Pendiente" | "Cancelada" | "Vencida"
  metodoPago: string
  formaPago: string
  usoCFDI: string
  fechaEmision: string
  fechaVencimiento: string
  mesFacturacion: string
  requiereComplemento: boolean
  pdfUrl?: string
  xmlUrl?: string
  conceptos: string
}

export const mockFacturas: Factura[] = [
  {
    id: "1",
    empresa: "TechCorp Solutions",
    razonSocial: "TECHCORP SOLUTIONS SA DE CV",
    rfc: "TCS200101ABC",
    folio: "A-001",
    subtotal: 10000,
    iva: 1600,
    total: 11600,
    status: "Pagada",
    metodoPago: "PUE",
    formaPago: "03 - Transferencia",
    usoCFDI: "G03 - Gastos en general",
    fechaEmision: "2025-02-01",
    fechaVencimiento: "2025-02-15",
    mesFacturacion: "Febrero 2025",
    requiereComplemento: false,
    pdfUrl: "#",
    conceptos: "Servicios de desarrollo web",
  },
  {
    id: "2",
    empresa: "Digital Systems",
    razonSocial: "DIGITAL SYSTEMS SC",
    rfc: "DSY150910DEF",
    folio: "A-002",
    subtotal: 50000,
    iva: 8000,
    total: 58000,
    status: "Cancelada",
    metodoPago: "PPD",
    formaPago: "99 - Por definir",
    usoCFDI: "G03 - Gastos en general",
    fechaEmision: "2025-02-01",
    fechaVencimiento: "2025-02-28",
    mesFacturacion: "Febrero 2025",
    requiereComplemento: true,
    pdfUrl: "#",
    conceptos: "Desarrollo de sistema ERP",
  },
  {
    id: "3",
    empresa: "Innovatech SA",
    razonSocial: "INNOVATECH SA DE CV",
    rfc: "INN180523XYZ",
    folio: "A-003",
    subtotal: 45000,
    iva: 7200,
    total: 52200,
    status: "Pendiente",
    metodoPago: "PUE",
    formaPago: "03 - Transferencia",
    usoCFDI: "G03 - Gastos en general",
    fechaEmision: "2025-03-01",
    fechaVencimiento: "2025-03-15",
    mesFacturacion: "Marzo 2025",
    requiereComplemento: false,
    conceptos: "Servicios de consultoría tecnológica",
  },
  {
    id: "4",
    empresa: "CloudTech Inc",
    razonSocial: "CLOUDTECH INC SA DE CV",
    rfc: "CTI190815GHI",
    folio: "A-004",
    subtotal: 28000,
    iva: 4480,
    total: 32480,
    status: "Vencida",
    metodoPago: "PPD",
    formaPago: "99 - Por definir",
    usoCFDI: "G03 - Gastos en general",
    fechaEmision: "2025-01-15",
    fechaVencimiento: "2025-02-15",
    mesFacturacion: "Enero 2025",
    requiereComplemento: true,
    conceptos: "Desarrollo de aplicación móvil",
  },
]

// Complementos de Pago
export type Complemento = {
  id: string
  facturaId: string
  folioFactura: string
  empresa: string
  rfcReceptor: string
  razonSocial: string
  moneda: string
  montoPago: number
  formaPago: string
  fechaPago: string
  horaPago: string
  numeroOperacion: string
  folioFiscal: string
  status: "Activo" | "Cancelado"
  mesFacturacion: string
  comprobantePago?: string
  pdfUrl?: string
  xmlUrl?: string
}

export const mockComplementos: Complemento[] = [
  {
    id: "1",
    facturaId: "F-2025-001",
    folioFactura: "A-100",
    empresa: "TechCorp SA",
    rfcReceptor: "TCO850101ABC",
    razonSocial: "TECHCORP SA DE CV",
    moneda: "MXN",
    montoPago: 50000,
    formaPago: "03",
    fechaPago: "2025-02-15",
    horaPago: "14:30:00",
    numeroOperacion: "OP123456789",
    folioFiscal: "A31D9E8D7FC-0A41-4E75-B428-246F57805A80",
    status: "Activo",
    mesFacturacion: "Febrero 2025",
    comprobantePago: "https://drive.google.com/file/d/mock1",
    pdfUrl: "https://drive.google.com/file/d/mock1-pdf",
    xmlUrl: "https://drive.google.com/file/d/mock1-xml",
  },
  {
    id: "2",
    facturaId: "F-2025-003",
    folioFactura: "A-102",
    empresa: "Innovatech Solutions",
    rfcReceptor: "INS920202XYZ",
    razonSocial: "INNOVATECH SOLUTIONS SC",
    moneda: "MXN",
    montoPago: 25000,
    formaPago: "01",
    fechaPago: "2025-02-20",
    horaPago: "10:15:00",
    numeroOperacion: "OP987654321",
    folioFiscal: "B29E0E8A1762-F4AE-4095-88E7-34DB29ECBC94E",
    status: "Activo",
    mesFacturacion: "Febrero 2025",
    comprobantePago: "https://drive.google.com/file/d/mock2",
    pdfUrl: "https://drive.google.com/file/d/mock2-pdf",
    xmlUrl: "https://drive.google.com/file/d/mock2-xml",
  },
  {
    id: "3",
    facturaId: "F-2025-005",
    folioFactura: "A-104",
    empresa: "Digital Services Inc",
    rfcReceptor: "DSI880303DEF",
    razonSocial: "DIGITAL SERVICES INC SA",
    moneda: "MXN",
    montoPago: 15000,
    formaPago: "03",
    fechaPago: "2025-03-01",
    horaPago: "16:45:00",
    numeroOperacion: "OP456789123",
    folioFiscal: "C12F3A9B2C4D-5E6F-7G8H-9I0J-1K2L3M4N5O6P",
    status: "Cancelado",
    mesFacturacion: "Marzo 2025",
    comprobantePago: "https://drive.google.com/file/d/mock3",
  },
]

// Egresos
export type Egreso = {
  id: string
  lineaNegocio: string
  categoria: string
  empresa: string
  equipo: string
  concepto: string
  subtotal: number
  iva: number
  total: number
  tipo: "Variable" | "Fijo"
  mes: string
  status: "Pagado" | "Pendiente" | "Cancelado"
  factura?: string
  comprobante?: string
  fechaPago?: string
}

export const mockEgresos: Egreso[] = [
  {
    id: "1",
    lineaNegocio: "iLab",
    categoria: "Automatización",
    empresa: "TechCorp SA",
    equipo: "Marco López",
    concepto: "4 Wireframes de Dashboards",
    subtotal: 1336,
    iva: 0,
    total: 1336,
    tipo: "Variable",
    mes: "Enero 2025",
    status: "Pagado",
    factura: "https://drive.google.com/file/d/mock1",
    comprobante: "https://drive.google.com/file/d/mock1-comp",
    fechaPago: "2025-01-15",
  },
  {
    id: "2",
    lineaNegocio: "Pivot",
    categoria: "Plataforma",
    empresa: "WebSolutions Inc",
    equipo: "Carlos Ruiz",
    concepto: "Rediseño web completo",
    subtotal: 2000,
    iva: 0,
    total: 2000,
    tipo: "Variable",
    mes: "Enero 2025",
    status: "Pagado",
    factura: "https://drive.google.com/file/d/mock2",
    fechaPago: "2025-01-15",
  },
  {
    id: "3",
    lineaNegocio: "Co-Founders Academy",
    categoria: "Estudios",
    empresa: "BrandStudio LLC",
    equipo: "Ana García",
    concepto: "Brandbook completo",
    subtotal: 1000,
    iva: 0,
    total: 1000,
    tipo: "Variable",
    mes: "Enero 2025",
    status: "Pagado",
    fechaPago: "2025-01-20",
  },
  {
    id: "4",
    lineaNegocio: "Gaby Pino",
    categoria: "Cursos",
    empresa: "N/A",
    equipo: "N/A",
    concepto: "Renta de oficina",
    subtotal: 5000,
    iva: 800,
    total: 5800,
    tipo: "Fijo",
    mes: "Febrero 2025",
    status: "Pendiente",
  },
  {
    id: "5",
    lineaNegocio: "iLab",
    categoria: "Conferencias",
    empresa: "AdAgency Co",
    equipo: "Luis Martínez",
    concepto: "Campaña Google Ads",
    subtotal: 3500,
    iva: 560,
    total: 4060,
    tipo: "Variable",
    mes: "Febrero 2025",
    status: "Pendiente",
  },
]

// Categorías y Líneas de Negocio
export const mockCategorias = ["Automatización", "Plataforma", "Estudios", "Cursos", "Conferencias", "Productos", "CFH"]

export const mockLineasNegocio = ["iLab", "Pivot", "Co-Founders Academy", "Gaby Pino"]

export function getClientes() {
  return mockClientes.map((cliente) => ({
    id: cliente.id,
    nombre: cliente.empresa,
    razonSocial: cliente.razonSocial,
    rfc: cliente.rfc,
    personaCobranza: cliente.personaCobranza,
    correoCobranza: cliente.correoCobranza,
  }))
}

export function getFacturas() {
  return mockFacturas
}

export function getComplementos() {
  return mockComplementos
}

export function getEgresos() {
  return mockEgresos
}

// Nómina
export type PaymentMethod = "Efectivo" | "Factura" | "Transferencia"

export type TeamMember = {
  id: string
  nombre: string
  formaPago: PaymentMethod
  clabe?: string
  banco?: string
  pagos: Record<string, number>
}

export const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    nombre: "Paola Ramírez",
    formaPago: "Efectivo",
    pagos: {
      "2025-01": 0,
      "2025-02": 0,
      "2025-03": 0,
      "2025-04": 0,
      "2025-05": 0,
      "2025-06": 0,
      "2025-07": 0,
      "2025-08": 0,
      "2025-09": 0,
      "2025-10": 0,
    },
  },
  {
    id: "2",
    nombre: "Jessica Torres",
    formaPago: "Efectivo",
    pagos: {
      "2025-01": 0,
      "2025-02": 0,
      "2025-03": 0,
      "2025-04": 0,
      "2025-05": 0,
      "2025-06": 0,
      "2025-07": 0,
      "2025-08": 0,
      "2025-09": 0,
      "2025-10": 0,
    },
  },
  {
    id: "3",
    nombre: "Arely Sánchez",
    formaPago: "Factura",
    clabe: "0125 8001 5456 782983",
    banco: "BBVA",
    pagos: {
      "2025-01": 34800,
      "2025-02": 45200,
      "2025-03": 40600,
      "2025-04": 40600,
      "2025-05": 40600,
      "2025-06": 42456,
      "2025-07": 40600,
      "2025-08": 49444.64,
      "2025-09": 44312,
      "2025-10": 49832.64,
    },
  },
  {
    id: "4",
    nombre: "Iván Morales",
    formaPago: "Transferencia",
    clabe: "0123 4567 8901 234567",
    banco: "Banorte",
    pagos: {
      "2025-01": 0,
      "2025-02": 0,
      "2025-03": 0,
      "2025-04": 0,
      "2025-05": 17500,
      "2025-06": 0,
      "2025-07": 0,
      "2025-08": 0,
      "2025-09": 0,
      "2025-10": 0,
    },
  },
]
