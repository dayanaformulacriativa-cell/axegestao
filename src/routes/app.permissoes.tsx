import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  ChefHat,
  BookOpen,
  ShieldCheck,
  Check,
  X,
  ChevronLeft,
  Crown,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/app/permissoes")({
  component: PermissionsPage,
});

type Perm = {
  action: string;
  sacerdote: boolean;
  filho: boolean;
  note?: string;
};

const kitchenPerms: Perm[] = [
  { action: "Visualizar refeições agendadas", sacerdote: true, filho: true },
  { action: "Agendar nova refeição", sacerdote: true, filho: true },
  { action: "Definir coordenador da refeição", sacerdote: true, filho: true },
  { action: "Adicionar / remover ajudantes", sacerdote: true, filho: true },
  { action: "Excluir refeição", sacerdote: true, filho: true },
  { action: "Visualizar dispensa", sacerdote: true, filho: true },
  { action: "Registrar entrada / saída de alimentos", sacerdote: true, filho: true },
  { action: "Excluir movimentação da dispensa", sacerdote: true, filho: true },
];

const recipePerms: Perm[] = [
  { action: "Visualizar receitas", sacerdote: true, filho: true },
  { action: "Filtrar receitas por Orixá / Vodun", sacerdote: true, filho: true },
  { action: "Acessar página agrupada por Orixá", sacerdote: true, filho: true },
  {
    action: "Cadastrar nova receita",
    sacerdote: true,
    filho: false,
    note: "Apenas o sacerdote zela pelo fundamento das comidas de santo.",
  },
  {
    action: "Editar receita existente",
    sacerdote: true,
    filho: false,
    note: "Para preservar a tradição Djeje Nagô Vodun Kpodagba.",
  },
  {
    action: "Excluir receita",
    sacerdote: true,
    filho: false,
  },
];

function PermBadge({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15 text-destructive">
      <X className="h-3.5 w-3.5" />
    </span>
  );
}

function PermTable({ title, icon: Icon, perms }: { title: string; icon: typeof ChefHat; perms: Perm[] }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 shadow-soft">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Ação</span>
        <span className="flex items-center gap-1">
          <Crown className="h-3 w-3" /> Sacerdote
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> Filhos
        </span>
      </div>
      <ul className="divide-y divide-border/60">
        {perms.map((p) => (
          <li key={p.action} className="px-4 py-3">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4">
              <span className="text-sm">{p.action}</span>
              <PermBadge allowed={p.sacerdote} />
              <PermBadge allowed={p.filho} />
            </div>
            {p.note && (
              <p className="mt-1 text-[11px] italic text-muted-foreground">{p.note}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PermissionsPage() {
  const { isSacerdote, role } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/app">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Permissões</h1>
          <p className="text-xs text-muted-foreground">
            O que cada perfil pode fazer na Cozinha e nas Receitas
          </p>
        </div>
        {role && (
          <Badge variant="secondary" className="text-[10px]">
            {isSacerdote ? "Você é Sacerdote" : "Você é Filho da casa"}
          </Badge>
        )}
      </div>

      <Card className="rounded-2xl border-bessem/30 bg-bessem/5 p-3 text-xs text-muted-foreground">
        <p>
          O <span className="font-semibold text-foreground">sacerdote</span> tem acesso completo a todos
          os módulos. Os <span className="font-semibold text-foreground">filhos da casa</span> participam
          ativamente da rotina, com restrições apenas onde o fundamento exige cuidado especial.
        </p>
      </Card>

      <PermTable title="Cozinha" icon={ChefHat} perms={kitchenPerms} />
      <PermTable title="Receitas de comida de santo" icon={BookOpen} perms={recipePerms} />

      <Card className="rounded-2xl border-border/60 p-4 text-xs text-muted-foreground shadow-soft">
        <p className="font-semibold text-foreground">Resumo</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <span className="font-medium text-foreground">Cozinha:</span> sacerdote e filhos podem
            organizar refeições, coordenar equipes e movimentar a dispensa.
          </li>
          <li>
            <span className="font-medium text-foreground">Receitas:</span> todos visualizam e consultam,
            mas somente o sacerdote pode cadastrar, editar ou excluir.
          </li>
        </ul>
      </Card>
    </div>
  );
}
