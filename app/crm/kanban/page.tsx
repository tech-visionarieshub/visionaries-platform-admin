import { PageHeader } from "@/components/ui/page-header"
import { KanbanBoard } from "@/components/crm/kanban-board"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter } from "lucide-react"

export default function CRMKanbanPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pipeline CRM" description="Gestiona el ciclo de vida completo de tus leads y clientes">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Lead
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      <KanbanBoard />
    </div>
  )
}
