import { ComplementosTable } from "@/components/finanzas/complementos-table"

export default function ComplementosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Complementos de Pago</h2>
        <p className="text-muted-foreground">Gestiona los complementos de pago de facturas con método PPD</p>
      </div>

      <ComplementosTable />
    </div>
  )
}
