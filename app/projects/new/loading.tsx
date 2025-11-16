import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function NewProjectLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    </div>
  )
}
