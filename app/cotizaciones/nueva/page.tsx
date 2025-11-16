"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PasoInformacionBasica } from "@/components/cotizaciones/wizard/paso-informacion-basica"
import { PasoAlcance } from "@/components/cotizaciones/wizard/paso-alcance"
import { PasoArchivos } from "@/components/cotizaciones/wizard/paso-archivos"
import { PasoEstimacion } from "@/components/cotizaciones/wizard/paso-estimacion"
import { PasoCalculoEconomico } from "@/components/cotizaciones/wizard/paso-calculo-economico"
import { PasoRevision } from "@/components/cotizaciones/wizard/paso-revision"
import type { CotizacionDraft } from "@/lib/types/cotizacion"

const PASOS = [
  { numero: 1, titulo: "Información Básica", componente: PasoInformacionBasica },
  { numero: 2, titulo: "Alcance", componente: PasoAlcance },
  { numero: 3, titulo: "Archivos", componente: PasoArchivos },
  { numero: 4, titulo: "Estimación", componente: PasoEstimacion },
  { numero: 5, titulo: "Cálculo Económico", componente: PasoCalculoEconomico },
  { numero: 6, titulo: "Revisión", componente: PasoRevision },
]

export default function NuevaCotizacionPage() {
  const router = useRouter()
  const [pasoActual, setPasoActual] = useState(1)
  const [cotizacion, setCotizacion] = useState<CotizacionDraft>({
    titulo: "",
    clienteId: "",
    clienteNombre: "",
    tipoProyecto: "Personalizado",
    descripcion: "",
    usarTemplate: false,
    templateId: undefined,
    alcance: {
      pantallas: [],
      funcionalidades: [],
      flujos: [],
      integraciones: [],
    },
    archivos: [],
    estimacion: {
      fases: [],
    },
    calculoEconomico: {
      roles: [],
      horasTotales: 0,
      costoTotal: 0,
      mensualidad: 0,
      meses: 0,
      prototipado: { incluido: false, costo: 0 },
    },
  })

  const PasoComponente = PASOS[pasoActual - 1].componente

  const handleSiguiente = () => {
    if (pasoActual < PASOS.length) {
      setPasoActual(pasoActual + 1)
    }
  }

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1)
    }
  }

  const handleGuardar = () => {
    // Simular guardado
    console.log("[v0] Guardando cotización:", cotizacion)
    router.push("/cotizaciones")
  }

  const actualizarCotizacion = (datos: Partial<CotizacionDraft>) => {
    setCotizacion((prev) => ({ ...prev, ...datos }))
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cotizaciones">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Nueva Cotización</h1>
              <p className="text-muted-foreground">
                Paso {pasoActual} de {PASOS.length}
              </p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            {PASOS.map((paso, index) => (
              <div key={paso.numero} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                      pasoActual > paso.numero
                        ? "bg-green-500 border-green-500 text-white"
                        : pasoActual === paso.numero
                          ? "border-[#4514F9] bg-[#4514F9] text-white"
                          : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {pasoActual > paso.numero ? <Check className="h-5 w-5" /> : paso.numero}
                  </div>
                  <span
                    className={`text-xs font-medium hidden md:block ${
                      pasoActual >= paso.numero ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {paso.titulo}
                  </span>
                </div>
                {index < PASOS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${pasoActual > paso.numero ? "bg-green-500" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Contenido del paso */}
        <Card className="p-6">
          <PasoComponente cotizacion={cotizacion} actualizarCotizacion={actualizarCotizacion} />
        </Card>

        {/* Navegación */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleAnterior} disabled={pasoActual === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGuardar}>
              Guardar borrador
            </Button>
            {pasoActual === PASOS.length ? (
              <Button onClick={handleGuardar}>
                <Check className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            ) : (
              <Button onClick={handleSiguiente}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
