"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Ene", porFacturar: 0, porCobrar: 0, pagado: 218195 },
  { month: "Feb", porFacturar: 0, porCobrar: 36601, pagado: 295419 },
  { month: "Mar", porFacturar: 0, porCobrar: 0, pagado: 183982 },
  { month: "Abr", porFacturar: 0, porCobrar: 0, pagado: 132830 },
  { month: "May", porFacturar: 0, porCobrar: 0, pagado: 246685 },
  { month: "Jun", porFacturar: 0, porCobrar: 32476, pagado: 148111 },
  { month: "Jul", porFacturar: 0, porCobrar: 0, pagado: 217707 },
  { month: "Ago", porFacturar: 0, porCobrar: 40256, pagado: 543738 },
  { month: "Sep", porFacturar: 0, porCobrar: 29143, pagado: 149545 },
  { month: "Oct", porFacturar: 112937, porCobrar: 17695, pagado: 291482 },
  { month: "Nov", porFacturar: 398970, porCobrar: 0, pagado: 0 },
  { month: "Dic", porFacturar: 110076, porCobrar: 0, pagado: 0 },
]

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos 2025</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="pagado" fill="hsl(var(--chart-1))" name="Pagado" />
            <Bar dataKey="porCobrar" fill="hsl(var(--chart-2))" name="Por Cobrar" />
            <Bar dataKey="porFacturar" fill="hsl(var(--chart-3))" name="Por Facturar" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
