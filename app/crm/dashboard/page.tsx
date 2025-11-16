"use client"

import { PageHeader } from "@/components/ui/page-header"
import { MetricCard } from "@/components/ui/metric-card"
import { Users, TrendingUp, Clock, Target } from "lucide-react"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

// Mock data - será reemplazado con datos reales
const pipelineData = [
  { stage: "Lead", count: 45, color: "#4BBAFF" },
  { stage: "Contactado", count: 38, color: "#9832FF" },
  { stage: "Discovery", count: 28, color: "#4514F9" },
  { stage: "Propuesta", count: 18, color: "#95C900" },
  { stage: "Negociación", count: 12, color: "#F59E0B" },
  { stage: "Onboarding", count: 8, color: "#4BBAFF" },
  { stage: "Cliente", count: 5, color: "#95C900" },
]

const recentActivity = [
  {
    id: 1,
    type: "Llamada",
    lead: "Tech Solutions SA",
    user: "María González",
    time: "Hace 2 horas",
    description: "Primera llamada de contacto realizada",
  },
  {
    id: 2,
    type: "Propuesta",
    lead: "Innovate Corp",
    user: "Carlos Ruiz",
    time: "Hace 4 horas",
    description: "Propuesta económica enviada",
  },
  {
    id: 3,
    type: "Reunión",
    lead: "Digital Partners",
    user: "Ana Martínez",
    time: "Hace 6 horas",
    description: "Reunión de discovery completada",
  },
  {
    id: 4,
    type: "Email",
    lead: "StartUp XYZ",
    user: "María González",
    time: "Hace 1 día",
    description: "Email de seguimiento enviado",
  },
]

const conversionData = [
  { month: "Ene", leads: 52, converted: 8 },
  { month: "Feb", leads: 48, converted: 12 },
  { month: "Mar", leads: 65, converted: 15 },
  { month: "Abr", leads: 58, converted: 11 },
  { month: "May", leads: 71, converted: 18 },
  { month: "Jun", leads: 45, converted: 14 },
]

export default function CRMDashboard() {
  const totalLeads = pipelineData.reduce((sum, stage) => sum + stage.count, 0)
  const conversionRate = 23.5 // Mock
  const avgTime = 18 // días promedio

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard CRM" description="Visión general del pipeline comercial y actividad de leads" />

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Leads Activos"
          value={totalLeads.toString()}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          description="vs. mes anterior"
        />
        <MetricCard
          title="Tasa de Conversión"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          trend={{ value: 5.2, isPositive: true }}
          description="vs. mes anterior"
        />
        <MetricCard
          title="Tiempo Promedio"
          value={`${avgTime} días`}
          icon={Clock}
          trend={{ value: 3, isPositive: false }}
          description="por etapa"
        />
        <MetricCard
          title="Meta Mensual"
          value="15/20"
          icon={Target}
          trend={{ value: 75, isPositive: true }}
          description="conversiones"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline por etapa */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Pipeline por Etapa</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E0734",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Conversión mensual */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Conversión Últimos 6 Meses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E0734",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="leads" fill="#4BBAFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" fill="#95C900" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4BBAFF]" />
              <span className="text-sm text-muted-foreground">Leads Totales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#95C900]" />
              <span className="text-sm text-muted-foreground">Convertidos</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{activity.lead}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">{activity.type}</span>
                  <span className="text-xs text-muted-foreground">por {activity.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
