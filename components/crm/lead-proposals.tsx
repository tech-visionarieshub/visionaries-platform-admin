"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Plus } from "lucide-react"

const proposals = [
  {
    id: 1,
    title: "Propuesta Desarrollo App Móvil",
    amount: "$85,000 MXN",
    status: "sent",
    sentDate: "2025-01-18",
    validUntil: "2025-02-18",
    version: "v1.0",
  },
  {
    id: 2,
    title: "Propuesta Inicial - Discovery",
    amount: "$95,000 MXN",
    status: "viewed",
    sentDate: "2025-01-15",
    validUntil: "2025-02-15",
    version: "v1.0",
  },
]

export function LeadProposals({ leadId }: { leadId: string }) {
  const statusConfig = {
    draft: { label: "Borrador", className: "bg-gray-100 text-gray-700" },
    sent: { label: "Enviada", className: "bg-blue-100 text-blue-700" },
    viewed: { label: "Vista", className: "bg-purple-100 text-purple-700" },
    accepted: { label: "Aceptada", className: "bg-green-100 text-green-700" },
    rejected: { label: "Rechazada", className: "bg-red-100 text-red-700" },
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Propuestas Comerciales</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva propuesta
        </Button>
      </div>
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">{proposal.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>Versión {proposal.version}</span>
                    <span>•</span>
                    <span>Enviada el {new Date(proposal.sentDate).toLocaleDateString("es-MX")}</span>
                  </div>
                </div>
              </div>
              <Badge className={statusConfig[proposal.status as keyof typeof statusConfig].className}>
                {statusConfig[proposal.status as keyof typeof statusConfig].label}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <div className="text-2xl font-bold text-foreground">{proposal.amount}</div>
                <div className="text-sm text-muted-foreground">
                  Válida hasta {new Date(proposal.validUntil).toLocaleDateString("es-MX")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
