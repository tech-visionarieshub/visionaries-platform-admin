"use client"
import { PageHeader } from "@/components/ui/page-header"
import { MetricCard } from "@/components/ui/metric-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Clock, AlertCircle, Calendar } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts"

export default function FinanceDashboard() {
  // Mock data - reemplazar con datos reales
  const metrics = {
    facturado: 450000,
    cobrado: 380000,
    porCobrar: 70000,
    vencido: 15000,
    dso: 28,
  }

  const agingData = [
    { name: "0-30 días", value: 35000, fill: "var(--brand-green)" },
    { name: "31-60 días", value: 20000, fill: "var(--brand-blue)" },
    { name: "61-90 días", value: 10000, fill: "var(--brand-purple)" },
    { name: "+90 días", value: 5000, fill: "var(--brand-red)" },
  ]

  const revenueData = [
    { month: "Ene", facturado: 320000, cobrado: 280000 },
    { month: "Feb", facturado: 380000, cobrado: 350000 },
    { month: "Mar", facturado: 420000, cobrado: 390000 },
    { month: "Abr", facturado: 450000, cobrado: 380000 },
  ]

  const upcomingPayments = [
    {
      id: 1,
      cliente: "Tech Solutions SA",
      factura: "FAC-2024-001",
      monto: 25000,
      fecha: "2024-01-20",
      estado: "Próximo",
    },
    { id: 2, cliente: "Innovate Corp", factura: "FAC-2024-003", monto: 18000, fecha: "2024-01-22", estado: "Próximo" },
    {
      id: 3,
      cliente: "Digital Ventures",
      factura: "FAC-2024-005",
      monto: 12000,
      fecha: "2024-01-15",
      estado: "Vencido",
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard Financiero" description="Resumen de facturación y cobros" />

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Facturado (mes)"
          value={`$${(metrics.facturado / 1000).toFixed(0)}K`}
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Cobrado (mes)"
          value={`$${(metrics.cobrado / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard title="Por Cobrar" value={`$${(metrics.porCobrar / 1000).toFixed(0)}K`} icon={Clock} />
        <MetricCard
          title="Vencido"
          value={`$${(metrics.vencido / 1000).toFixed(0)}K`}
          icon={AlertCircle}
          trend={{ value: 5, isPositive: false }}
        />
        <MetricCard title="DSO" value={`${metrics.dso} días`} icon={Calendar} description="Days Sales Outstanding" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging de Cartera */}
        <Card>
          <CardHeader>
            <CardTitle>Aging de Cartera</CardTitle>
            <CardDescription>Distribución de cuentas por cobrar por antigüedad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${(value as number).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ingresos Mensuales */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>Comparación de facturado vs cobrado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => `$${(value as number).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="facturado" fill="var(--brand-purple)" name="Facturado" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cobrado" fill="var(--brand-green)" name="Cobrado" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Cobros */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Cobros</CardTitle>
          <CardDescription>Facturas con vencimiento próximo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{payment.cliente}</p>
                  <p className="text-sm text-muted-foreground">{payment.factura}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">${payment.monto.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{payment.fecha}</p>
                  </div>
                  <StatusBadge status={payment.estado === "Vencido" ? "error" : "warning"} label={payment.estado} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
