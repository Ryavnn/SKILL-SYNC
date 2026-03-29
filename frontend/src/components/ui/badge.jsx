import * as React from "react"
import { cn } from "../../utils/cn"

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] shadow hover:opacity-80",
    secondary: "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80",
    destructive: "border-transparent bg-[var(--destructive)] text-[var(--primary-foreground)] shadow hover:opacity-80",
    outline: "text-[var(--foreground)] border border-[var(--border)]",
    success: "border-transparent bg-[var(--success)] text-white hover:opacity-80",
  }

  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2", variants[variant], className)} {...props} />
  )
}

export { Badge }
