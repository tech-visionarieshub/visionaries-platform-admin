"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Clock, Target } from "lucide-react"

const metrics = [
  {
    title: "Por Facturar",
    value: "$621,983.63",
    icon: Clock,
    trend: "up",
    trendValue: "+12.5%",
  },
  {
    title: "Por Cobrar",
    value: "$156,172.67",
    icon: Target,
    trend: "down",
    trendValue: "-8.2%",
  },
  {
    title: "Pagado",
    value: "$2,427,699.48",
    icon: DollarSign,
    trend: "up",
    trendValue: "+24.3%",
  },
  {
    title: "Promedio Mensual",
    value: "$267,154.65",
    icon: TrendingUp,
    trend: "up",
    trendValue: "+5.7%",
  },
]

export function DashboardMetrics() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <TrendIcon className={`h-3 w-3 ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`} />
                <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>{metric.trendValue}</span>
                <span>vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
