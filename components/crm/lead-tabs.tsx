"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadTimeline } from "./lead-timeline"
import { LeadDocuments } from "./lead-documents"
import { LeadProposals } from "./lead-proposals"
import { LeadNotes } from "./lead-notes"

export function LeadTabs({ leadId }: { leadId: string }) {
  return (
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList className="bg-white border border-border">
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="proposals">Propuestas</TabsTrigger>
        <TabsTrigger value="notes">Notas</TabsTrigger>
      </TabsList>
      <TabsContent value="timeline" className="mt-6">
        <LeadTimeline leadId={leadId} />
      </TabsContent>
      <TabsContent value="documents" className="mt-6">
        <LeadDocuments leadId={leadId} />
      </TabsContent>
      <TabsContent value="proposals" className="mt-6">
        <LeadProposals leadId={leadId} />
      </TabsContent>
      <TabsContent value="notes" className="mt-6">
        <LeadNotes leadId={leadId} />
      </TabsContent>
    </Tabs>
  )
}
