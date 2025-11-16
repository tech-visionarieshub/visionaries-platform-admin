export type CotizacionTemplate = {
  id: string
  nombre: string
  tipoProyecto: "Dashboard" | "CRM" | "E-commerce" | "App Móvil" | "Website" | "Personalizado"
  descripcion: string
  predefinido: boolean

  pantallasTipicas: { nombre: string; descripcion: string }[]
  funcionalidadesTipicas: { nombre: string; descripcion: string; prioridad: "Alta" | "Media" | "Baja" }[]
  fasesTipicas: {
    nombre: string
    descripcion: string
    horas: {
      arely: number
      gaby: number
      desarrollador: number
    }
  }[]
  horasTotales: number
  mesesEstimados: number

  // Alcance típico (for detail view)
  alcanceBase: {
    pantallas: { nombre: string; descripcion: string }[]
    funcionalidades: { nombre: string; descripcion: string; prioridad: "Alta" | "Media" | "Baja" }[]
    flujos?: { nombre: string; pasos: string[] }[]
  }

  // Estimación estándar (for detail view)
  estimacionBase: {
    fases: {
      nombre: string
      descripcion: string
      horas: {
        arely: number
        gaby: number
        desarrollador: number
      }
    }[]
  }

  precioBase: number
}

export const mockTemplates: CotizacionTemplate[] = [
  {
    id: "template-1",
    nombre: "Plataforma de Gestión Interna (ERP)",
    tipoProyecto: "Dashboard",
    descripcion:
      "Sistema integral de control de servicios, ingresos, egresos y reportes técnicos. Reemplaza múltiples herramientas (Excel, CRM, 2Workers) con una solución centralizada.",
    predefinido: true,
    horasTotales: 484,
    mesesEstimados: 6,
    pantallasTipicas: [
      { nombre: "Dashboard Ejecutivo", descripcion: "KPIs de ingresos, egresos, proyectos activos y métricas clave" },
      { nombre: "Gestión de Proyectos", descripcion: "Control de proyectos con timeline, asignaciones y progreso" },
      { nombre: "Control de Ingresos", descripcion: "Facturación, complementos de pago y cuentas por cobrar" },
      { nombre: "Control de Egresos", descripcion: "Gastos operativos, nómina y proveedores" },
      { nombre: "Checklist Técnico", descripcion: "Verificación de tareas técnicas y estándares de calidad" },
      { nombre: "Almacén", descripcion: "Control de inventario y movimientos" },
      { nombre: "Reportes", descripcion: "Reportes financieros, operativos y exportación de datos" },
    ],
    funcionalidadesTipicas: [
      {
        nombre: "Control financiero completo",
        descripcion: "Ingresos, egresos, flujo de caja y reportes",
        prioridad: "Alta",
      },
      {
        nombre: "Gestión de proyectos",
        descripcion: "Timeline, asignaciones, tracking y alertas",
        prioridad: "Alta",
      },
      { nombre: "Roles y permisos", descripcion: "Admin, Manager, Capturista, Consulta", prioridad: "Alta" },
      {
        nombre: "Checklist técnico",
        descripcion: "Templates de verificación por tipo de proyecto",
        prioridad: "Media",
      },
      { nombre: "Control de almacén", descripcion: "Inventario, entradas, salidas y reportes", prioridad: "Media" },
      {
        nombre: "Notificaciones automáticas",
        descripcion: "Alertas de pagos, vencimientos y tareas",
        prioridad: "Baja",
      },
    ],
    fasesTipicas: [
      {
        nombre: "Análisis y Diseño",
        descripcion: "Mapeo de procesos actuales y diseño de la solución",
        horas: {
          arely: 16,
          gaby: 40,
          desarrollador: 8,
        },
      },
      {
        nombre: "Módulo Financiero",
        descripcion: "Ingresos, egresos, reportes y dashboard",
        horas: {
          arely: 12,
          gaby: 64,
          desarrollador: 48,
        },
      },
      {
        nombre: "Módulo de Proyectos",
        descripcion: "Gestión de proyectos, tareas y asignaciones",
        horas: {
          arely: 10,
          gaby: 48,
          desarrollador: 40,
        },
      },
      {
        nombre: "Checklist y Almacén",
        descripcion: "Verificación técnica y control de inventario",
        horas: {
          arely: 8,
          gaby: 32,
          desarrollador: 32,
        },
      },
      {
        nombre: "Integraciones",
        descripcion: "APIs externas, notificaciones y automatizaciones",
        horas: {
          arely: 6,
          gaby: 16,
          desarrollador: 40,
        },
      },
      {
        nombre: "Testing, Capacitación y Deploy",
        descripcion: "Pruebas QA, capacitación de usuarios y puesta en producción",
        horas: {
          arely: 20,
          gaby: 24,
          desarrollador: 20,
        },
      },
    ],
    alcanceBase: {
      pantallas: [
        { nombre: "Dashboard Ejecutivo", descripcion: "KPIs de ingresos, egresos, proyectos activos y métricas clave" },
        { nombre: "Gestión de Proyectos", descripcion: "Control de proyectos con timeline, asignaciones y progreso" },
        { nombre: "Control de Ingresos", descripcion: "Facturación, complementos de pago y cuentas por cobrar" },
        { nombre: "Control de Egresos", descripcion: "Gastos operativos, nómina y proveedores" },
        { nombre: "Checklist Técnico", descripcion: "Verificación de tareas técnicas y estándares de calidad" },
        { nombre: "Almacén", descripcion: "Control de inventario y movimientos" },
        { nombre: "Reportes", descripcion: "Reportes financieros, operativos y exportación de datos" },
      ],
      funcionalidades: [
        {
          nombre: "Control financiero completo",
          descripcion: "Ingresos, egresos, flujo de caja y reportes",
          prioridad: "Alta",
        },
        {
          nombre: "Gestión de proyectos",
          descripcion: "Timeline, asignaciones, tracking y alertas",
          prioridad: "Alta",
        },
        { nombre: "Roles y permisos", descripcion: "Admin, Manager, Capturista, Consulta", prioridad: "Alta" },
        {
          nombre: "Checklist técnico",
          descripcion: "Templates de verificación por tipo de proyecto",
          prioridad: "Media",
        },
        { nombre: "Control de almacén", descripcion: "Inventario, entradas, salidas y reportes", prioridad: "Media" },
        {
          nombre: "Notificaciones automáticas",
          descripcion: "Alertas de pagos, vencimientos y tareas",
          prioridad: "Baja",
        },
      ],
    },
    estimacionBase: {
      fases: [
        {
          nombre: "Análisis y Diseño",
          descripcion: "Mapeo de procesos actuales y diseño de la solución",
          horas: {
            arely: 16,
            gaby: 40,
            desarrollador: 8,
          },
        },
        {
          nombre: "Módulo Financiero",
          descripcion: "Ingresos, egresos, reportes y dashboard",
          horas: {
            arely: 12,
            gaby: 64,
            desarrollador: 48,
          },
        },
        {
          nombre: "Módulo de Proyectos",
          descripcion: "Gestión de proyectos, tareas y asignaciones",
          horas: {
            arely: 10,
            gaby: 48,
            desarrollador: 40,
          },
        },
        {
          nombre: "Checklist y Almacén",
          descripcion: "Verificación técnica y control de inventario",
          horas: {
            arely: 8,
            gaby: 32,
            desarrollador: 32,
          },
        },
        {
          nombre: "Integraciones",
          descripcion: "APIs externas, notificaciones y automatizaciones",
          horas: {
            arely: 6,
            gaby: 16,
            desarrollador: 40,
          },
        },
        {
          nombre: "Testing, Capacitación y Deploy",
          descripcion: "Pruebas QA, capacitación de usuarios y puesta en producción",
          horas: {
            arely: 20,
            gaby: 24,
            desarrollador: 20,
          },
        },
      ],
    },
    precioBase: 48400,
  },
  {
    id: "template-2",
    nombre: "Sistema LMS (Learning Management System)",
    tipoProyecto: "Dashboard",
    descripcion:
      "Plataforma de aprendizaje multi-cliente con gamificación, simuladores, evaluaciones con rúbricas, certificados automáticos y soporte SCORM/xAPI.",
    predefinido: true,
    horasTotales: 644,
    mesesEstimados: 8,
    pantallasTipicas: [
      { nombre: "Dashboard del Estudiante", descripcion: "Progreso, cursos activos, logros y puntos" },
      { nombre: "Catálogo de Cursos", descripcion: "Biblioteca de cursos con filtros y búsqueda" },
      { nombre: "Player de Contenido", descripcion: "Reproductor de lecciones, videos y recursos" },
      { nombre: "Simulador de Decisiones", descripcion: "Escenarios interactivos con consecuencias" },
      { nombre: "Evaluaciones", descripcion: "Exámenes, rúbricas y retroalimentación" },
      { nombre: "Perfil y Logros", descripcion: "Gamificación, badges, puntos y ranking" },
      { nombre: "Panel Admin/Instructor", descripcion: "Gestión de cursos, usuarios y reportes" },
      { nombre: "Certificados", descripcion: "Generación automática y verificación" },
    ],
    funcionalidadesTipicas: [
      {
        nombre: "Gestión de contenido multi-formato",
        descripcion: "Videos, PDFs, SCORM, xAPI, H5P",
        prioridad: "Alta",
      },
      { nombre: "Gamificación nativa", descripcion: "Puntos, badges, niveles y rankings", prioridad: "Alta" },
      {
        nombre: "Simuladores de decisiones",
        descripcion: "Escenarios interactivos con motor de reglas",
        prioridad: "Alta",
      },
      {
        nombre: "Evaluaciones con rúbricas",
        descripcion: "Exámenes, autoevaluación y calificación por criterios",
        prioridad: "Alta",
      },
      {
        nombre: "Certificados automáticos",
        descripcion: "Generación y verificación de certificados",
        prioridad: "Media",
      },
      { nombre: "Multi-tenant", descripcion: "Soporte para múltiples clientes/academias", prioridad: "Media" },
      { nombre: "Reportes de progreso", descripcion: "Analytics de aprendizaje y engagement", prioridad: "Media" },
    ],
    fasesTipicas: [
      {
        nombre: "Análisis Instruccional y Diseño",
        descripcion: "Arquitectura de aprendizaje, experiencia de usuario y diseño UI/UX",
        horas: {
          arely: 20,
          gaby: 56,
          desarrollador: 12,
        },
      },
      {
        nombre: "Core LMS",
        descripcion: "Catálogo, player, tracking de progreso y dashboard",
        horas: {
          arely: 16,
          gaby: 72,
          desarrollador: 64,
        },
      },
      {
        nombre: "Gamificación",
        descripcion: "Sistema de puntos, badges, niveles y ranking",
        horas: {
          arely: 8,
          gaby: 40,
          desarrollador: 48,
        },
      },
      {
        nombre: "Simuladores y Evaluaciones",
        descripcion: "Motor de simuladores, exámenes y rúbricas",
        horas: {
          arely: 12,
          gaby: 48,
          desarrollador: 56,
        },
      },
      {
        nombre: "Certificados y Multi-tenant",
        descripcion: "Generación de certificados y arquitectura multi-cliente",
        horas: {
          arely: 8,
          gaby: 24,
          desarrollador: 48,
        },
      },
      {
        nombre: "Integraciones SCORM/xAPI",
        descripcion: "Soporte para estándares de e-learning",
        horas: {
          arely: 6,
          gaby: 16,
          desarrollador: 40,
        },
      },
      {
        nombre: "Testing, Capacitación y Deploy",
        descripcion: "QA exhaustivo, documentación y capacitación",
        horas: {
          arely: 24,
          gaby: 32,
          desarrollador: 24,
        },
      },
    ],
    alcanceBase: {
      pantallas: [
        { nombre: "Dashboard del Estudiante", descripcion: "Progreso, cursos activos, logros y puntos" },
        { nombre: "Catálogo de Cursos", descripcion: "Biblioteca de cursos con filtros y búsqueda" },
        { nombre: "Player de Contenido", descripcion: "Reproductor de lecciones, videos y recursos" },
        { nombre: "Simulador de Decisiones", descripcion: "Escenarios interactivos con consecuencias" },
        { nombre: "Evaluaciones", descripcion: "Exámenes, rúbricas y retroalimentación" },
        { nombre: "Perfil y Logros", descripcion: "Gamificación, badges, puntos y ranking" },
        { nombre: "Panel Admin/Instructor", descripcion: "Gestión de cursos, usuarios y reportes" },
        { nombre: "Certificados", descripcion: "Generación automática y verificación" },
      ],
      funcionalidades: [
        {
          nombre: "Gestión de contenido multi-formato",
          descripcion: "Videos, PDFs, SCORM, xAPI, H5P",
          prioridad: "Alta",
        },
        { nombre: "Gamificación nativa", descripcion: "Puntos, badges, niveles y rankings", prioridad: "Alta" },
        {
          nombre: "Simuladores de decisiones",
          descripcion: "Escenarios interactivos con motor de reglas",
          prioridad: "Alta",
        },
        {
          nombre: "Evaluaciones con rúbricas",
          descripcion: "Exámenes, autoevaluación y calificación por criterios",
          prioridad: "Alta",
        },
        {
          nombre: "Certificados automáticos",
          descripcion: "Generación y verificación de certificados",
          prioridad: "Media",
        },
        { nombre: "Multi-tenant", descripcion: "Soporte para múltiples clientes/academias", prioridad: "Media" },
        { nombre: "Reportes de progreso", descripcion: "Analytics de aprendizaje y engagement", prioridad: "Media" },
      ],
    },
    estimacionBase: {
      fases: [
        {
          nombre: "Análisis Instruccional y Diseño",
          descripcion: "Arquitectura de aprendizaje, experiencia de usuario y diseño UI/UX",
          horas: {
            arely: 20,
            gaby: 56,
            desarrollador: 12,
          },
        },
        {
          nombre: "Core LMS",
          descripcion: "Catálogo, player, tracking de progreso y dashboard",
          horas: {
            arely: 16,
            gaby: 72,
            desarrollador: 64,
          },
        },
        {
          nombre: "Gamificación",
          descripcion: "Sistema de puntos, badges, niveles y ranking",
          horas: {
            arely: 8,
            gaby: 40,
            desarrollador: 48,
          },
        },
        {
          nombre: "Simuladores y Evaluaciones",
          descripcion: "Motor de simuladores, exámenes y rúbricas",
          horas: {
            arely: 12,
            gaby: 48,
            desarrollador: 56,
          },
        },
        {
          nombre: "Certificados y Multi-tenant",
          descripcion: "Generación de certificados y arquitectura multi-cliente",
          horas: {
            arely: 8,
            gaby: 24,
            desarrollador: 48,
          },
        },
        {
          nombre: "Integraciones SCORM/xAPI",
          descripcion: "Soporte para estándares de e-learning",
          horas: {
            arely: 6,
            gaby: 16,
            desarrollador: 40,
          },
        },
        {
          nombre: "Testing, Capacitación y Deploy",
          descripcion: "QA exhaustivo, documentación y capacitación",
          horas: {
            arely: 24,
            gaby: 32,
            desarrollador: 24,
          },
        },
      ],
    },
    precioBase: 64400,
  },
  {
    id: "template-3",
    nombre: "Chatbot con IA (Web y WhatsApp)",
    tipoProyecto: "Personalizado",
    descripcion:
      "Agente conversacional inteligente para atención al cliente con respuestas personalizadas, consulta de pedidos/guías e integración con bases de datos (Google Sheets, Excel).",
    predefinido: true,
    horasTotales: 324,
    mesesEstimados: 4,
    pantallasTipicas: [
      { nombre: "Widget de Chat Web", descripcion: "Interfaz de chat integrable en cualquier sitio web" },
      { nombre: "Panel de Conversaciones", descripcion: "Vista de todas las conversaciones activas e historial" },
      { nombre: "Configuración del Bot", descripcion: "Personalidad, respuestas y flujos del chatbot" },
      { nombre: "Base de Conocimiento", descripcion: "Documentos, FAQs y fuentes de datos" },
      { nombre: "Analytics", descripcion: "Métricas de uso, satisfacción y temas frecuentes" },
      { nombre: "Integraciones", descripcion: "Conexión con WhatsApp, Google Sheets, APIs" },
    ],
    funcionalidadesTipicas: [
      {
        nombre: "Chat conversacional con IA",
        descripcion: "GPT-4 para respuestas naturales y contextuales",
        prioridad: "Alta",
      },
      { nombre: "Integración WhatsApp", descripcion: "Bot disponible en WhatsApp Business", prioridad: "Alta" },
      {
        nombre: "Consulta de datos",
        descripcion: "Buscar pedidos, guías, inventario en tiempo real",
        prioridad: "Alta",
      },
      { nombre: "Base de conocimiento", descripcion: "Entrenar el bot con documentos propios", prioridad: "Alta" },
      { nombre: "Handoff a humano", descripcion: "Transferir conversación a agente humano", prioridad: "Media" },
      { nombre: "Multiidioma", descripcion: "Detectar y responder en el idioma del usuario", prioridad: "Baja" },
    ],
    fasesTipicas: [
      {
        nombre: "Diseño Conversacional",
        descripcion: "Definir personalidad, flujos y casos de uso del bot",
        horas: {
          arely: 12,
          gaby: 24,
          desarrollador: 8,
        },
      },
      {
        nombre: "Desarrollo del Chatbot",
        descripcion: "Implementación con IA, procesamiento de lenguaje natural",
        horas: {
          arely: 8,
          gaby: 32,
          desarrollador: 56,
        },
      },
      {
        nombre: "Integración WhatsApp",
        descripcion: "Conexión con WhatsApp Business API",
        horas: {
          arely: 4,
          gaby: 8,
          desarrollador: 24,
        },
      },
      {
        nombre: "Conexión con Fuentes de Datos",
        descripcion: "Integrar Google Sheets, Excel, base de datos, APIs",
        horas: {
          arely: 6,
          gaby: 12,
          desarrollador: 32,
        },
      },
      {
        nombre: "Panel de Administración",
        descripcion: "Dashboard para gestionar el bot y ver analytics",
        horas: {
          arely: 6,
          gaby: 24,
          desarrollador: 20,
        },
      },
      {
        nombre: "Testing y Entrenamiento",
        descripcion: "Pruebas, ajustes y entrenamiento del modelo",
        horas: {
          arely: 16,
          gaby: 16,
          desarrollador: 16,
        },
      },
    ],
    alcanceBase: {
      pantallas: [
        { nombre: "Widget de Chat Web", descripcion: "Interfaz de chat integrable en cualquier sitio web" },
        { nombre: "Panel de Conversaciones", descripcion: "Vista de todas las conversaciones activas e historial" },
        { nombre: "Configuración del Bot", descripcion: "Personalidad, respuestas y flujos del chatbot" },
        { nombre: "Base de Conocimiento", descripcion: "Documentos, FAQs y fuentes de datos" },
        { nombre: "Analytics", descripcion: "Métricas de uso, satisfacción y temas frecuentes" },
        { nombre: "Integraciones", descripcion: "Conexión con WhatsApp, Google Sheets, APIs" },
      ],
      funcionalidades: [
        {
          nombre: "Chat conversacional con IA",
          descripcion: "GPT-4 para respuestas naturales y contextuales",
          prioridad: "Alta",
        },
        { nombre: "Integración WhatsApp", descripcion: "Bot disponible en WhatsApp Business", prioridad: "Alta" },
        {
          nombre: "Consulta de datos",
          descripcion: "Buscar pedidos, guías, inventario en tiempo real",
          prioridad: "Alta",
        },
        { nombre: "Base de conocimiento", descripcion: "Entrenar el bot con documentos propios", prioridad: "Alta" },
        { nombre: "Handoff a humano", descripcion: "Transferir conversación a agente humano", prioridad: "Media" },
        { nombre: "Multiidioma", descripcion: "Detectar y responder en el idioma del usuario", prioridad: "Baja" },
      ],
    },
    estimacionBase: {
      fases: [
        {
          nombre: "Diseño Conversacional",
          descripcion: "Definir personalidad, flujos y casos de uso del bot",
          horas: {
            arely: 12,
            gaby: 24,
            desarrollador: 8,
          },
        },
        {
          nombre: "Desarrollo del Chatbot",
          descripcion: "Implementación con IA, procesamiento de lenguaje natural",
          horas: {
            arely: 8,
            gaby: 32,
            desarrollador: 56,
          },
        },
        {
          nombre: "Integración WhatsApp",
          descripcion: "Conexión con WhatsApp Business API",
          horas: {
            arely: 4,
            gaby: 8,
            desarrollador: 24,
          },
        },
        {
          nombre: "Conexión con Fuentes de Datos",
          descripcion: "Integrar Google Sheets, Excel, base de datos, APIs",
          horas: {
            arely: 6,
            gaby: 12,
            desarrollador: 32,
          },
        },
        {
          nombre: "Panel de Administración",
          descripcion: "Dashboard para gestionar el bot y ver analytics",
          horas: {
            arely: 6,
            gaby: 24,
            desarrollador: 20,
          },
        },
        {
          nombre: "Testing y Entrenamiento",
          descripcion: "Pruebas, ajustes y entrenamiento del modelo",
          horas: {
            arely: 16,
            gaby: 16,
            desarrollador: 16,
          },
        },
      ],
    },
    precioBase: 32400,
  },
  {
    id: "template-4",
    nombre: "Sistema de Costos de Construcción",
    tipoProyecto: "Dashboard",
    descripcion:
      "Plataforma especializada para control de presupuestos de construcción, contratos, órdenes de cambio, pagos y roles jerárquicos (Capturista, Revisor, Autorizador).",
    predefinido: true,
    horasTotales: 500,
    mesesEstimados: 5,
    pantallasTipicas: [
      { nombre: "Dashboard de Proyecto", descripcion: "Estado financiero, avance físico vs financiero" },
      { nombre: "Presupuesto Base", descripcion: "Desglose completo del presupuesto inicial" },
      { nombre: "Contratos", descripcion: "Gestión de contratos con subcontratistas y proveedores" },
      { nombre: "Órdenes de Cambio", descripcion: "Modificaciones al presupuesto con aprobaciones" },
      { nombre: "Control de Pagos", descripcion: "Estimaciones, pagos realizados y pendientes" },
      { nombre: "Flujo de Aprobación", descripcion: "Workflow de captura, revisión y autorización" },
      { nombre: "Reportes Financieros", descripcion: "Comparativas presupuesto vs real, proyecciones" },
    ],
    funcionalidadesTipicas: [
      {
        nombre: "Presupuesto estructurado",
        descripcion: "WBS con partidas, conceptos y análisis de precios",
        prioridad: "Alta",
      },
      {
        nombre: "Control de cambios",
        descripcion: "Órdenes de cambio con impacto en tiempo y costo",
        prioridad: "Alta",
      },
      {
        nombre: "Workflow de aprobaciones",
        descripcion: "Roles jerárquicos con permisos diferenciados",
        prioridad: "Alta",
      },
      { nombre: "Estimaciones de obra", descripcion: "Cálculo de avances y pagos progresivos", prioridad: "Alta" },
      { nombre: "Comparativas", descripcion: "Presupuesto base vs contratado vs ejercido", prioridad: "Media" },
      { nombre: "Exportación a Excel", descripcion: "Reportes detallados para dirección", prioridad: "Media" },
    ],
    fasesTipicas: [
      {
        nombre: "Análisis de Procesos",
        descripcion: "Mapeo del flujo actual de control de costos",
        horas: {
          arely: 14,
          gaby: 32,
          desarrollador: 8,
        },
      },
      {
        nombre: "Módulo de Presupuesto",
        descripcion: "Estructura WBS, captura y visualización",
        horas: {
          arely: 10,
          gaby: 48,
          desarrollador: 40,
        },
      },
      {
        nombre: "Contratos y Órdenes de Cambio",
        descripcion: "Gestión de contratos y modificaciones",
        horas: {
          arely: 8,
          gaby: 40,
          desarrollador: 36,
        },
      },
      {
        nombre: "Control de Pagos",
        descripcion: "Estimaciones, pagos y conciliación",
        horas: {
          arely: 10,
          gaby: 32,
          desarrollador: 32,
        },
      },
      {
        nombre: "Workflow de Aprobaciones",
        descripcion: "Sistema de roles y permisos jerárquicos",
        horas: {
          arely: 8,
          gaby: 24,
          desarrollador: 40,
        },
      },
      {
        nombre: "Reportes y Analytics",
        descripcion: "Dashboard ejecutivo y reportes detallados",
        horas: {
          arely: 8,
          gaby: 32,
          desarrollador: 24,
        },
      },
      {
        nombre: "Testing y Capacitación",
        descripcion: "Pruebas con datos reales y capacitación de usuarios",
        horas: {
          arely: 18,
          gaby: 20,
          desarrollador: 16,
        },
      },
    ],
    alcanceBase: {
      pantallas: [
        { nombre: "Dashboard de Proyecto", descripcion: "Estado financiero, avance físico vs financiero" },
        { nombre: "Presupuesto Base", descripcion: "Desglose completo del presupuesto inicial" },
        { nombre: "Contratos", descripcion: "Gestión de contratos con subcontratistas y proveedores" },
        { nombre: "Órdenes de Cambio", descripcion: "Modificaciones al presupuesto con aprobaciones" },
        { nombre: "Control de Pagos", descripcion: "Estimaciones, pagos realizados y pendientes" },
        { nombre: "Flujo de Aprobación", descripcion: "Workflow de captura, revisión y autorización" },
        { nombre: "Reportes Financieros", descripcion: "Comparativas presupuesto vs real, proyecciones" },
      ],
      funcionalidades: [
        {
          nombre: "Presupuesto estructurado",
          descripcion: "WBS con partidas, conceptos y análisis de precios",
          prioridad: "Alta",
        },
        {
          nombre: "Control de cambios",
          descripcion: "Órdenes de cambio con impacto en tiempo y costo",
          prioridad: "Alta",
        },
        {
          nombre: "Workflow de aprobaciones",
          descripcion: "Roles jerárquicos con permisos diferenciados",
          prioridad: "Alta",
        },
        { nombre: "Estimaciones de obra", descripcion: "Cálculo de avances y pagos progresivos", prioridad: "Alta" },
        { nombre: "Comparativas", descripcion: "Presupuesto base vs contratado vs ejercido", prioridad: "Media" },
        { nombre: "Exportación a Excel", descripcion: "Reportes detallados para dirección", prioridad: "Media" },
      ],
    },
    estimacionBase: {
      fases: [
        {
          nombre: "Análisis de Procesos",
          descripcion: "Mapeo del flujo actual de control de costos",
          horas: {
            arely: 14,
            gaby: 32,
            desarrollador: 8,
          },
        },
        {
          nombre: "Módulo de Presupuesto",
          descripcion: "Estructura WBS, captura y visualización",
          horas: {
            arely: 10,
            gaby: 48,
            desarrollador: 40,
          },
        },
        {
          nombre: "Contratos y Órdenes de Cambio",
          descripcion: "Gestión de contratos y modificaciones",
          horas: {
            arely: 8,
            gaby: 40,
            desarrollador: 36,
          },
        },
        {
          nombre: "Control de Pagos",
          descripcion: "Estimaciones, pagos y conciliación",
          horas: {
            arely: 10,
            gaby: 32,
            desarrollador: 32,
          },
        },
        {
          nombre: "Workflow de Aprobaciones",
          descripcion: "Sistema de roles y permisos jerárquicos",
          horas: {
            arely: 8,
            gaby: 24,
            desarrollador: 40,
          },
        },
        {
          nombre: "Reportes y Analytics",
          descripcion: "Dashboard ejecutivo y reportes detallados",
          horas: {
            arely: 8,
            gaby: 32,
            desarrollador: 24,
          },
        },
        {
          nombre: "Testing y Capacitación",
          descripcion: "Pruebas con datos reales y capacitación de usuarios",
          horas: {
            arely: 18,
            gaby: 20,
            desarrollador: 16,
          },
        },
      ],
    },
    precioBase: 50000,
  },
  {
    id: "template-5",
    nombre: "E-commerce con Cotizador Personalizado",
    tipoProyecto: "E-commerce",
    descripcion:
      "Tienda en línea con cotizador personalizado, integración con APIs de proveedores, renderizado interactivo de productos (subir logos) y chatbot integrado.",
    predefinido: true,
    horasTotales: 650,
    mesesEstimados: 7,
    pantallasTipicas: [
      { nombre: "Home", descripcion: "Landing con productos destacados y acceso al cotizador" },
      { nombre: "Catálogo", descripcion: "Productos con filtros avanzados por categoría, precio, etc." },
      { nombre: "Cotizador Interactivo", descripcion: "Herramienta para personalizar productos y obtener precio" },
      { nombre: "Vista Previa 3D/2D", descripcion: "Renderizado en tiempo real con personalizaciones" },
      { nombre: "Carrito", descripcion: "Productos y cotizaciones guardadas" },
      { nombre: "Checkout", descripcion: "Proceso de pago con múltiples opciones" },
      { nombre: "Mi Cuenta", descripcion: "Perfil, pedidos, cotizaciones guardadas" },
      { nombre: "Admin Panel", descripcion: "Gestión de productos, integraciones y pedidos" },
    ],
    funcionalidadesTipicas: [
      {
        nombre: "Cotizador personalizado",
        descripcion: "Configurar productos, cantidades, personalización",
        prioridad: "Alta",
      },
      {
        nombre: "Renderizado interactivo",
        descripcion: "Preview en tiempo real con logos y colores",
        prioridad: "Alta",
      },
      {
        nombre: "Integración multi-proveedor",
        descripcion: "Consultar precios y stock de múltiples APIs",
        prioridad: "Alta",
      },
      { nombre: "Chatbot de ventas", descripcion: "Asistente para ayudar en la cotización", prioridad: "Media" },
      { nombre: "Carrito y checkout", descripcion: "Proceso de compra completo con pagos", prioridad: "Alta" },
      { nombre: "Gestión de pedidos", descripcion: "Tracking, estados y notificaciones", prioridad: "Media" },
    ],
    fasesTipicas: [
      {
        nombre: "Diseño UI/UX",
        descripcion: "Diseño de la experiencia de cotización y compra",
        horas: {
          arely: 12,
          gaby: 48,
          desarrollador: 8,
        },
      },
      {
        nombre: "Cotizador Personalizado",
        descripcion: "Herramienta interactiva de configuración",
        horas: {
          arely: 10,
          gaby: 56,
          desarrollador: 40,
        },
      },
      {
        nombre: "Renderizado Interactivo",
        descripcion: "Sistema de preview con subida de logos",
        horas: {
          arely: 8,
          gaby: 40,
          desarrollador: 48,
        },
      },
      {
        nombre: "Integraciones con Proveedores",
        descripcion: "Conexión con APIs para precios y stock",
        horas: {
          arely: 6,
          gaby: 16,
          desarrollador: 56,
        },
      },
      {
        nombre: "E-commerce Core",
        descripcion: "Catálogo, carrito, checkout y pagos",
        horas: {
          arely: 10,
          gaby: 48,
          desarrollador: 48,
        },
      },
      {
        nombre: "Chatbot de Ventas",
        descripcion: "Asistente conversacional integrado",
        horas: {
          arely: 6,
          gaby: 24,
          desarrollador: 32,
        },
      },
      {
        nombre: "Admin Panel",
        descripcion: "Gestión de productos, integraciones y pedidos",
        horas: {
          arely: 8,
          gaby: 32,
          desarrollador: 32,
        },
      },
      {
        nombre: "Testing y Deploy",
        descripcion: "Pruebas de integración, compras y deploy",
        horas: {
          arely: 18,
          gaby: 24,
          desarrollador: 20,
        },
      },
    ],
    alcanceBase: {
      pantallas: [
        { nombre: "Home", descripcion: "Landing con productos destacados y acceso al cotizador" },
        { nombre: "Catálogo", descripcion: "Productos con filtros avanzados por categoría, precio, etc." },
        { nombre: "Cotizador Interactivo", descripcion: "Herramienta para personalizar productos y obtener precio" },
        { nombre: "Vista Previa 3D/2D", descripcion: "Renderizado en tiempo real con personalizaciones" },
        { nombre: "Carrito", descripcion: "Productos y cotizaciones guardadas" },
        { nombre: "Checkout", descripcion: "Proceso de pago con múltiples opciones" },
        { nombre: "Mi Cuenta", descripcion: "Perfil, pedidos, cotizaciones guardadas" },
        { nombre: "Admin Panel", descripcion: "Gestión de productos, integraciones y pedidos" },
      ],
      funcionalidades: [
        {
          nombre: "Cotizador personalizado",
          descripcion: "Configurar productos, cantidades, personalización",
          prioridad: "Alta",
        },
        {
          nombre: "Renderizado interactivo",
          descripcion: "Preview en tiempo real con logos y colores",
          prioridad: "Alta",
        },
        {
          nombre: "Integración multi-proveedor",
          descripcion: "Consultar precios y stock de múltiples APIs",
          prioridad: "Alta",
        },
        { nombre: "Chatbot de ventas", descripcion: "Asistente para ayudar en la cotización", prioridad: "Media" },
        { nombre: "Carrito y checkout", descripcion: "Proceso de compra completo con pagos", prioridad: "Alta" },
        { nombre: "Gestión de pedidos", descripcion: "Tracking, estados y notificaciones", prioridad: "Media" },
      ],
    },
    estimacionBase: {
      fases: [
        {
          nombre: "Diseño UI/UX",
          descripcion: "Diseño de la experiencia de cotización y compra",
          horas: {
            arely: 12,
            gaby: 48,
            desarrollador: 8,
          },
        },
        {
          nombre: "Cotizador Personalizado",
          descripcion: "Herramienta interactiva de configuración",
          horas: {
            arely: 10,
            gaby: 56,
            desarrollador: 40,
          },
        },
        {
          nombre: "Renderizado Interactivo",
          descripcion: "Sistema de preview con subida de logos",
          horas: {
            arely: 8,
            gaby: 40,
            desarrollador: 48,
          },
        },
        {
          nombre: "Integraciones con Proveedores",
          descripcion: "Conexión con APIs para precios y stock",
          horas: {
            arely: 6,
            gaby: 16,
            desarrollador: 56,
          },
        },
        {
          nombre: "E-commerce Core",
          descripcion: "Catálogo, carrito, checkout y pagos",
          horas: {
            arely: 10,
            gaby: 48,
            desarrollador: 48,
          },
        },
        {
          nombre: "Chatbot de Ventas",
          descripcion: "Asistente conversacional integrado",
          horas: {
            arely: 6,
            gaby: 24,
            desarrollador: 32,
          },
        },
        {
          nombre: "Admin Panel",
          descripcion: "Gestión de productos, integraciones y pedidos",
          horas: {
            arely: 8,
            gaby: 32,
            desarrollador: 32,
          },
        },
        {
          nombre: "Testing y Deploy",
          descripcion: "Pruebas de integración, compras y deploy",
          horas: {
            arely: 18,
            gaby: 24,
            desarrollador: 20,
          },
        },
      ],
    },
    precioBase: 65000,
  },
  {
    id: "template-6",
    nombre: "Análisis Estratégico (Pathway to Autopilot)",
    tipoProyecto: "Personalizado",
    descripcion:
      "Servicio de consultoría para mapear procesos a nivel macro, identificar cuellos de botella, cuantificar tiempos/costos y generar roadmap de automatización con evaluación de capacidades del equipo de TI.",
    predefinido: true,
    horasTotales: 162,
    mesesEstimados: 2,
    pantallasTipicas: [
      { nombre: "No aplica - Servicio de Consultoría", descripcion: "Este es un servicio, no una plataforma" },
    ],
    funcionalidadesTipicas: [
      { nombre: "Mapeo de procesos", descripcion: "Diagramas de flujo de procesos actuales", prioridad: "Alta" },
      {
        nombre: "Identificación de cuellos de botella",
        descripcion: "Análisis de puntos de ineficiencia",
        prioridad: "Alta",
      },
      {
        nombre: "Cuantificación de impacto",
        descripcion: "Tiempos, costos y FTEs actuales vs optimizados",
        prioridad: "Alta",
      },
      { nombre: "Priorización por ROI", descripcion: "Matriz de esfuerzo vs impacto", prioridad: "Alta" },
      {
        nombre: "Roadmap de implementación",
        descripcion: "Plan detallado con fases, tiempos y presupuesto",
        prioridad: "Alta",
      },
      {
        nombre: "Evaluación del equipo TI",
        descripcion: "Capacidades actuales y necesidades de contratación",
        prioridad: "Media",
      },
    ],
    fasesTipicas: [
      {
        nombre: "Kickoff y Entrevistas",
        descripcion: "Sesión inicial y entrevistas con stakeholders clave",
        horas: {
          arely: 8,
          gaby: 12,
          desarrollador: 4,
        },
      },
      {
        nombre: "Mapeo de Procesos",
        descripcion: "Documentación detallada de procesos actuales",
        horas: {
          arely: 12,
          gaby: 20,
          desarrollador: 8,
        },
      },
      {
        nombre: "Análisis y Cuantificación",
        descripcion: "Identificación de oportunidades y cálculo de impacto",
        horas: {
          arely: 10,
          gaby: 16,
          desarrollador: 12,
        },
      },
      {
        nombre: "Priorización",
        descripcion: "Matriz de ROI y selección de iniciativas",
        horas: {
          arely: 8,
          gaby: 12,
          desarrollador: 6,
        },
      },
      {
        nombre: "Roadmap y Presupuesto",
        descripcion: "Plan de implementación con timeline y costos",
        horas: {
          arely: 10,
          gaby: 16,
          desarrollador: 8,
        },
      },
      {
        nombre: "Presentación Ejecutiva",
        descripcion: "Entrega de hallazgos y recomendaciones",
        horas: {
          arely: 6,
          gaby: 12,
          desarrollador: 2,
        },
      },
    ],
    alcanceBase: {
      pantallas: [
        { nombre: "No aplica - Servicio de Consultoría", descripcion: "Este es un servicio, no una plataforma" },
      ],
      funcionalidades: [
        { nombre: "Mapeo de procesos", descripcion: "Diagramas de flujo de procesos actuales", prioridad: "Alta" },
        {
          nombre: "Identificación de cuellos de botella",
          descripcion: "Análisis de puntos de ineficiencia",
          prioridad: "Alta",
        },
        {
          nombre: "Cuantificación de impacto",
          descripcion: "Tiempos, costos y FTEs actuales vs optimizados",
          prioridad: "Alta",
        },
        { nombre: "Priorización por ROI", descripcion: "Matriz de esfuerzo vs impacto", prioridad: "Alta" },
        {
          nombre: "Roadmap de implementación",
          descripcion: "Plan detallado con fases, tiempos y presupuesto",
          prioridad: "Alta",
        },
        {
          nombre: "Evaluación del equipo TI",
          descripcion: "Capacidades actuales y necesidades de contratación",
          prioridad: "Media",
        },
      ],
    },
    estimacionBase: {
      fases: [
        {
          nombre: "Kickoff y Entrevistas",
          descripcion: "Sesión inicial y entrevistas con stakeholders clave",
          horas: {
            arely: 8,
            gaby: 12,
            desarrollador: 4,
          },
        },
        {
          nombre: "Mapeo de Procesos",
          descripcion: "Documentación detallada de procesos actuales",
          horas: {
            arely: 12,
            gaby: 20,
            desarrollador: 8,
          },
        },
        {
          nombre: "Análisis y Cuantificación",
          descripcion: "Identificación de oportunidades y cálculo de impacto",
          horas: {
            arely: 10,
            gaby: 16,
            desarrollador: 12,
          },
        },
        {
          nombre: "Priorización",
          descripcion: "Matriz de ROI y selección de iniciativas",
          horas: {
            arely: 8,
            gaby: 12,
            desarrollador: 6,
          },
        },
        {
          nombre: "Roadmap y Presupuesto",
          descripcion: "Plan de implementación con timeline y costos",
          horas: {
            arely: 10,
            gaby: 16,
            desarrollador: 8,
          },
        },
        {
          nombre: "Presentación Ejecutiva",
          descripcion: "Entrega de hallazgos y recomendaciones",
          horas: {
            arely: 6,
            gaby: 12,
            desarrollador: 2,
          },
        },
      ],
    },
    precioBase: 16200,
  },
  {
    id: "template-7",
    nombre: "Automatización Low-Code/No-Code",
    tipoProyecto: "Personalizado",
    descripcion:
      "Programa de automatización de flujos de trabajo utilizando herramientas como Zapier, Make, Notion y Brevo. Incluye clasificación de correos, generación de tareas, seguimiento de cotizaciones y alertas.",
    predefinido: true,
    horasTotales: 160,
    mesesEstimados: 2,
    pantallasTipicas: [
      { nombre: "Dashboard de Automatizaciones", descripcion: "Vista de todas las automatizaciones activas" },
      { nombre: "Configuración de Flujos", descripcion: "Setup de triggers, acciones y condiciones" },
      { nombre: "Logs y Monitoreo", descripcion: "Historial de ejecuciones y errores" },
      { nombre: "Reportes de Eficiencia", descripcion: "Métricas de tiempo ahorrado y ejecuciones" },
    ],
    funcionalidadesTipicas: [
      {
        nombre: "Clasificación de correos",
        descripcion: "Filtrar y organizar emails automáticamente",
        prioridad: "Alta",
      },
      {
        nombre: "Generación de tareas",
        descripcion: "Crear tareas en Notion/Asana desde eventos",
        prioridad: "Alta",
      },
      {
        nombre: "Seguimiento de cotizaciones",
        descripcion: "Alertas y recordatorios automáticos",
        prioridad: "Alta",
      },
      {
        nombre: "Sincronización de datos",
        descripcion: "Mantener múltiples herramientas sincronizadas",
        prioridad: "Media",
      },
      { nombre: "Reportes automáticos", descripcion: "Envío programado de reportes por email", prioridad: "Media" },
      { nombre: "Alertas de saldos", descripcion: "Notificaciones de límites o umbrales", prioridad: "Baja" },
    ],
    fasesTipicas: [
      {
        nombre: "Mapeo de Flujos",
        descripcion: "Identificar y documentar procesos a automatizar",
        horas: {
          arely: 10,
          gaby: 16,
          desarrollador: 4,
        },
      },
      {
        nombre: "Setup de Herramientas",
        descripcion: "Configurar cuentas y permisos en plataformas",
        horas: {
          arely: 6,
          gaby: 8,
          desarrollador: 8,
        },
      },
      {
        nombre: "Desarrollo de Automatizaciones",
        descripcion: "Crear flujos en Zapier/Make con lógica condicional",
        horas: {
          arely: 8,
          gaby: 12,
          desarrollador: 32,
        },
      },
      {
        nombre: "Pruebas y Ajustes",
        descripcion: "Testing con datos reales y refinamiento",
        horas: {
          arely: 12,
          gaby: 8,
          desarrollador: 12,
        },
      },
      {
        nombre: "Documentación y Capacitación",
        descripcion: "Manuales y sesión de capacitación para el equipo",
        horas: {
          arely: 8,
          gaby: 12,
          desarrollador: 4,
        },
      },
    ],
    alcanceBase: {
      pantallas: [
        { nombre: "Dashboard de Automatizaciones", descripcion: "Vista de todas las automatizaciones activas" },
        { nombre: "Configuración de Flujos", descripcion: "Setup de triggers, acciones y condiciones" },
        { nombre: "Logs y Monitoreo", descripcion: "Historial de ejecuciones y errores" },
        { nombre: "Reportes de Eficiencia", descripcion: "Métricas de tiempo ahorrado y ejecuciones" },
      ],
      funcionalidades: [
        {
          nombre: "Clasificación de correos",
          descripcion: "Filtrar y organizar emails automáticamente",
          prioridad: "Alta",
        },
        {
          nombre: "Generación de tareas",
          descripcion: "Crear tareas en Notion/Asana desde eventos",
          prioridad: "Alta",
        },
        {
          nombre: "Seguimiento de cotizaciones",
          descripcion: "Alertas y recordatorios automáticos",
          prioridad: "Alta",
        },
        {
          nombre: "Sincronización de datos",
          descripcion: "Mantener múltiples herramientas sincronizadas",
          prioridad: "Media",
        },
        { nombre: "Reportes automáticos", descripcion: "Envío programado de reportes por email", prioridad: "Media" },
        { nombre: "Alertas de saldos", descripcion: "Notificaciones de límites o umbrales", prioridad: "Baja" },
      ],
    },
    estimacionBase: {
      fases: [
        {
          nombre: "Mapeo de Flujos",
          descripcion: "Identificar y documentar procesos a automatizar",
          horas: {
            arely: 10,
            gaby: 16,
            desarrollador: 4,
          },
        },
        {
          nombre: "Setup de Herramientas",
          descripcion: "Configurar cuentas y permisos en plataformas",
          horas: {
            arely: 6,
            gaby: 8,
            desarrollador: 8,
          },
        },
        {
          nombre: "Desarrollo de Automatizaciones",
          descripcion: "Crear flujos en Zapier/Make con lógica condicional",
          horas: {
            arely: 8,
            gaby: 12,
            desarrollador: 32,
          },
        },
        {
          nombre: "Pruebas y Ajustes",
          descripcion: "Testing con datos reales y refinamiento",
          horas: {
            arely: 12,
            gaby: 8,
            desarrollador: 12,
          },
        },
        {
          nombre: "Documentación y Capacitación",
          descripcion: "Manuales y sesión de capacitación para el equipo",
          horas: {
            arely: 8,
            gaby: 12,
            desarrollador: 4,
          },
        },
      ],
    },
    precioBase: 16000,
  },
  {
    id: "template-8",
    nombre: "Sesión de Mapeo (Mapping Room)",
    tipoProyecto: "Personalizado",
    descripcion:
      "Sesión intensiva para identificar, priorizar procesos, detectar oportunidades de automatización y entregar propuesta de proyectos con cronograma de implementación.",
    predefinido: true,
    horasTotales: 66,
    mesesEstimados: 1,
    pantallasTipicas: [
      { nombre: "No aplica - Servicio de Consultoría", descripcion: "Este es un servicio presencial/remoto" },
    ],
    funcionalidadesTipicas: [
      { nombre: "Identificación de procesos", descripcion: "Mapeo rápido de áreas clave", prioridad: "Alta" },
      {
        nombre: "Priorización colaborativa",
        descripcion: "Workshop para definir qué automatizar primero",
        prioridad: "Alta",
      },
      {
        nombre: "Detección de oportunidades",
        descripcion: "Quick wins vs proyectos estratégicos",
        prioridad: "Alta",
      },
      {
        nombre: "Propuesta de proyectos",
        descripcion: "Lista de iniciativas con alcance estimado",
        prioridad: "Alta",
      },
      { nombre: "Cronograma de implementación", descripcion: "Timeline sugerido con hitos", prioridad: "Media" },
    ],
    fasesTipicas: [
      {
        nombre: "Preparación",
        descripcion: "Alineación de objetivos y preparación de materiales",
        horas: {
          arely: 4,
          gaby: 6,
          desarrollador: 2,
        },
      },
      {
        nombre: "Sesión de Mapeo (4-6 horas)",
        descripcion: "Workshop presencial o remoto con stakeholders",
        horas: {
          arely: 6,
          gaby: 6,
          desarrollador: 4,
        },
      },
      {
        nombre: "Análisis y Priorización",
        descripcion: "Evaluar oportunidades identificadas",
        horas: {
          arely: 6,
          gaby: 8,
          desarrollador: 6,
        },
      },
      {
        nombre: "Propuesta y Cronograma",
        descripcion: "Documento de proyectos sugeridos con timeline",
        horas: {
          arely: 6,
          gaby: 8,
          desarrollador: 4,
        },
      },
    ],
    alcanceBase: {
      pantallas: [
        { nombre: "No aplica - Servicio de Consultoría", descripcion: "Este es un servicio presencial/remoto" },
      ],
      funcionalidades: [
        { nombre: "Identificación de procesos", descripcion: "Mapeo rápido de áreas clave", prioridad: "Alta" },
        {
          nombre: "Priorización colaborativa",
          descripcion: "Workshop para definir qué automatizar primero",
          prioridad: "Alta",
        },
        {
          nombre: "Detección de oportunidades",
          descripcion: "Quick wins vs proyectos estratégicos",
          prioridad: "Alta",
        },
        {
          nombre: "Propuesta de proyectos",
          descripcion: "Lista de iniciativas con alcance estimado",
          prioridad: "Alta",
        },
        { nombre: "Cronograma de implementación", descripcion: "Timeline sugerido con hitos", prioridad: "Media" },
      ],
    },
    estimacionBase: {
      fases: [
        {
          nombre: "Preparación",
          descripcion: "Alineación de objetivos y preparación de materiales",
          horas: {
            arely: 4,
            gaby: 6,
            desarrollador: 2,
          },
        },
        {
          nombre: "Sesión de Mapeo (4-6 horas)",
          descripcion: "Workshop presencial o remoto con stakeholders",
          horas: {
            arely: 6,
            gaby: 6,
            desarrollador: 4,
          },
        },
        {
          nombre: "Análisis y Priorización",
          descripcion: "Evaluar oportunidades identificadas",
          horas: {
            arely: 6,
            gaby: 8,
            desarrollador: 6,
          },
        },
        {
          nombre: "Propuesta y Cronograma",
          descripcion: "Documento de proyectos sugeridos con timeline",
          horas: {
            arely: 6,
            gaby: 8,
            desarrollador: 4,
          },
        },
      ],
    },
    precioBase: 6600,
  },
]

export function getTemplateById(id: string): CotizacionTemplate | undefined {
  return mockTemplates.find((t) => t.id === id)
}

export function getTemplatesByTipo(tipoProyecto: string): CotizacionTemplate[] {
  return mockTemplates.filter((t) => t.tipoProyecto === tipoProyecto)
}

export function getCotizacionesTemplates(): CotizacionTemplate[] {
  return mockTemplates
}
