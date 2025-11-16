"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, DollarSign, FileText, Download, Calendar, BarChart3, PieChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Mock data for charts
const cashFlowData = [
  { mes: "Ene", ingresos: 450000, egresos: 280000, neto: 170000 },
  { mes: "Feb", ingresos: 520000, egresos: 310000, neto: 210000 },
  { mes: "Mar", ingresos: 480000, egresos: 295000, neto: 185000 },
  { mes: "Abr", ingresos: 610000, egresos: 340000, neto: 270000 },
  { mes: "May", ingresos: 580000, egresos: 325000, neto: 255000 },
  { mes: "Jun", ingresos: 650000, egresos: 360000, neto: 290000 },
]

const categoryDistribution = [
  { name: "Automatización", value: 450000, color: "#4514F9" },
  { name: "Plataforma", value: 380000, color: "#E02814" },
  { name: "Estudios", value: 320000, color: "#10B981" },
  { name: "Cursos", value: 280000, color: "#F59E0B" },
  { name: "Conferencias", value: 220000, color: "#8B5CF6" },
  { name: "Productos", value: 180000, color: "#EC4899" },
  { name: "CFH", value: 150000, color: "#06B6D4" },
]

const clientProfitability = [
  { cliente: "TechCorp SA", ingresos: 850000, egresos: 420000, margen: 50.6 },
  { cliente: "Innovate Ltd", ingresos: 720000, egresos: 380000, margen: 47.2 },
  { cliente: "Digital Solutions", ingresos: 650000, egresos: 350000, margen: 46.2 },
  { cliente: "StartupHub", ingresos: 580000, egresos: 320000, margen: 44.8 },
  { cliente: "Enterprise Co", ingresos: 520000, egresos: 290000, margen: 44.2 },
]

const monthlyTrends = [
  { mes: "Ene", facturado: 450000, cobrado: 420000, pendiente: 30000 },
  { mes: "Feb", facturado: 520000, cobrado: 480000, pendiente: 40000 },
  { mes: "Mar", facturado: 480000, cobrado: 450000, pendiente: 30000 },
  { mes: "Abr", facturado: 610000, cobrado: 570000, pendiente: 40000 },
  { mes: "May", facturado: 580000, cobrado: 540000, pendiente: 40000 },
  { mes: "Jun", facturado: 650000, cobrado: 600000, pendiente: 50000 },
]

export function ReportsAnalytics() {
  const [period, setPeriod] = useState("6m")
  const [reportType, setReportType] = useState("general")

  const exportToExcel = () => {
    // Simulated export
    console.log("Exportando a Excel...")
    alert("Reporte exportado a Excel exitosamente")
  }

  const exportToPDF = () => {
    // Simulated export
    console.log("Exportando a PDF...")
    alert("Reporte exportado a PDF exitosamente")
  }

  const generateAIReport = () => {
    // Simulated AI report generation
    console.log("Generando reporte con IA...")
    alert(
      "Reporte ejecutivo generado:\n\n" +
        "📊 Resumen Ejecutivo:\n" +
        "- Flujo de caja positivo con tendencia creciente (+18% vs período anterior)\n" +
        "- Margen promedio de 46.6% en los principales clientes\n" +
        "- Automatización es la categoría con mayor facturación\n" +
        "- Recomendación: Incrementar inversión en Automatización y Plataforma",
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes y Analytics</h1>
          <p className="text-sm text-muted-foreground">Análisis financiero y reportes ejecutivos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Período</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Último mes</SelectItem>
                <SelectItem value="3m">3 meses</SelectItem>
                <SelectItem value="6m">6 meses</SelectItem>
                <SelectItem value="1y">1 año</SelectItem>
                <SelectItem value="all">Todo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo de Reporte</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="cashflow">Flujo de Caja</SelectItem>
                <SelectItem value="profitability">Rentabilidad</SelectItem>
                <SelectItem value="expenses">Egresos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button size="sm" onClick={generateAIReport}>
              <FileText className="mr-2 h-4 w-4" />
              Generar con IA
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flujo de Caja Neto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,380,000</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+18.2% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">46.6%</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+2.4% vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$230,000</div>
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <TrendingUp className="h-3 w-3" />
              <span>+12.5% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Promedio</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+5.1% vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Caja</CardTitle>
            <CardDescription>Ingresos vs Egresos (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
                <Bar dataKey="egresos" fill="#E02814" name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Categoría</CardTitle>
            <CardDescription>Egresos por tipo de servicio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Facturación</CardTitle>
            <CardDescription>Facturado vs Cobrado (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="facturado" stroke="#4514F9" name="Facturado" strokeWidth={2} />
                <Line type="monotone" dataKey="cobrado" stroke="#10B981" name="Cobrado" strokeWidth={2} />
                <Line type="monotone" dataKey="pendiente" stroke="#F59E0B" name="Pendiente" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad por Cliente</CardTitle>
            <CardDescription>Top 5 clientes por margen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientProfitability.map((client, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{client.cliente}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Ingresos: ${client.ingresos.toLocaleString()}</span>
                      <span>•</span>
                      <span>Egresos: ${client.egresos.toLocaleString()}</span>
                    </div>
                  </div>
                  <Badge variant={client.margen > 45 ? "default" : "secondary"} className="ml-2">
                    {client.margen}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights con IA</CardTitle>
          <CardDescription>Análisis automático del período seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Tendencia Positiva en Flujo de Caja</p>
                <p className="text-sm text-muted-foreground">
                  El flujo de caja neto ha incrementado 18.2% comparado con el período anterior, principalmente
                  impulsado por el crecimiento en servicios de Automatización y Plataforma.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Oportunidad de Optimización</p>
                <p className="text-sm text-muted-foreground">
                  Los egresos en la categoría CFH representan solo el 7.7% del total. Considera reasignar recursos de
                  categorías con menor ROI para maximizar rentabilidad.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium">Atención: Cuentas por Cobrar</p>
                <p className="text-sm text-muted-foreground">
                  Las cuentas por cobrar han aumentado 12.5% este mes. Considera implementar recordatorios automáticos
                  para mejorar el flujo de efectivo.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
