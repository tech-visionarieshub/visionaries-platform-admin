"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Egreso } from "@/lib/mock-data/finanzas"

interface DashboardMensualProps {
  egresos: Egreso[]
}

// Función para parsear mes en formato "Enero 2024" a fecha para ordenar
function parseMesToDate(mes: string): Date {
  if (!mes) return new Date(0)
  
  const mesesMap: Record<string, number> = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
    'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
    'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
  }
  
  const partes = mes.trim().split(' ')
  if (partes.length < 2) return new Date(0)
  
  const mesNombre = partes[0].toLowerCase()
  const año = parseInt(partes[1])
  
  if (isNaN(año) || !mesesMap[mesNombre]) return new Date(0)
  
  return new Date(año, mesesMap[mesNombre], 1)
}

export function DashboardMensual({ egresos }: DashboardMensualProps) {
  // Obtener meses únicos ordenados del más actual al más viejo
  const uniqueMeses = useMemo(() => {
    const meses = Array.from(new Set(egresos.map((e) => e.mes).filter(Boolean)))
    return meses.sort((a, b) => {
      const dateA = parseMesToDate(a)
      const dateB = parseMesToDate(b)
      return dateB.getTime() - dateA.getTime() // Más reciente primero
    })
  }, [egresos])

  // Mes actual por defecto
  const mesActual = useMemo(() => {
    const ahora = new Date()
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`
  }, [])

  const [mesSeleccionado, setMesSeleccionado] = useState<string>(mesActual)

  // Calcular métricas del mes seleccionado
  const metricas = useMemo(() => {
    const egresosDelMes = egresos.filter(e => e.mes === mesSeleccionado)
    
    const pagado = egresosDelMes
      .filter(e => e.status === "Pagado")
      .reduce((sum, e) => sum + e.total, 0)
    
    const porPagar = egresosDelMes
      .filter(e => e.status === "Pendiente")
      .reduce((sum, e) => sum + e.total, 0)

    return {
      pagado,
      porPagar,
      total: pagado + porPagar,
    }
  }, [egresos, mesSeleccionado])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Mes:</Label>
        <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecciona un mes" />
          </SelectTrigger>
          <SelectContent>
            {uniqueMeses.map((mes) => (
              <SelectItem key={mes} value={mes}>
                {mes}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagado en el Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${metricas.pagado.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Egresos pagados en {mesSeleccionado}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Por Pagar en el Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${metricas.porPagar.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Egresos pendientes en {mesSeleccionado}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

