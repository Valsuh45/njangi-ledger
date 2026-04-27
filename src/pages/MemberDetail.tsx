import { useParams } from "react-router-dom";
import { Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { StatusPill } from "@/components/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import { useMember } from "@/features/members/api";
import { useGroup } from "@/features/groups/api";
import { useContributions } from "@/features/contributions/api";
import { formatMoney, monthLabel } from "@/lib/cycle";

export default function MemberDetail() {
  const { groupId, memberId } = useParams<{ groupId: string; memberId: string }>();
  const { data: group } = useGroup(groupId);
  const { data: member } = useMember(memberId);
  const { data: contributions = [] } = useContributions(groupId);

  if (!group || !member) {
    return (
      <AppShell>
        <AppHeader title="Loading…" back />
      </AppShell>
    );
  }

  const memberContributions = contributions.filter((c) => c.member_id === member.id);
  const paidCount = memberContributions.filter((c) => c.paid).length;
  const totalPaid = memberContributions
    .filter((c) => c.paid)
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const months = Array.from({ length: group.cycle_length }, (_, i) => i + 1);

  return (
    <AppShell>
      <AppHeader title={member.name} subtitle={`Position ${member.payout_position}`} back />

      <div className="space-y-3 px-4 py-4">
        <Card className="shadow-card">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Payout status</div>
                <div className="flex items-center gap-1 font-semibold">
                  <Crown className="h-4 w-4 text-warning" />
                  {member.payout_received ? "Received" : "Pending"}
                </div>
              </div>
              <StatusPill
                paid={member.payout_received}
                paidLabel="Received"
                unpaidLabel="Pending"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Months paid</div>
                <div className="font-semibold">
                  {paidCount} / {group.cycle_length}
                </div>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Total contributed</div>
                <div className="font-semibold">{formatMoney(totalPaid, group.currency)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-2">
            <ul className="divide-y divide-border">
              {months.map((m) => {
                const c = memberContributions.find((x) => x.cycle_month === m);
                const paid = !!c?.paid;
                return (
                  <li key={m} className="flex items-center justify-between px-2 py-2.5">
                    <div>
                      <div className="text-sm font-medium">{monthLabel(group.start_month, m)}</div>
                      <div className="text-xs text-muted-foreground">Month {m}</div>
                    </div>
                    <StatusPill paid={paid} />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
