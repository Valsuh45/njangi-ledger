import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <main className={`mx-auto max-w-lg ${hideNav ? "" : "pb-24"}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
