import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateGroup } from "@/features/groups/api";
import { toast } from "sonner";

export default function NewGroup() {
  const navigate = useNavigate();
  const create = useCreateGroup();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [cycleLength, setCycleLength] = useState("12");
  const [startMonth, setStartMonth] = useState(format(new Date(), "yyyy-MM"));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    const len = Number(cycleLength);
    if (!name.trim() || !amt || amt <= 0 || !len || len < 1) {
      toast.error("Please fill all required fields.");
      return;
    }
    try {
      const group = await create.mutateAsync({
        name: name.trim(),
        contribution_amount: amt,
        currency: currency.trim().toUpperCase() || "USD",
        cycle_length: len,
        start_month: `${startMonth}-01`,
        status: "draft",
      });
      toast.success("Group created");
      navigate(`/groups/${group.id}`, { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <AppShell>
      <AppHeader title="New group" back />
      <div className="px-4 py-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Family Njangi" required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="amount">Monthly contribution</Label>
                  <Input id="amount" inputMode="decimal" type="number" min="0" step="0.01"
                    value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" value={currency} maxLength={6}
                    onChange={(e) => setCurrency(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cycle">Cycle length (months)</Label>
                  <Input id="cycle" inputMode="numeric" type="number" min="1" max="60"
                    value={cycleLength} onChange={(e) => setCycleLength(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start">Start month</Label>
                  <Input id="start" type="month" value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)} required />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create group"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
