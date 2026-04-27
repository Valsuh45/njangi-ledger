import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGroups } from "@/features/groups/api";
import { currentCycleMonth, formatMoney } from "@/lib/cycle";

export default function Groups() {
  const { data: groups = [], isLoading } = useGroups();
  return (
    <AppShell>
      <AppHeader
        title="Groups"
        right={
          <Button asChild size="sm">
            <Link to="/groups/new">
              <Plus className="mr-1 h-4 w-4" />
              New
            </Link>
          </Button>
        }
      />
      <div className="space-y-3 px-4 py-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && groups.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No groups yet.</p>
        )}
        {groups.map((g) => {
          const month = currentCycleMonth(g.start_month, g.cycle_length);
          return (
            <Link key={g.id} to={`/groups/${g.id}`} className="block">
              <Card className="shadow-card transition-shadow hover:shadow-elevated">
                <CardContent className="space-y-2 p-4">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{g.name}</h3>
                    <span className="text-xs text-muted-foreground">{g.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(Number(g.contribution_amount), g.currency)} · {g.cycle_length} months
                  </p>
                  <ProgressBar value={month} max={g.cycle_length} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
