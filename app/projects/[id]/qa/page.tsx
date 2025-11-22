"use client"

import { QASystem } from "@/components/projects/qa-system"
import { useParams } from "next/navigation"

export default function QAPage() {
  const params = useParams()
  const projectId = params.id as string
  
  return <QASystem projectId={projectId} />
}
