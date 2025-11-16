"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const monthlyData = [
  { month: "Enero 2025", porFacturar: 0, porCobrar: 0, pagado: 218195.6, total: 218195.6, acumulado: 0 },
  {
    month: "Febrero 2025",
    porFacturar: 0,
    porCobrar: 36601.13,
    pagado: 295419.63,
    total: 332020.76,
    acumulado: 36601.13,
  },
  { month: "Marzo 2025", porFacturar: 0, porCobrar: 0, pagado: 183982.79, total: 183982.79, acumulado: 36601.13 },
  { month: "Abril 2025", porFacturar: 0, porCobrar: 0, pagado: 132830.81, total: 132830.81, acumulado: 36601.13 },
  { month: "Mayo 2025", porFacturar: 0, porCobrar: 0, pagado: 246685.09, total: 246685.09, acumulado: 36601.13 },
  {
    month: "Junio 2025",
    porFacturar: 0,
    porCobrar: 32476.08,
    pagado: 148111.74,
    total: 180587.82,
    acumulado: 69077.21,
  },
  { month: "Julio 2025", porFacturar: 0, porCobrar: 0, pagado: 217707.66, total: 217707.66, acumulado: 69077.21 },
  {
    month: "Agosto 2025",
    porFacturar: 0,
    porCobrar: 40256.81,
    pagado: 543738.13,
    total: 583994.93,
    acumulado: 109334.02,
  },
  {
    month: "Septiembre 2025",
    porFacturar: 0,
    porCobrar: 29143.35,
    pagado: 149545.14,
    total: 178688.49,
    acumulado: 138477.37,
  },
  {
    month: "Octubre 2025",
    porFacturar: 112937.37,
    porCobrar: 17695.3,
    pagado: 291482.89,
    total: 422115.56,
    acumulado: 269110.04,
  },
  { month: "Noviembre 2025", porFacturar: 398970.05, porCobrar: 0, pagado: 0, total: 398970.05, acumulado: 668080.09 },
  { month: "Diciembre 2025", porFacturar: 110076.22, porCobrar: 0, pagado: 0, total: 110076.22, acumulado: 778156.3 },
]

export function MonthlyTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalle Mensual 2025</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead className="text-right">Por Facturar</TableHead>
              <TableHead className="text-right">Por Cobrar</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acumulado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">{row.month}</TableCell>
                <TableCell className="text-right">
                  {row.porFacturar > 0 ? (
                    <Badge variant="outline" className="text-yellow-600">
                      ${row.porFacturar.toLocaleString()}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">$0.00</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {row.porCobrar > 0 ? (
                    <Badge variant="outline" className="text-orange-600">
                      ${row.porCobrar.toLocaleString()}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">$0.00</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {row.pagado > 0 ? (
                    <Badge variant="outline" className="text-green-600">
                      ${row.pagado.toLocaleString()}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">$0.00</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">${row.total.toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold">${row.acumulado.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
