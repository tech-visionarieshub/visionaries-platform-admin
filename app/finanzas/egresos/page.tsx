import { EgresosTable } from "@/components/finanzas/egresos-table"

export default function EgresosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Egresos</h2>
        <p className="text-muted-foreground">Control de gastos y egresos de la empresa</p>
      </div>

      <EgresosTable />
    </div>
  )
}
