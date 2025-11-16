"use client"

import { PageHeader } from "@/components/ui/page-header"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, DollarSign, FolderKanban, TrendingUp, Download, Calendar } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Mock data - análisis cruzado entre módulos
const conversionData = [
  { etapa: "Leads", cantidad: 45, color: "#4BBAFF" },
  { etapa: "Propuestas", cantidad: 28, color: "#9832FF" },
  { etapa: "Clientes", cantidad: 18, color: "#95C900" },
  { etapa: "Proyectos", cantidad: 15, color: "#4514F9" },
]

const revenueVsCostData = [
  { mes: "Ene", ingresos: 85000, costos: 45000 },
  { mes: "Feb", ingresos: 92000, costos: 48000 },
  { mes: "Mar", ingresos: 78000, costos: 42000 },
  { mes: "Abr", ingresos: 105000, costos: 52000 },
  { mes: "May", ingresos: 98000, costos: 49000 },
  { mes: "Jun", ingresos: 112000, costos: 55000 },
]

const teamEfficiencyData = [
  { nombre: "María González", leads: 12, proyectos: 4, facturado: 85000 },
  { nombre: "Carlos Ruiz", leads: 15, proyectos: 5, facturado: 92000 },
  { nombre: "Ana Martínez", leads: 10, proyectos: 3, facturado: 68000 },
  { nombre: "Luis Torres", leads: 8, proyectos: 3, facturado: 55000 },
]

const clientAnalysisData = [
  {
    cliente: "Tech Solutions SA",
    leads: 3,
    proyectos: 2,
    facturado: 125000,
    estado: "Activo",
    ultimaInteraccion: "2025-01-10",
  },
  {
    cliente: "Innovate Corp",
    leads: 2,
    proyectos: 1,
    facturado: 85000,
    estado: "Activo",
    ultimaInteraccion: "2025-01-08",
  },
  {
    cliente: "Digital Ventures",
    leads: 4,
    proyectos: 3,
    facturado: 210000,
    estado: "Garantía",
    ultimaInteraccion: "2025-01-05",
  },
  {
    cliente: "StartUp XYZ",
    leads: 1,
    proyectos: 1,
    facturado: 45000,
    estado: "Finalizado",
    ultimaInteraccion: "2024-12-20",
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Reportes & Métricas Globales"
          description="Análisis consolidado de todos los módulos de la plataforma"
        />
        <div className="flex items-center gap-3">
          <Select defaultValue="6m">
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mes</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Métricas Consolidadas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Leads Activos"
          value="45"
          description="En pipeline comercial"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Ingresos Totales"
          value="$465K"
          description="Últimos 6 meses"
          icon={DollarSign}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Proyectos Activos"
          value="15"
          description="En desarrollo"
          icon={FolderKanban}
          trend={{ value: 3, isPositive: true }}
        />
        <MetricCard
          title="Tasa de Conversión"
          value="33%"
          description="Lead a Proyecto"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Análisis de Conversión del Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Conversión del Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="etapa" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#4BBAFF]" />
              <span className="text-muted-foreground">Tasa Lead → Propuesta: 62%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#95C900]" />
              <span className="text-muted-foreground">Tasa Propuesta → Cliente: 64%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#4514F9]" />
              <span className="text-muted-foreground">Tasa Cliente → Proyecto: 83%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingresos vs Costos Operativos */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Costos Operativos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueVsCostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#4514F9"
                strokeWidth={3}
                name="Ingresos"
                dot={{ fill: "#4514F9", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="costos"
                stroke="#E02814"
                strokeWidth={3}
                name="Costos"
                dot={{ fill: "#E02814", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
            <div>
              <p className="text-sm text-muted-foreground">Margen Promedio</p>
              <p className="text-2xl font-bold text-[#95C900]">48%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mejor Mes</p>
              <p className="text-2xl font-bold">Junio</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilidad Total</p>
              <p className="text-2xl font-bold">$174K</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eficiencia del Equipo */}
      <Card>
        <CardHeader>
          <CardTitle>Eficiencia del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamEfficiencyData.map((member, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4514F9] text-lg font-bold text-white">
                    {member.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{member.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.leads} leads • {member.proyectos} proyectos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#4514F9]">${member.facturado.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Facturado</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análisis por Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-semibold">Cliente</th>
                  <th className="p-3 text-center text-sm font-semibold">Leads</th>
                  <th className="p-3 text-center text-sm font-semibold">Proyectos</th>
                  <th className="p-3 text-right text-sm font-semibold">Facturado</th>
                  <th className="p-3 text-center text-sm font-semibold">Estado</th>
                  <th className="p-3 text-center text-sm font-semibold">Última Interacción</th>
                </tr>
              </thead>
              <tbody>
                {clientAnalysisData.map((client, index) => (
                  <tr key={index} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{client.cliente}</td>
                    <td className="p-3 text-center">{client.leads}</td>
                    <td className="p-3 text-center">{client.proyectos}</td>
                    <td className="p-3 text-right font-semibold">${client.facturado.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          client.estado === "Activo"
                            ? "bg-[#95C900]/20 text-[#95C900]"
                            : client.estado === "Garantía"
                              ? "bg-[#4BBAFF]/20 text-[#4BBAFF]"
                              : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {client.estado}
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm text-muted-foreground">
                      {new Date(client.ultimaInteraccion).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
