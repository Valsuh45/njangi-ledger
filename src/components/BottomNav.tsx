import { NavLink } from "react-router-dom";
import { Home, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
