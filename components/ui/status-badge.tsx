import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "success" | "warning" | "error" | "info" | "default"
}

const variantStyles = {
  success: "bg-[#95C900]/10 text-[#95C900] border-[#95C900]/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  error: "bg-[#E02814]/10 text-[#E02814] border-[#E02814]/20",
  info: "bg-[#4BBAFF]/10 text-[#4BBAFF] border-[#4BBAFF]/20",
  default: "bg-muted text-muted-foreground border-border",
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
      )}
    >
      {status}
    </span>
  )
}
