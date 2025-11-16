import { LeadHeader } from "@/components/crm/lead-header"
import { LeadTabs } from "@/components/crm/lead-tabs"

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  // Mock data - reemplazar con datos reales
  const lead = {
    id: params.id,
    name: "Carlos Mendoza",
    company: "TechStart MX",
    email: "carlos@techstart.mx",
    phone: "+52 81 1234 5678",
    stage: "Discovery",
    priority: "high",
    budget: "$50,000 - $100,000",
    source: "Referido",
    assignedTo: "Ana García",
    createdAt: "2025-01-15",
    lastContact: "2025-01-20",
  }

  return (
    <div className="space-y-6">
      <LeadHeader lead={lead} />
      <LeadTabs leadId={params.id} />
    </div>
  )
}
