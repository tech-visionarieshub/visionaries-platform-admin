"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Mock data
const conversionFunnelData = [
  { stage: "Lead Ingresado", count: 45, percentage: 100 },
  { stage: "Contactado", count: 38, percentage: 84 },
  { stage: "Discovery", count: 32, percentage: 71 },
  { stage: "Propuesta", count: 25, percentage: 56 },
  { stage: "Negociación", count: 18, percentage: 40 },
  { stage: "Cliente Activo", count: 12, percentage: 27 },
]

const timeByStageData = [
  { stage: "Lead Ingresado", days: 2 },
  { stage: "Contactado", days: 3 },
  { stage: "Discovery", days: 7 },
  { stage: "Propuesta", days: 5 },
  { stage: "Negociación", days: 8 },
  { stage: "Onboarding", days: 4 },
]

const leadsBySourceData = [
  { name: "Sitio Web", value: 35, color: "#4514F9" },
  { name: "Referidos", value: 25, color: "#4BBAFF" },
  { name: "Redes Sociales", value: 20, color: "#9832FF" },
  { name: "Email Marketing", value: 12, color: "#95C900" },
  { name: "Eventos", value: 8, color: "#E02814" },
]

const performanceByUserData = [
  { user: "Carlos García", leads: 18, converted: 8, rate: 44 },
  { user: "Ana García", leads: 15, converted: 6, rate: 40 },
  { user: "Luis Torres", leads: 12, converted: 4, rate: 33 },
]

const monthlyTrendData = [
  { month: "Ene", leads: 32, converted: 8 },
  { month: "Feb", leads: 38, converted: 10 },
  { month: "Mar", leads: 45, converted: 12 },
  { month: "Abr", leads: 42, converted: 11 },
  { month: "May", leads: 50, converted: 15 },
  { month: "Jun", leads: 48, converted: 14 },
]

export default function CRMReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Reportes CRM" description="Análisis detallado del desempeño comercial" />
        <div className="flex items-center gap-3">
          <Select defaultValue="6months">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mes</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Conversion Funnel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Embudo de Conversión</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={conversionFunnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" />
            <YAxis dataKey="stage" type="category" width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="#4514F9" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-6 gap-4">
          {conversionFunnelData.map((item) => (
            <div key={item.stage} className="text-center">
              <div className="text-2xl font-bold text-brand-purple">{item.percentage}%</div>
              <div className="text-xs text-muted-foreground mt-1">{item.stage}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time by Stage */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tiempo Promedio por Etapa</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeByStageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: "Días", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Bar dataKey="days" fill="#4BBAFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Leads by Source */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Leads por Origen</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadsBySourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {leadsBySourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendencia Mensual</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="leads" stroke="#4514F9" strokeWidth={2} name="Leads Totales" />
            <Line type="monotone" dataKey="converted" stroke="#95C900" strokeWidth={2} name="Convertidos" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Performance by User */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Desempeño por Usuario</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Usuario</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Leads Asignados</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Convertidos</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Tasa de Conversión</th>
              </tr>
            </thead>
            <tbody>
              {performanceByUserData.map((user) => (
                <tr key={user.user} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{user.user}</td>
                  <td className="py-3 px-4 text-right">{user.leads}</td>
                  <td className="py-3 px-4 text-right">{user.converted}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green">
                      {user.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
