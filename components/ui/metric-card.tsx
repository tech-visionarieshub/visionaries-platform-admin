import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: LucideIcon
  iconColor?: string
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  iconColor = "text-primary",
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            {trend && (
              <p className={cn("mt-2 text-sm font-medium", trend.isPositive ? "text-[#95C900]" : "text-[#E02814]")}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn("rounded-lg bg-muted p-3", iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
