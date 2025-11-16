import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"

const milestones = [
  { name: "Diseño UI/UX", date: "2025-01-30", status: "Completado" },
  { name: "Backend API", date: "2025-02-28", status: "Completado" },
  { name: "Frontend Core", date: "2025-03-31", status: "En progreso" },
  { name: "Integración Pagos", date: "2025-04-15", status: "Pendiente" },
  { name: "Testing & QA", date: "2025-04-25", status: "Pendiente" },
  { name: "Deployment", date: "2025-04-30", status: "Pendiente" },
]

export default function TimelinePage() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg text-[#0E0734] mb-6">Cronograma del Proyecto</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline items */}
        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <div key={index} className="relative flex items-start gap-6 pl-10">
              <div
                className={`absolute left-0 h-8 w-8 rounded-full border-4 border-white ${
                  milestone.status === "Completado"
                    ? "bg-[#95C900]"
                    : milestone.status === "En progreso"
                      ? "bg-[#4BBAFF]"
                      : "bg-gray-300"
                }`}
              />
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-[#0E0734]">{milestone.name}</h4>
                  <StatusBadge
                    variant={
                      milestone.status === "Completado"
                        ? "success"
                        : milestone.status === "En progreso"
                          ? "info"
                          : "default"
                    }
                  >
                    {milestone.status}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(milestone.date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
