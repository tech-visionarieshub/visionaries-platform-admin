import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"

const deliverables = [
  { name: "Documentación técnica", status: "En progreso", dueDate: "2025-04-20" },
  { name: "Manual de usuario", status: "Pendiente", dueDate: "2025-04-25" },
  { name: "Código fuente", status: "En progreso", dueDate: "2025-04-30" },
]

export default function DeliverablesPage() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg text-[#0E0734] mb-4">Entregables del Proyecto</h3>
      <div className="space-y-3">
        {deliverables.map((deliverable, index) => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{deliverable.name}</p>
              <p className="text-sm text-muted-foreground">
                Fecha límite:{" "}
                {new Date(deliverable.dueDate).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <StatusBadge
              variant={
                deliverable.status === "Completado"
                  ? "success"
                  : deliverable.status === "En progreso"
                    ? "warning"
                    : "default"
              }
            >
              {deliverable.status}
            </StatusBadge>
          </div>
        ))}
      </div>
    </Card>
  )
}
