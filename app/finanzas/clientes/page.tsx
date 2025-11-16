import { ClientesTable } from "@/components/finanzas/clientes-table"

export default function ClientesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Clientes</h2>
        <p className="text-sm text-muted-foreground">Gestión de datos fiscales y de cobranza</p>
      </div>
      <ClientesTable />
    </div>
  )
}
