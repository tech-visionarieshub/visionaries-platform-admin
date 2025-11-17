"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Clock, FileText, Lightbulb, DollarSign, Copy, Pencil } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTemplateById } from "@/lib/api/templates-api"
import type { CotizacionTemplate } from "@/lib/mock-data/cotizaciones-templates"

export default function TemplateDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [template, setTemplate] = useState<CotizacionTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTemplate() {
      try {
        const data = await getTemplateById(id)
        setTemplate(data)
      } catch (err) {
        console.error("Error loading template:", err)
      } finally {
        setLoading(false)
      }
    }
    if (id) {
      loadTemplate()
    }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <p>Cargando template...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <p>Template no encontrado</p>
      </div>
    )
  }

  const totalHoras = template.estimacionBase.fases.reduce(
    (sum, fase) => sum + fase.horas.arely + fase.horas.gaby + fase.horas.desarrollador,
    0,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cotizaciones/templates">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{template.nombre}</h1>
            <p className="text-muted-foreground">{template.descripcion}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/cotizaciones/nueva?template=${template.id}`}>
            <Button>
              <Copy className="h-4 w-4 mr-2" />
              Usar Template
            </Button>
          </Link>
          <Button variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{template.tipoProyecto}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pantallas</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{template.alcanceBase.pantallas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Estimadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoras}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Base</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${template.precioBase.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alcance Base */}
      <Card>
        <CardHeader>
          <CardTitle>Alcance del Proyecto</CardTitle>
          <CardDescription>Pantallas y funcionalidades incluidas en este template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pantallas */}
          <div>
            <h3 className="font-semibold mb-3">Pantallas ({template.alcanceBase.pantallas.length})</h3>
            <div className="grid gap-2">
              {template.alcanceBase.pantallas.map((pantalla, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="font-medium">{pantalla.nombre}</div>
                  <div className="text-sm text-muted-foreground">{pantalla.descripcion}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Funcionalidades */}
          <div>
            <h3 className="font-semibold mb-3">Funcionalidades ({template.alcanceBase.funcionalidades.length})</h3>
            <div className="grid gap-2">
              {template.alcanceBase.funcionalidades.map((func, index) => (
                <div key={index} className="border rounded-lg p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{func.nombre}</div>
                    <div className="text-sm text-muted-foreground">{func.descripcion}</div>
                  </div>
                  <Badge
                    variant={
                      func.prioridad === "Alta" ? "destructive" : func.prioridad === "Media" ? "default" : "secondary"
                    }
                  >
                    {func.prioridad}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Flujos */}
          {template.alcanceBase.flujos && template.alcanceBase.flujos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Flujos Principales ({template.alcanceBase.flujos.length})</h3>
              <div className="grid gap-2">
                {template.alcanceBase.flujos.map((flujo, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-medium mb-2">{flujo.nombre}</div>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {flujo.pasos.map((paso, pIndex) => (
                        <li key={pIndex}>{paso}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estimación de Horas */}
      <Card>
        <CardHeader>
          <CardTitle>Estimación de Horas por Fase</CardTitle>
          <CardDescription>Distribución de trabajo entre roles del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fase</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Arely</TableHead>
                <TableHead className="text-right">Gaby</TableHead>
                <TableHead className="text-right">Desarrollador</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.estimacionBase.fases.map((fase, index) => {
                const totalFase = fase.horas.arely + fase.horas.gaby + fase.horas.desarrollador
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{fase.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{fase.descripcion}</TableCell>
                    <TableCell className="text-right">{fase.horas.arely}h</TableCell>
                    <TableCell className="text-right">{fase.horas.gaby}h</TableCell>
                    <TableCell className="text-right">{fase.horas.desarrollador}h</TableCell>
                    <TableCell className="text-right font-medium">{totalFase}h</TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">
                  {template.estimacionBase.fases.reduce((sum, f) => sum + f.horas.arely, 0)}h
                </TableCell>
                <TableCell className="text-right">
                  {template.estimacionBase.fases.reduce((sum, f) => sum + f.horas.gaby, 0)}h
                </TableCell>
                <TableCell className="text-right">
                  {template.estimacionBase.fases.reduce((sum, f) => sum + f.horas.desarrollador, 0)}h
                </TableCell>
                <TableCell className="text-right">{totalHoras}h</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
