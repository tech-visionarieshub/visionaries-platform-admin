"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Building2, Calendar, User, ArrowLeft, MoreVertical } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  stage: string
  priority: string
  budget: string
  source: string
  assignedTo: string
  createdAt: string
  lastContact: string
}

export function LeadHeader({ lead }: { lead: Lead }) {
  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
  }

  const stageColors = {
    "Lead ingresado": "bg-blue-100 text-blue-700",
    Contactado: "bg-purple-100 text-purple-700",
    Discovery: "bg-indigo-100 text-indigo-700",
    Propuesta: "bg-green-100 text-green-700",
    Negociación: "bg-orange-100 text-orange-700",
    Onboarding: "bg-cyan-100 text-cyan-700",
    "Cliente Activo": "bg-emerald-100 text-emerald-700",
  }

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/crm/kanban">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
              <Badge className={stageColors[lead.stage as keyof typeof stageColors] || "bg-gray-100 text-gray-700"}>
                {lead.stage}
              </Badge>
              <Badge variant="outline" className={priorityColors[lead.priority as keyof typeof priorityColors]}>
                Prioridad {lead.priority === "high" ? "Alta" : lead.priority === "medium" ? "Media" : "Baja"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{lead.company}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Responsable: {lead.assignedTo}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <Button>
            <Phone className="h-4 w-4 mr-2" />
            Llamar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar lead</DropdownMenuItem>
              <DropdownMenuItem>Cambiar etapa</DropdownMenuItem>
              <DropdownMenuItem>Asignar a otro</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Eliminar lead</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 pt-6 border-t border-border">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Email</div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
              {lead.email}
            </a>
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Teléfono</div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
              {lead.phone}
            </a>
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Presupuesto</div>
          <div className="text-sm font-medium">{lead.budget}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Origen</div>
          <div className="text-sm font-medium">{lead.source}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Fecha de creación</div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(lead.createdAt).toLocaleDateString("es-MX")}</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Último contacto</div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(lead.lastContact).toLocaleDateString("es-MX")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
