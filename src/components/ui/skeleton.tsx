import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-gradient-to-br from-muted to-muted/50", className)}
      {...props}
    />
  )
}

export { Skeleton }
