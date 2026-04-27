import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/app/calendario")({
  component: CalendarPage,
});

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  event_date: string;
}

function CalendarPage() {
  const { isSacerdote } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date());

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    setEvents((data as Event[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const upcoming = events.filter((e) => new Date(e.event_date) >= new Date());

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground">Eventos da casa</p>
        </div>
        {isSacerdote && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-gradient-primary shadow-glow">
                <Plus className="mr-1 h-4 w-4" /> Novo
              </Button>
            </DialogTrigger>
            <EventDialog
              onClose={() => setOpen(false)}
              onSaved={() => {
                setOpen(false);
                load();
              }}
            />
          </Dialog>
        )}
      </header>

      <MiniCalendar month={month} setMonth={setMonth} events={events} />

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Próximos
        </h2>
        {upcoming.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground shadow-soft">
            Nenhum evento agendado.
          </Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map((ev) => (
              <EventCard key={ev.id} event={ev} canEdit={isSacerdote} onChanged={load} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MiniCalendar({
  month,
  setMonth,
  events,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  events: Event[];
}) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startDay = start.getDay(); // 0 = Sun
  const daysInMonth = end.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const hasEvent = (d: Date) =>
    events.some((e) => isSameDay(new Date(e.event_date), d));

  return (
    <Card className="p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          ‹
        </Button>
        <p className="text-sm font-semibold capitalize">
          {format(month, "MMMM yyyy", { locale: ptBR })}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          ›
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const today = d && isSameDay(d, new Date());
          const hasEv = d && hasEvent(d);
          return (
            <div
              key={i}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-xs ${
                d ? "" : "opacity-0"
              } ${today ? "bg-gradient-primary font-bold text-primary-foreground" : "hover:bg-accent"}`}
            >
              {d?.getDate()}
              {hasEv && !today && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-bessem-orange" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EventCard({
  event,
  canEdit,
  onChanged,
}: {
  event: Event;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const handleDelete = async () => {
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Evento removido");
      onChanged();
    }
  };

  return (
    <Card className="flex items-start gap-3 p-3 shadow-soft">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-warm text-warning-foreground">
        <span className="text-[10px] font-semibold uppercase">
          {format(new Date(event.event_date), "MMM", { locale: ptBR })}
        </span>
        <span className="text-base font-bold leading-none">
          {format(new Date(event.event_date), "dd")}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(event.event_date), "EEE, dd 'de' MMM · HH:mm", { locale: ptBR })}
          {event.event_type ? ` · ${event.event_type}` : ""}
        </p>
        {event.description && (
          <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
        )}
      </div>
      {canEdit && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover evento?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}

function EventDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "",
    date: new Date().toISOString().slice(0, 10),
    time: "19:00",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      toast.error("Informe o título.");
      return;
    }
    setSaving(true);
    const event_date = new Date(`${form.date}T${form.time}`).toISOString();
    const { error } = await supabase.from("events").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_type: form.event_type.trim() || null,
      event_date,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Evento criado");
      onSaved();
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Novo evento</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ev-title">Título *</Label>
          <Input
            id="ev-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ev-date">Data</Label>
            <Input
              id="ev-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-time">Horário</Label>
            <Input
              id="ev-time"
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-type">Tipo</Label>
          <Input
            id="ev-type"
            placeholder="Ex.: festa, obrigação, reunião"
            value={form.event_type}
            onChange={(e) => setForm({ ...form, event_type: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-desc">Descrição</Label>
          <Textarea
            id="ev-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} className="bg-gradient-primary">
            {saving ? "Salvando…" : "Criar evento"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
