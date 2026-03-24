import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "danger";
  children?: React.ReactNode;
  className?: string;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
    secondary: "border-transparent bg-white/10 text-white hover:bg-white/20",
    destructive: "border-transparent bg-rose-500 text-white hover:bg-rose-600",
    outline: "text-white border-white/20",
    success: "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    warning: "border-transparent bg-amber-500/20 text-amber-400 border-amber-500/50",
    danger: "border-transparent bg-rose-500/20 text-rose-400 border-rose-500/50",
  }
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props} />
  )
}

export { Badge }
