import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Users, CalendarDays, Megaphone, ClipboardCheck, LogOut, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const navItems: NavItem[] = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/membros", label: "Membros", icon: Users },
  { to: "/app/presenca", label: "Presença", icon: ClipboardCheck },
  { to: "/app/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/app/calendario", label: "Agenda", icon: CalendarDays },
  { to: "/app/avisos", label: "Avisos", icon: Megaphone },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-bessem shadow-soft" aria-hidden />
            <span className="text-base font-semibold tracking-tight">AxéGestão</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight">{profile?.display_name}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {role === "sacerdote" ? "Sacerdote" : "Filho da casa"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-2xl grid-cols-5">
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    active ? "bg-gradient-primary text-primary-foreground shadow-glow" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
