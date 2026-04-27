import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, Plus, Trash2, ChevronRight, Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGroup, useDeleteGroup } from "@/features/groups/api";
import {
  useMembers, useAddMember, useDeleteMember, useUpdateMember,
} from "@/features/members/api";
import { useContributions, useToggleContribution } from "@/features/contributions/api";
import { usePayouts, useReleasePayout } from "@/features/payouts/api";
import { currentCycleMonth, formatMoney, monthLabel } from "@/lib/cycle";
import { downloadCSV, toCSV } from "@/lib/csv";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: group, isLoading } = useGroup(id);
  const { data: members = [] } = useMembers(id);
  const { data: contributions = [] } = useContributions(id);
  const { data: payouts = [] } = usePayouts(id);

  const deleteGroup = useDeleteGroup();

  const cycleLen = group?.cycle_length ?? 0;
  const month = group ? currentCycleMonth(group.start_month, cycleLen) : 1;

  const nextRecipient = useMemo(
    () => members.find((m) => !m.payout_received) ?? null,
    [members]
  );

  const paidThisMonth = useMemo(
    () => contributions.filter((c) => c.cycle_month === month && c.paid).length,
    [contributions, month]
  );

  function handleExport() {
    if (!group) return;
    const header = ["Member", "Position", ...Array.from({ length: cycleLen }, (_, i) => `Month ${i + 1}`)];
    const rows: (string | number)[][] = [header];
    for (const m of members) {
      const row: (string | number)[] = [m.name, m.payout_position];
      for (let i = 1; i <= cycleLen; i++) {
        const c = contributions.find((x) => x.member_id === m.id && x.cycle_month === i);
        row.push(c?.paid ? "Paid" : "Unpaid");
      }
      rows.push(row);
    }
    downloadCSV(`${group.name.replace(/\s+/g, "_")}_contributions.csv`, toCSV(rows));
  }

  async function handleDeleteGroup() {
    if (!id) return;
    try {
      await deleteGroup.mutateAsync(id);
      toast.success("Group deleted");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <AppHeader title="Loading…" back />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell>
        <AppHeader title="Not found" back />
        <div className="px-4 py-8 text-center text-muted-foreground">This group doesn't exist.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader
        title={group.name}
        subtitle={`${formatMoney(Number(group.contribution_amount), group.currency)} · ${cycleLen} months`}
        back
        right={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Delete group">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this group?</AlertDialogTitle>
                <AlertDialogDescription>
                  All members, contributions, and payouts will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      <div className="space-y-3 px-4 py-4">
        {/* Overview card */}
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Month {month} of {cycleLen} ({monthLabel(group.start_month, month)})
                </span>
                <span className="font-medium">{Math.round((month / cycleLen) * 100)}%</span>
              </div>
              <ProgressBar value={month} max={cycleLen} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Paid this month</div>
                <div className="font-semibold">
                  {paidThisMonth} / {members.length}
                </div>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Next payout</div>
                <div className="flex items-center gap-1 font-semibold">
                  <Crown className="h-3.5 w-3.5 text-warning" />
                  <span className="truncate">{nextRecipient?.name ?? "—"}</span>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="members">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="contributions">Pay</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-3">
            <MembersTab groupId={group.id} cycleLen={cycleLen} />
          </TabsContent>

          <TabsContent value="contributions" className="mt-3">
            <ContributionsTab
              groupId={group.id}
              cycleLen={cycleLen}
              startMonth={group.start_month}
              defaultMonth={month}
              amount={Number(group.contribution_amount)}
            />
          </TabsContent>

          <TabsContent value="payouts" className="mt-3">
            <PayoutsTab
              groupId={group.id}
              cycleLen={cycleLen}
              startMonth={group.start_month}
              amount={Number(group.contribution_amount)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

/* ============================================================
   MEMBERS TAB
   ============================================================ */
function MembersTab({ groupId, cycleLen }: { groupId: string; cycleLen: number }) {
  const { data: members = [] } = useMembers(groupId);
  const add = useAddMember(groupId);
  const update = useUpdateMember(groupId);
  const del = useDeleteMember(groupId);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await add.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || undefined,
        payout_position: position ? Number(position) : undefined,
      });
      setName(""); setPhone(""); setPosition("");
      setOpen(false);
      toast.success("Member added");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add member
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
          </DialogHeader>
          <form onSubmit={onAdd} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="m-name">Name</Label>
              <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-phone">Phone (optional)</Label>
              <Input id="m-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-pos">Payout position (optional)</Label>
              <Input id="m-pos" type="number" min="1" max={cycleLen} value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder={`Auto: ${members.length + 1}`} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={add.isPending}>
                {add.isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {members.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id}>
              <Card className="shadow-card">
                <CardContent className="flex items-center gap-3 p-3">
                  <Input
                    type="number"
                    min="1"
                    max={cycleLen}
                    defaultValue={m.payout_position}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v && v !== m.payout_position) {
                        update.mutate(
                          { id: m.id, patch: { payout_position: v } },
                          { onError: (err) => toast.error((err as Error).message) }
                        );
                      }
                    }}
                    className="h-9 w-14 text-center"
                    aria-label="Payout position"
                  />
                  <Link to={`/groups/${groupId}/members/${m.id}`} className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.name}</div>
                    {m.phone && <div className="truncate text-xs text-muted-foreground">{m.phone}</div>}
                  </Link>
                  <StatusPill paid={m.payout_received} paidLabel="Paid out" unpaidLabel="Pending" />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Remove">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {m.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Their contribution and payout records will be removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => del.mutate(m.id, { onError: (e) => toast.error((e as Error).message) })}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
   CONTRIBUTIONS TAB
   ============================================================ */
function ContributionsTab({
  groupId, cycleLen, startMonth, defaultMonth, amount,
}: {
  groupId: string;
  cycleLen: number;
  startMonth: string;
  defaultMonth: number;
  amount: number;
}) {
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const { data: members = [] } = useMembers(groupId);
  const { data: contributions = [] } = useContributions(groupId);
  const toggle = useToggleContribution(groupId);

  function isPaid(memberId: string) {
    return !!contributions.find((c) => c.member_id === memberId && c.cycle_month === selectedMonth)?.paid;
  }

  async function markAllPaid() {
    for (const m of members) {
      if (!isPaid(m.id)) {
        await toggle.mutateAsync({
          memberId: m.id, cycleMonth: selectedMonth, paid: true, amount,
        });
      }
    }
    toast.success("All marked paid");
  }

  const months = Array.from({ length: cycleLen }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {months.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setSelectedMonth(m)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedMonth === m
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {monthLabel(startMonth, m)}
          </button>
        ))}
      </div>

      {members.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Add members first.</p>
      ) : (
        <>
          <Button variant="outline" size="sm" className="w-full" onClick={markAllPaid}>
            Mark all paid for {monthLabel(startMonth, selectedMonth)}
          </Button>
          <ul className="space-y-2">
            {members.map((m) => {
              const paid = isPaid(m.id);
              return (
                <li key={m.id}>
                  <Card className="shadow-card">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          paid ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {m.payout_position}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{formatMoney(amount)}</div>
                      </div>
                      <Switch
                        checked={paid}
                        onCheckedChange={(checked) =>
                          toggle.mutate(
                            { memberId: m.id, cycleMonth: selectedMonth, paid: checked, amount },
                            { onError: (err) => toast.error((err as Error).message) }
                          )
                        }
                        aria-label={paid ? "Mark unpaid" : "Mark paid"}
                      />
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/* ============================================================
   PAYOUTS TAB
   ============================================================ */
function PayoutsTab({
  groupId, cycleLen, startMonth, amount,
}: {
  groupId: string;
  cycleLen: number;
  startMonth: string;
  amount: number;
}) {
  const { data: members = [] } = useMembers(groupId);
  const { data: payouts = [] } = usePayouts(groupId);
  const release = useReleasePayout(groupId);

  // Build payout schedule: month i ↔ member at position i
  const schedule = Array.from({ length: cycleLen }, (_, i) => {
    const cycleMonth = i + 1;
    const member = members.find((m) => m.payout_position === cycleMonth);
    const payout = payouts.find((p) => p.cycle_month === cycleMonth);
    return { cycleMonth, member, payout };
  });

  const totalAmount = amount * members.length;

  return (
    <ul className="space-y-2">
      {schedule.map(({ cycleMonth, member, payout }) => {
        const released = !!payout?.released || !!member?.payout_received;
        return (
          <li key={cycleMonth}>
            <Card className="shadow-card">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {cycleMonth}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {member?.name ?? <span className="text-muted-foreground">— vacant —</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {monthLabel(startMonth, cycleMonth)} · {formatMoney(totalAmount)}
                  </div>
                </div>
                <StatusPill paid={released} paidLabel="Released" unpaidLabel="Pending" />
                {member && (
                  <Switch
                    checked={released}
                    onCheckedChange={(checked) =>
                      release.mutate(
                        {
                          memberId: member.id,
                          cycleMonth,
                          amount: totalAmount,
                          released: checked,
                        },
                        { onError: (err) => toast.error((err as Error).message) }
                      )
                    }
                    aria-label={released ? "Mark unreleased" : "Release payout"}
                  />
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
