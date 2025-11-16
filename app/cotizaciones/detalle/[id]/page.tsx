import { notFound } from "next/navigation"
import { ArrowLeft, Clock, FileText, Send, CheckCircle, XCircle, Edit } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCotizaciones } from "@/lib/mock-data/cotizaciones"
import { ConvertToProjectButton } from "@/components/cotizaciones/convert-to-project-button"

export default async function CotizacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cotizaciones = getCotizaciones()
  const cotizacion = cotizaciones.find((c) => c.id === id)

  if (!cotizacion) {
    notFound()
  }

  const estadoConfig = {
    Borrador: { color: "secondary", icon: FileText },
    Enviada: { color: "default", icon: Send },
    "En revisión": { color: "default", icon: Clock },
    Aceptada: { color: "default", icon: CheckCircle },
    "Generando Contrato": { color: "default", icon: FileText },
    "Contrato en Revisión": { color: "default", icon: FileText },
    "Enviada a Firma": { color: "default", icon: Send },
    Firmada: { color: "default", icon: CheckCircle },
    Rechazada: { color: "destructive", icon: XCircle },
    Convertida: { color: "default", icon: CheckCircle },
  }

  const config = estadoConfig[cotizacion.estado as keyof typeof estadoConfig]
  const Icon = config.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cotizaciones">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{cotizacion.titulo}</h1>
              <Badge variant={config.color as any}>
                <Icon className="h-3 w-3 mr-1" />
                {cotizacion.estado}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {cotizacion.clienteNombre} • {cotizacion.tipoProyecto}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {cotizacion.estado === "Borrador" && (
            <>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </>
          )}
          {cotizacion.estado === "Aceptada" && (
            <>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generar Contrato
              </Button>
              <ConvertToProjectButton cotizacion={cotizacion} allowWithoutSignature />
            </>
          )}
          {cotizacion.estado === "Generando Contrato" && (
            <Button disabled>
              <Clock className="h-4 w-4 mr-2" />
              Generando...
            </Button>
          )}
          {cotizacion.estado === "Contrato en Revisión" && (
            <>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Ver Contrato
              </Button>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Enviar a Firma
              </Button>
            </>
          )}
          {cotizacion.estado === "Enviada a Firma" && (
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Esperando Firma
            </Button>
          )}
          {cotizacion.estado === "Firmada" && <ConvertToProjectButton cotizacion={cotizacion} />}
          {cotizacion.estado === "Convertida" && cotizacion.proyectoId && (
            <Link href={`/projects/${cotizacion.proyectoId}`}>
              <Button>
                <CheckCircle className="h-4 w-4 mr-2" />
                Ver Proyecto
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cotizacion.desglose.costoTotal.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensualidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cotizacion.desglose.mensualidad.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{cotizacion.desglose.meses} meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cotizacion.desglose.horasTotales}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fecha Creación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{new Date(cotizacion.fechaCreacion).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alcance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alcance">Alcance</TabsTrigger>
          <TabsTrigger value="estimacion">Estimación</TabsTrigger>
          <TabsTrigger value="economico">Desglose Económico</TabsTrigger>
          <TabsTrigger value="archivos">Archivos ({cotizacion.archivosInput.length})</TabsTrigger>
        </TabsList>

        {/* Tab Alcance */}
        <TabsContent value="alcance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Descripción del Proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{cotizacion.alcance.descripcion}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pantallas ({cotizacion.alcance.pantallas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {cotizacion.alcance.pantallas.map((pantalla, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-medium">{pantalla.nombre}</div>
                    <div className="text-sm text-muted-foreground">{pantalla.descripcion}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades ({cotizacion.alcance.funcionalidades.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {cotizacion.alcance.funcionalidades.map((func, index) => (
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Estimación */}
        <TabsContent value="estimacion">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Horas por Rol</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead className="text-right">Tarifa/Hora</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacion.desglose.roles.map((rol, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{rol.rol}</TableCell>
                      <TableCell className="text-right">{rol.horas}h</TableCell>
                      <TableCell className="text-right">${rol.tarifaPorHora.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${rol.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Económico */}
        <TabsContent value="economico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desglose de Costos</CardTitle>
              <CardDescription>Distribución de presupuesto por concepto</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Porcentaje</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizacion.desglose.roles.map((rol, index) => {
                    const porcentaje = (rol.total / cotizacion.desglose.costoTotal) * 100
                    return (
                      <TableRow key={index}>
                        <TableCell>{rol.rol}</TableCell>
                        <TableCell className="text-right">{porcentaje.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">${rol.total.toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right">${cotizacion.desglose.costoTotal.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {cotizacion.desglose.prototipado.incluido && (
            <Card>
              <CardHeader>
                <CardTitle>Prototipado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span>Costo de prototipado</span>
                  <span className="font-semibold">${cotizacion.desglose.prototipado.costo.toLocaleString()} USD</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Archivos */}
        <TabsContent value="archivos">
          <Card>
            <CardHeader>
              <CardTitle>Archivos del Cliente</CardTitle>
              <CardDescription>Documentos e inputs proporcionados</CardDescription>
            </CardHeader>
            <CardContent>
              {cotizacion.archivosInput.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No se han subido archivos para esta cotización</p>
              ) : (
                <div className="grid gap-2">
                  {cotizacion.archivosInput.map((archivo, index) => (
                    <div key={index} className="border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{archivo.nombre}</div>
                          <div className="text-sm text-muted-foreground">{archivo.tipo}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
