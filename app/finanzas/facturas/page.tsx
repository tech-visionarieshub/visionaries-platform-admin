import { FacturasTable } from "@/components/finanzas/facturas-table"

export default function FacturasPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Facturas</h2>
        <p className="text-sm text-muted-foreground">Gestiona y da seguimiento a todas las facturas emitidas</p>
      </div>
      <FacturasTable />
    </div>
  )
}
