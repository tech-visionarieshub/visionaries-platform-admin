import { EgresosBasadosEnHorasTable } from "@/components/finanzas/egresos-basados-en-horas-table"
import { FinanzasGuard } from "@/components/auth/finanzas-guard"

export default function EgresosPage() {
  return (
    <FinanzasGuard>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Egresos Basados en Horas</h2>
          <p className="text-muted-foreground">Control de gastos y egresos basados en horas trabajadas</p>
        </div>

        <EgresosBasadosEnHorasTable />
      </div>
    </FinanzasGuard>
  )
}
