import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, back, right }: AppHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
        {back && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="-ml-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
