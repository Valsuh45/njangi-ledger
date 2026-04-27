import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // Sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign up
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (user) return <Navigate to="/" replace />;

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: siEmail.trim(),
      password: siPassword,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/", { replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: suEmail.trim(),
      password: suPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: suName.trim() || undefined },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — you're signed in.");
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 pt-12">
        <header className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elevated">
            <span className="text-xl font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Njangi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your rotating savings group.</p>
        </header>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" type="email" required autoComplete="email"
                      value={siEmail} onChange={(e) => setSiEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-password">Password</Label>
                    <Input id="si-password" type="password" required autoComplete="current-password"
                      value={siPassword} onChange={(e) => setSiPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Display name</Label>
                    <Input id="su-name" type="text" autoComplete="name" value={suName}
                      onChange={(e) => setSuName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" required autoComplete="email"
                      value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" type="password" required autoComplete="new-password"
                      minLength={8} value={suPassword} onChange={(e) => setSuPassword(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
