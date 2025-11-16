"use client"

import { PageHeader } from "@/components/ui/page-header"
import { MetricCard } from "@/components/ui/metric-card"
import { Button } from "@/components/ui/button"
import { Plus, Users, DollarSign, Clock, Folder } from "lucide-react"
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

const pipelineData = [
  { name: "Lead", value: 45 },
  { name: "Contactado", value: 38 },
  { name: "Discovery", value: 28 },
  { name: "Propuesta", value: 22 },
  { name: "Negociación", value: 15 },
  { name: "Onboarding", value: 12 },
]

const revenueData = [
  { month: "Ene", facturado: 45000, cobrado: 42000 },
  { month: "Feb", facturado: 52000, cobrado: 48000 },
  { month: "Mar", facturado: 48000, cobrado: 45000 },
  { month: "Abr", facturado: 61000, cobrado: 58000 },
  { month: "May", facturado: 55000, cobrado: 52000 },
  { month: "Jun", facturado: 67000, cobrado: 63000 },
]

const projectStatusData = [
  { name: "En Desarrollo", value: 8, color: "#4514F9" },
  { name: "QA", value: 3, color: "#4BBAFF" },
  { name: "Garantía", value: 5, color: "#9832FF" },
  { name: "Finalizados", value: 12, color: "#95C900" },
]

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Dashboard Ejecutivo"
        description="Vista general de métricas comerciales, financieras y operativas"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lead
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Leads Activos"
          value="45"
          description="En pipeline comercial"
          trend={{ value: 12, isPositive: true }}
          icon={Users}
        />
        <MetricCard
          title="Facturado (Mes)"
          value="$67,000"
          description="Total facturado en junio"
          trend={{ value: 8, isPositive: true }}
          icon={DollarSign}
        />
        <MetricCard
          title="Por Cobrar"
          value="$23,500"
          description="Pendiente de cobro"
          trend={{ value: 5, isPositive: false }}
          icon={Clock}
        />
        <MetricCard
          title="Proyectos Activos"
          value="16"
          description="En desarrollo y QA"
          trend={{ value: 3, isPositive: true }}
          icon={Folder}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Pipeline Comercial */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Pipeline Comercial</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E0734",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
              />
              <Bar dataKey="value" fill="#4514F9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ingresos Mensuales */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Ingresos Mensuales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E0734",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="facturado" stroke="#4514F9" strokeWidth={2} name="Facturado" />
              <Line type="monotone" dataKey="cobrado" stroke="#95C900" strokeWidth={2} name="Cobrado" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Estado de Proyectos */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Estado de Proyectos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E0734",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Actividad Reciente */}
        <div className="rounded-lg border bg-card p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold">Actividad Reciente</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 border-l-2 border-brand-purple pl-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Nuevo lead: Empresa XYZ</p>
                <p className="text-xs text-muted-foreground">Hace 2 horas • CRM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-brand-green pl-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Pago recibido: $15,000</p>
                <p className="text-xs text-muted-foreground">Hace 4 horas • Finanzas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-brand-blue pl-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Proyecto "App Mobile" en QA</p>
                <p className="text-xs text-muted-foreground">Hace 6 horas • Proyectos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-brand-purple-mid pl-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Propuesta enviada a Cliente ABC</p>
                <p className="text-xs text-muted-foreground">Hace 1 día • CRM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-brand-red pl-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Factura vencida: Cliente DEF</p>
                <p className="text-xs text-muted-foreground">Hace 1 día • Finanzas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
