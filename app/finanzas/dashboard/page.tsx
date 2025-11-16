import { DashboardMetrics } from "@/components/finanzas/dashboard-metrics"
import { RevenueChart } from "@/components/finanzas/revenue-chart"
import { MonthlyTable } from "@/components/finanzas/monthly-table"

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <DashboardMetrics />
      <RevenueChart />
      <MonthlyTable />
    </div>
  )
}
