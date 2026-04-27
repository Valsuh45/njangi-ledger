import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface StatusPillProps {
  paid: boolean;
  className?: string;
  paidLabel?: string;
  unpaidLabel?: string;
}

export function StatusPill({ paid, className, paidLabel = "Paid", unpaidLabel = "Unpaid" }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        paid
          ? "bg-success/15 text-success"
          : "bg-destructive/15 text-destructive",
        className
      )}
    >
      {paid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {paid ? paidLabel : unpaidLabel}
    </span>
  );
}
