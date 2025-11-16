"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

// Mock data - reemplazar con datos reales
const revenueByMonth = [
  { mes: "Ago", facturado: 120000, cobrado: 100000 },
  { mes: "Sep", facturado: 150000, cobrado: 130000 },
  { mes: "Oct", facturado: 180000, cobrado: 160000 },
  { mes: "Nov", facturado: 200000, cobrado: 180000 },
  { mes: "Dic", facturado: 220000, cobrado: 200000 },
  { mes: "Ene", facturado: 250000, cobrado: 230000 },
]

const collectionEfficiency = [
  { mes: "Ago", eficiencia: 83 },
  { mes: "Sep", eficiencia: 87 },
  { mes: "Oct", eficiencia: 89 },
  { mes: "Nov", eficiencia: 90 },
  { mes: "Dic", eficiencia: 91 },
  { mes: "Ene", eficiencia: 92 },
]

const clientPortfolio = [
  { cliente: "Tech Solutions SA", monto: 87000, porcentaje: 25 },
  { cliente: "Digital Marketing Inc", monto: 65000, porcentaje: 19 },
  { cliente: "E-commerce Plus", monto: 58000, porcentaje: 17 },
  { cliente: "Startup Ventures", monto: 45000, porcentaje: 13 },
  { cliente: "Creative Agency", monto: 38000, porcentaje: 11 },
  { cliente: "Otros", monto: 52000, porcentaje: 15 },
]

const dsoTrend = [
  { mes: "Ago", dso: 45 },
  { mes: "Sep", dso: 42 },
  { mes: "Oct", dso: 38 },
  { mes: "Nov", dso: 35 },
  { mes: "Dic", dso: 32 },
  { mes: "Ene", dso: 30 },
]

const COLORS = ["#4514F9", "#4BBAFF", "#9832FF", "#95C900", "#F59E0B", "#E02814"]

export default function FinanceReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0E0734]">Reportes Financieros</h1>
        <p className="text-sm text-[#6B7280]">Análisis detallado de ingresos, cobranza y cartera de clientes</p>
      </div>

      {/* Ingresos Mensuales */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E0734",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
              />
              <Legend />
              <Bar dataKey="facturado" fill="#4514F9" name="Facturado" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cobrado" fill="#95C900" name="Cobrado" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Eficiencia de Cobranza */}
        <Card>
          <CardHeader>
            <CardTitle>Eficiencia de Cobranza</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={collectionEfficiency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="mes" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0E0734",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Line
                  type="monotone"
                  dataKey="eficiencia"
                  stroke="#4BBAFF"
                  strokeWidth={3}
                  dot={{ fill: "#4BBAFF", r: 4 }}
                  name="Eficiencia %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cartera por Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Cartera por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={clientPortfolio}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ porcentaje }) => `${porcentaje}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="monto"
                >
                  {clientPortfolio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0E0734",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                  }}
                  formatter={(value: number) => `$${value.toLocaleString("es-MX")}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* DSO Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de DSO (Days Sales Outstanding)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dsoTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mes" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E0734",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                }}
                formatter={(value) => `${value} días`}
              />
              <Line
                type="monotone"
                dataKey="dso"
                stroke="#9832FF"
                strokeWidth={3}
                dot={{ fill: "#9832FF", r: 4 }}
                name="DSO"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla de Cartera */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Cartera por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="pb-3 text-left text-xs font-medium uppercase text-[#6B7280]">Cliente</th>
                  <th className="pb-3 text-right text-xs font-medium uppercase text-[#6B7280]">Monto</th>
                  <th className="pb-3 text-right text-xs font-medium uppercase text-[#6B7280]">% del Total</th>
                  <th className="pb-3 text-center text-xs font-medium uppercase text-[#6B7280]">Indicador</th>
                </tr>
              </thead>
              <tbody>
                {clientPortfolio.map((client, index) => (
                  <tr key={client.cliente} className="border-b border-[#E5E7EB]">
                    <td className="py-3 text-sm text-[#1A1A1A]">{client.cliente}</td>
                    <td className="py-3 text-right text-sm font-medium text-[#1A1A1A]">
                      ${client.monto.toLocaleString("es-MX")}
                    </td>
                    <td className="py-3 text-right text-sm text-[#1A1A1A]">{client.porcentaje}%</td>
                    <td className="py-3 text-center">
                      <div
                        className="mx-auto h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
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
