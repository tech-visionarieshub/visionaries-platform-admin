import { PreciosPorHoraTable } from "@/components/finanzas/precios-por-hora-table"
import { FinanzasGuard } from "@/components/auth/finanzas-guard"

export default function PreciosPorHoraPage() {
  return (
    <FinanzasGuard>
      <div className="space-y-6">
        <PreciosPorHoraTable />
      </div>
    </FinanzasGuard>
  )
}

