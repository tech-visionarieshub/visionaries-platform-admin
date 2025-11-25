import { CalendarSync } from "@/components/projects/calendar-sync"
import { use } from "react"

export default function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  return <CalendarSync projectId={resolvedParams.id} />
}
