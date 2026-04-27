import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
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
import { ArrowLeft, Pencil, Trash2, Phone, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { MemberDialog } from "./app.membros";

export const Route = createFileRoute("/app/membros/$id")({
  component: MemberDetail,
});

function MemberDetail() {
  const { id } = Route.useParams();
  const { isSacerdote } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    const [{ data: m }, { data: att }] = await Promise.all([
      supabase.from("members").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("attendance")
        .select("*")
        .eq("member_id", id)
        .order("attended_on", { ascending: false })
        .limit(20),
    ]);
    setMember(m);
    setAttendance(att ?? []);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleDelete = async () => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removido");
      navigate({ to: "/app/membros" });
    }
  };

  if (!member) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="space-y-4">
      <Link to="/app/membros" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <Card className="overflow-hidden p-0 shadow-soft">
        <div className="bg-bessem-soft p-5">
          <h1 className="text-2xl font-bold">{member.civil_name}</h1>
          {member.orunko && (
            <p className="text-sm text-bessem font-semibold mt-1">{member.orunko}</p>
          )}
          {member.role_title && (
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {member.role_title}
            </p>
          )}
        </div>

        <div className="space-y-3 p-5">
          {isSacerdote && member.orixa_vodun && (
            <DetailRow label="Orixá / Vodun" value={member.orixa_vodun} />
          )}
          {member.phone && (
            <DetailRow
              label="Telefone"
              value={member.phone}
              icon={<Phone className="h-3.5 w-3.5" />}
            />
          )}
          {member.entry_date && (
            <DetailRow
              label="Entrada"
              value={format(new Date(member.entry_date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
              icon={<CalendarIcon className="h-3.5 w-3.5" />}
            />
          )}
        </div>

        {isSacerdote && (
          <div className="flex gap-2 border-t border-border/60 p-3">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                </Button>
              </DialogTrigger>
              <MemberDialog
                member={member}
                onClose={() => setEditOpen(false)}
                onSaved={() => {
                  setEditOpen(false);
                  load();
                }}
              />
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover este filho da casa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação também removerá todo o histórico de presença associado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico de presença
        </h2>
        {attendance.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground shadow-soft">
            Nenhum registro ainda.
          </Card>
        ) : (
          <div className="space-y-2">
            {attendance.map((a) => (
              <Card key={a.id} className="p-3 shadow-soft">
                <p className="text-sm font-semibold">
                  {format(new Date(a.attended_on), "dd 'de' MMM yyyy", { locale: ptBR })}
                </p>
                {a.tasks && <p className="mt-1 text-xs text-muted-foreground">Tarefa: {a.tasks}</p>}
                {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-right text-sm font-medium">
        {icon}
        {value}
      </span>
    </div>
  );
}
