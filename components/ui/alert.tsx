import * as React from "react"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/shared/utils"

function Alert({
  className,
  variant = "destructive",
  ...props
}: React.ComponentProps<"div"> & { variant?: "destructive" | "default" }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm",
        variant === "destructive"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-foreground",
        className
      )}
      {...props}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="leading-relaxed">{props.children}</div>
    </div>
  )
}

export { Alert }
