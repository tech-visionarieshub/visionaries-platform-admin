import { NominaTable } from "@/components/finanzas/nomina-table"

export default function NominaPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nómina</h1>
        <p className="text-sm text-muted-foreground">Gestiona los pagos mensuales del equipo</p>
      </div>
      <NominaTable />
    </div>
  )
}
