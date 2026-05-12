import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { errorMessage } from "@/lib/error-message";

export const Route = createFileRoute("/app/presenca")({
  component: AttendancePage,
});

function AttendancePage() {
  const [members, setMembers] = useState<any[]>([]);
  const [memberId, setMemberId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tasks, setTasks] = useState("");
  const [notes, setNotes] = useState("");
  const [recent, setRecent] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const loadRecent = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*, members(civil_name, orunko)")
      .order("attended_on", { ascending: false })
      .limit(15);
    setRecent(data ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("members").select("id, civil_name, orunko").order("civil_name");
      setMembers(data ?? []);
    })();
    loadRecent();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      toast.error("Escolha um membro.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("attendance").insert({
      member_id: memberId,
      attended_on: date,
      tasks: tasks.trim() || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) toast.error(errorMessage(error));
    else {
      toast.success("Presença registrada");
      setTasks("");
      setNotes("");
      loadRecent();
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Registrar presença</h1>
        <p className="text-sm text-muted-foreground">Marque a presença de um filho da casa.</p>
      </header>

      <Card className="p-4 shadow-soft">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Membro</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher…" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.civil_name}
                    {m.orunko ? ` — ${m.orunko}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="att-date">Data</Label>
            <Input id="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tasks">Tarefa realizada</Label>
            <Input
              id="tasks"
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder="Ex.: cozinha, limpeza, toque"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="att-notes">Observações</Label>
            <Textarea
              id="att-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-primary shadow-glow"
          >
            <ClipboardCheck className="mr-1 h-4 w-4" />
            {saving ? "Salvando…" : "Registrar presença"}
          </Button>
        </form>
      </Card>

      <RecentList recent={recent} />
    </div>
  );
}

function RecentList({ recent }: { recent: any[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Recentes
      </h2>
      {recent.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground shadow-soft">
          Nenhum registro ainda.
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((a) => (
            <Card key={a.id} className="flex items-center gap-3 p-3 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bessem-soft text-primary">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {a.members?.civil_name ?? "Membro"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(a.attended_on), "dd 'de' MMM yyyy", { locale: ptBR })}
                  {a.tasks ? ` · ${a.tasks}` : ""}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
