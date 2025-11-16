import { Badge } from "@/components/ui/badge"
import type { UserRole } from "@/lib/permissions"

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  pm: "Project Manager",
  developer: "Developer",
  qa: "QA",
  client: "Cliente",
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  pm: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  developer: "bg-green-500/10 text-green-500 border-green-500/20",
  qa: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  client: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

interface RoleBadgeProps {
  role: UserRole
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge variant="outline" className={ROLE_COLORS[role]}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}
