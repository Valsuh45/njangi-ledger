import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? ""));
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <AppShell>
      <AppHeader title="Profile" />
      <div className="space-y-3 px-4 py-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Saving…" : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={signOut} className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}
