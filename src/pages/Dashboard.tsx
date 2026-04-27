import { Link } from "react-router-dom";
import { Plus, ArrowRight, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGroups } from "@/features/groups/api";
import { currentCycleMonth, formatMoney } from "@/lib/cycle";

export default function Dashboard() {
  const { data: groups, isLoading } = useGroups();

  return (
    <AppShell>
      <AppHeader
        title="Your groups"
        subtitle="Rotating savings at a glance"
        right={
          <Button asChild size="sm" className="gap-1">
            <Link to="/groups/new">
              <Plus className="h-4 w-4" />
              New
            </Link>
          </Button>
        }
      />

      <div className="space-y-3 px-4 py-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!isLoading && (groups?.length ?? 0) === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">No groups yet</h3>
                <p className="text-sm text-muted-foreground">Create your first Njangi to get started.</p>
              </div>
              <Button asChild>
                <Link to="/groups/new">
                  <Plus className="mr-1 h-4 w-4" />
                  Create a group
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {groups?.map((g) => {
          const month = currentCycleMonth(g.start_month, g.cycle_length);
          return (
            <Link key={g.id} to={`/groups/${g.id}`} className="block animate-fade-in">
              <Card className="shadow-card transition-shadow hover:shadow-elevated">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{g.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(Number(g.contribution_amount), g.currency)} · {g.cycle_length} months
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Month {month} of {g.cycle_length}
                      </span>
                      <span className="font-medium text-foreground">
                        {Math.round((month / g.cycle_length) * 100)}%
                      </span>
                    </div>
                    <ProgressBar value={month} max={g.cycle_length} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
