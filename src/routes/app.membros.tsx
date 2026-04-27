import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
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
import { Plus, Search, ChevronRight, User as UserIcon, Phone, Calendar, Sparkles, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/app/membros")({
  component: MembersPage,
  validateSearch: z.object({ novo: z.coerce.boolean().optional() }),
});

interface Member {
  id: string;
  civil_name: string;
  orunko: string | null;
  orixa_vodun: string | null;
  role_title: string | null;
  phone: string | null;
  entry_date: string | null;
}

function MembersPage() {
  const { novo } = Route.useSearch();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (novo) setOpen(true);
  }, [novo]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("civil_name");
    if (error) toast.error(error.message);
    else setMembers((data as Member[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.civil_name.toLowerCase().includes(q) ||
      (m.orunko ?? "").toLowerCase().includes(q) ||
      (m.role_title ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Filhos da casa</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? "pessoa" : "pessoas"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-gradient-primary shadow-glow">
              <Plus className="mr-1 h-4 w-4" /> Novo
            </Button>
          </DialogTrigger>
          <MemberDialog
            onClose={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              load();
            }}
          />
        </Dialog>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou orunkó"
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bessem-soft">
            <UserIcon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">
            {members.length === 0
              ? "Sua casa ainda está vazia"
              : "Nenhum resultado para essa busca."}
          </p>
          {members.length === 0 && (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Comece cadastrando o primeiro filho da casa, com Orunkó e cargo.
              </p>
              <Button
                onClick={() => setOpen(true)}
                className="mt-4 bg-gradient-primary shadow-glow"
              >
                <Plus className="mr-1 h-4 w-4" /> Cadastrar primeiro membro
              </Button>
            </>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <Link key={m.id} to="/app/membros/$id" params={{ id: m.id }}>
              <Card className="flex items-center gap-3 p-3 shadow-soft transition-all hover:shadow-elevated">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bessem-soft text-primary">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.civil_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[m.orunko, m.role_title].filter(Boolean).join(" · ") || "Sem orunkó"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function MemberDialog({
  member,
  onClose,
  onSaved,
}: {
  member?: Member;
  onClose: () => void;
  onSaved: () => void;
}) {
  
  const [form, setForm] = useState({
    civil_name: member?.civil_name ?? "",
    orunko: member?.orunko ?? "",
    orixa_vodun: member?.orixa_vodun ?? "",
    role_title: member?.role_title ?? "",
    phone: member?.phone ?? "",
    entry_date: member?.entry_date ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"edit" | "preview">("edit");

  const goPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.civil_name.trim().length < 2) {
      toast.error("Informe o nome civil.");
      return;
    }
    setStep("preview");
  };

  const confirm = async () => {
    setSaving(true);
    const payload = {
      civil_name: form.civil_name.trim(),
      orunko: form.orunko.trim() || null,
      orixa_vodun: form.orixa_vodun.trim() || null,
      role_title: form.role_title.trim() || null,
      phone: form.phone.trim() || null,
      entry_date: form.entry_date || null,
    };
    const { error } = member
      ? await supabase.from("members").update(payload).eq("id", member.id)
      : await supabase.from("members").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(member ? "Atualizado" : "Cadastrado");
      onSaved();
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {step === "preview"
            ? "Revisar perfil"
            : member
              ? "Editar"
              : "Novo filho da casa"}
        </DialogTitle>
      </DialogHeader>

      {step === "edit" ? (
        <form onSubmit={goPreview} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="civil_name">Nome civil *</Label>
            <Input
              id="civil_name"
              value={form.civil_name}
              onChange={(e) => setForm({ ...form, civil_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orunko">Orunkó</Label>
            <Input
              id="orunko"
              value={form.orunko}
              onChange={(e) => setForm({ ...form, orunko: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orixa_vodun">Orixá / Vodun</Label>
            <Input
              id="orixa_vodun"
              value={form.orixa_vodun}
              onChange={(e) => setForm({ ...form, orixa_vodun: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="role_title">Cargo / função</Label>
              <Input
                id="role_title"
                value={form.role_title}
                onChange={(e) => setForm({ ...form, role_title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="entry_date">Data de entrada</Label>
            <Input
              id="entry_date"
              type="date"
              value={form.entry_date}
              onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-primary">
              Revisar
            </Button>
          </DialogFooter>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Confira os dados antes de {member ? "salvar" : "cadastrar"}. Você pode voltar e ajustar se algo estiver errado.
          </p>

          <Card className="overflow-hidden border-bessem/30 shadow-soft">
            <div className="bg-bessem-soft p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{form.civil_name.trim()}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {form.orunko.trim() || "Sem Orunkó"}
                    {form.role_title.trim() ? ` · ${form.role_title.trim()}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              <PreviewRow
                icon={Sparkles}
                label="Orunkó"
                value={form.orunko.trim() || "—"}
                highlight
              />
              <PreviewRow
                icon={UserIcon}
                label="Cargo / função"
                value={form.role_title.trim() || "—"}
                highlight
              />
              <PreviewRow
                icon={Sparkles}
                label="Orixá / Vodun"
                value={form.orixa_vodun.trim() || "—"}
              />
              <PreviewRow
                icon={Phone}
                label="Telefone"
                value={form.phone.trim() || "—"}
              />
              <PreviewRow
                icon={Calendar}
                label="Data de entrada"
                value={
                  form.entry_date
                    ? format(new Date(form.entry_date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })
                    : "—"
                }
              />
            </div>
          </Card>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setStep("edit")}>
              <Pencil className="mr-1 h-4 w-4" /> Editar
            </Button>
            <Button
              type="button"
              onClick={confirm}
              disabled={saving}
              className="bg-gradient-primary shadow-glow"
            >
              {saving ? "Salvando…" : member ? "Confirmar alterações" : "Confirmar cadastro"}
            </Button>
          </DialogFooter>
        </div>
      )}
    </DialogContent>
  );
}

function PreviewRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          highlight ? "bg-bessem-soft text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`truncate text-sm ${highlight ? "font-semibold" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
