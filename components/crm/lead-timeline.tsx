"use client"

import { Card } from "@/components/ui/card"
import { Phone, Mail, Calendar, User, MessageSquare } from "lucide-react"

const timelineEvents = [
  {
    id: 1,
    type: "call",
    title: "Llamada telefónica",
    description: "Llamada de seguimiento para discutir requerimientos del proyecto",
    user: "Ana García",
    date: "2025-01-20 14:30",
    icon: Phone,
  },
  {
    id: 2,
    type: "email",
    title: "Email enviado",
    description: "Enviada propuesta comercial con cotización detallada",
    user: "Ana García",
    date: "2025-01-18 10:15",
    icon: Mail,
  },
  {
    id: 3,
    type: "meeting",
    title: "Reunión de Discovery",
    description: "Reunión virtual para entender necesidades y objetivos del cliente",
    user: "Ana García",
    date: "2025-01-17 16:00",
    icon: Calendar,
  },
  {
    id: 4,
    type: "note",
    title: "Nota agregada",
    description: "Cliente interesado en desarrollo de app móvil con backend personalizado",
    user: "Ana García",
    date: "2025-01-16 11:20",
    icon: MessageSquare,
  },
  {
    id: 5,
    type: "stage",
    title: "Cambio de etapa",
    description: "Lead movido de 'Contactado' a 'Discovery'",
    user: "Sistema",
    date: "2025-01-16 09:00",
    icon: User,
  },
]

export function LeadTimeline({ leadId }: { leadId: string }) {
  const typeColors = {
    call: "bg-blue-100 text-blue-700",
    email: "bg-purple-100 text-purple-700",
    meeting: "bg-green-100 text-green-700",
    note: "bg-yellow-100 text-yellow-700",
    stage: "bg-gray-100 text-gray-700",
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Historial de Actividad</h3>
      <div className="space-y-4">
        {timelineEvents.map((event, index) => {
          const Icon = event.icon
          return (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${typeColors[event.type as keyof typeof typeColors]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {index < timelineEvents.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-foreground">{event.title}</h4>
                  <span className="text-sm text-muted-foreground">{event.date}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                <p className="text-xs text-muted-foreground">Por {event.user}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
