import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Megaphone,
  Users,
  ClipboardCheck,
  Plus,
  Sparkles,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Dashboard() {
  const { profile, isSacerdote } = useAuth();
  const [stats, setStats] = useState({ members: 0, attendanceWeek: 0 });
  const [nextEvents, setNextEvents] = useState<any[]>([]);
  const [recentAnn, setRecentAnn] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const [members, attendance, events, ann] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .gte("attended_on", since.toISOString().slice(0, 10)),
        supabase
          .from("events")
          .select("*")
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(3),
        supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      setStats({
        members: members.count ?? 0,
        attendanceWeek: attendance.count ?? 0,
      });
      setNextEvents(events.data ?? []);
      setRecentAnn(ann.data ?? []);
    })();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-bessem-soft p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {greeting()}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">
              Axé, <span className="text-bessem">{profile?.display_name ?? "filho(a) da casa"}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSacerdote
                ? "Aqui está um resumo da sua casa hoje."
                : "Aqui está o que está acontecendo na casa."}
            </p>
          </div>
          <Sparkles className="h-6 w-6 text-bessem-violet" aria-hidden />
        </div>
      </section>

      {/* Onboarding: primeiro membro */}
      {isSacerdote && stats.members === 0 && (
        <Card className="overflow-hidden border-bessem/30 bg-gradient-to-br from-bessem-soft to-card p-5 shadow-elevated">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Vamos começar pela sua casa</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cadastre o primeiro filho da casa com nome civil, Orunkó e cargo/função.
              </p>
              <Link to="/app/membros" search={{ novo: true }} className="mt-3 inline-block">
                <Button size="sm" className="bg-gradient-primary shadow-glow">
                  <Plus className="mr-1 h-4 w-4" /> Cadastrar primeiro membro
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Filhos da casa" value={stats.members} icon={Users} />
        <StatCard label="Presenças (7 dias)" value={stats.attendanceWeek} icon={ClipboardCheck} />
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction to="/app/presenca" icon={ClipboardCheck} label="Registrar presença" />
          <QuickAction to="/app/financeiro" icon={Wallet} label="Financeiro" />
          <QuickAction to="/app/permissoes" icon={ShieldCheck} label="Permissões" />
          {isSacerdote && (
            <QuickAction to="/app/calendario" icon={CalendarDays} label="Criar evento" />
          )}
          {isSacerdote && (
            <QuickAction to="/app/avisos" icon={Megaphone} label="Criar aviso" />
          )}
        </div>
      </section>

      {/* Próximos eventos */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Próximos eventos
          </h2>
          <Link
            to="/app/calendario"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver tudo
          </Link>
        </div>
        {nextEvents.length === 0 ? (
          <EmptyHint>Nenhum evento agendado.</EmptyHint>
        ) : (
          <div className="space-y-2">
            {nextEvents.map((ev) => (
              <Card key={ev.id} className="flex items-center gap-3 p-3 shadow-soft">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-gradient-warm text-warning-foreground">
                  <span className="text-[10px] font-semibold uppercase">
                    {format(new Date(ev.event_date), "MMM", { locale: ptBR })}
                  </span>
                  <span className="text-base font-bold leading-none">
                    {format(new Date(ev.event_date), "dd")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{ev.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {format(new Date(ev.event_date), "EEEE, HH:mm", { locale: ptBR })}
                    {ev.event_type ? ` · ${ev.event_type}` : ""}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Avisos recentes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Avisos recentes
          </h2>
          <Link to="/app/avisos" className="text-xs font-medium text-primary hover:underline">
            Ver tudo
          </Link>
        </div>
        {recentAnn.length === 0 ? (
          <EmptyHint>Nenhum aviso publicado ainda.</EmptyHint>
        ) : (
          <div className="space-y-2">
            {recentAnn.map((a) => (
              <Card key={a.id} className="p-4 shadow-soft">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <Card className="flex items-center gap-3 p-4 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Users;
  label: string;
}) {
  return (
    <Link to={to}>
      <Button
        variant="outline"
        className="flex h-auto w-full flex-col items-center gap-2 rounded-2xl border-border/60 bg-card py-4 shadow-soft hover:bg-accent border-solid"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bessem-soft">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <span className="text-[11px] font-medium leading-tight text-center">{label}</span>
      </Button>
    </Link>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex items-center justify-center p-6 text-sm text-muted-foreground shadow-soft">
      {children}
    </Card>
  );
}
