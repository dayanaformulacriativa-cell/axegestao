import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Wallet,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/app/financeiro")({
  component: FinancePage,
});

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
}
interface Member {
  id: string;
  civil_name: string;
  orunko: string | null;
}
interface Transaction {
  id: string;
  type: "income" | "expense";
  category_id: string | null;
  member_id: string | null;
  amount: number;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
  reference_month: string | null;
  is_recurring: boolean;
}

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("income");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const load = async () => {
    const [tx, cats, mem] = await Promise.all([
      supabase
        .from("finance_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .limit(200),
      supabase.from("finance_categories").select("*").order("name"),
      supabase.from("members").select("id, civil_name, orunko").order("civil_name"),
    ]);
    setTransactions((tx.data as Transaction[]) ?? []);
    setCategories((cats.data as Category[]) ?? []);
    setMembers((mem.data as Member[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const monthly = useMemo(() => {
    const now = new Date();
    const ym = format(now, "yyyy-MM");
    const inMonth = transactions.filter((t) => t.transaction_date.startsWith(ym));
    const income = inMonth
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = inMonth
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );
  const memMap = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  const openDialog = (type: "income" | "expense") => {
    setDialogType(type);
    setOpen(true);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Controle Financeiro</h1>
        <p className="text-sm text-muted-foreground">Entradas, saídas e contribuições da casa</p>
      </header>

      {/* Resumo do mês */}
      <section className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Entradas"
          value={monthly.income}
          icon={TrendingUp}
          tone="bg-success/15 text-success"
        />
        <SummaryCard
          label="Saídas"
          value={monthly.expense}
          icon={TrendingDown}
          tone="bg-destructive/15 text-destructive"
        />
        <SummaryCard
          label="Saldo"
          value={monthly.balance}
          icon={Scale}
          tone={
            monthly.balance >= 0 ? "bg-bessem-soft text-bessem" : "bg-destructive/15 text-destructive"
          }
        />
      </section>

      {/* Ações */}
      <section className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => openDialog("income")}
          className="h-auto rounded-2xl bg-gradient-to-br from-success to-success/80 py-4 shadow-glow"
        >
          <ArrowUpCircle className="mr-2 h-5 w-5" />
          Nova entrada
        </Button>
        <Button
          onClick={() => openDialog("expense")}
          variant="outline"
          className="h-auto rounded-2xl border-destructive/40 bg-destructive/10 py-4 text-destructive hover:bg-destructive/15"
        >
          <ArrowDownCircle className="mr-2 h-5 w-5" />
          Nova saída
        </Button>
      </section>

      {/* Lista com filtros */}
      <section>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="income">Entradas</TabsTrigger>
            <TabsTrigger value="expense">Saídas</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} className="mt-4">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center shadow-soft">
                <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma movimentação registrada ainda.
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {filtered.map((t) => {
                  const cat = t.category_id ? catMap[t.category_id] : null;
                  const mem = t.member_id ? memMap[t.member_id] : null;
                  const isIncome = t.type === "income";
                  return (
                    <Card key={t.id} className="overflow-hidden p-0 shadow-soft">
                      <div
                        className={`h-1 ${isIncome ? "bg-success" : "bg-destructive"}`}
                        aria-hidden
                      />
                      <div className="flex items-start gap-3 p-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isIncome
                              ? "bg-success/15 text-success"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpCircle className="h-5 w-5" />
                          ) : (
                            <ArrowDownCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {cat?.name ?? "Sem categoria"}
                              </p>
                              {t.description && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {t.description}
                                </p>
                              )}
                            </div>
                            <p
                              className={`shrink-0 text-sm font-bold ${
                                isIncome ? "text-success" : "text-destructive"
                              }`}
                            >
                              {isIncome ? "+" : "−"} {formatBRL(Number(t.amount))}
                            </p>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              {format(new Date(t.transaction_date + "T00:00:00"), "dd MMM yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                            {mem && (
                              <Badge variant="secondary" className="text-[10px]">
                                {mem.orunko ?? mem.civil_name}
                              </Badge>
                            )}
                            {t.reference_month && (
                              <Badge variant="outline" className="text-[10px]">
                                Ref. {t.reference_month}
                              </Badge>
                            )}
                            {t.payment_method && (
                              <Badge variant="outline" className="text-[10px]">
                                {t.payment_method}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover lançamento?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from("finance_transactions")
                                    .delete()
                                    .eq("id", t.id);
                                  if (error) toast.error(error.message);
                                  else {
                                    toast.success("Removido");
                                    load();
                                  }
                                }}
                                className="bg-destructive"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <NewTransactionDialog
          type={dialogType}
          categories={categories.filter((c) => c.type === dialogType)}
          members={members}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            load();
          }}
        />
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Wallet;
  tone: string;
}) {
  return (
    <Card className="p-3 shadow-soft">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold leading-tight">{formatBRL(value)}</p>
    </Card>
  );
}

function NewTransactionDialog({
  type,
  categories,
  members,
  onClose,
  onSaved,
}: {
  type: "income" | "expense";
  categories: Category[];
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("none");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState<string>("none");
  const [referenceMonth, setReferenceMonth] = useState(format(new Date(), "yyyy-MM"));
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (!categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("finance_transactions").insert({
      type,
      amount: value,
      category_id: categoryId,
      member_id: memberId === "none" ? null : memberId,
      description: description.trim() || null,
      transaction_date: transactionDate,
      payment_method: paymentMethod === "none" ? null : paymentMethod,
      reference_month: type === "income" ? referenceMonth || null : null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(type === "income" ? "Entrada registrada" : "Saída registrada");
      onSaved();
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{type === "income" ? "Nova entrada" : "Nova saída"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Filho da casa (opcional)</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.civil_name}
                  {m.orunko ? ` · ${m.orunko}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Pix">Pix</SelectItem>
                <SelectItem value="Cartão">Cartão</SelectItem>
                <SelectItem value="Transferência">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "income" && (
            <div className="space-y-1.5">
              <Label htmlFor="ref">Mês ref. (mensalidade)</Label>
              <Input
                id="ref"
                type="month"
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Descrição</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ex: Mensalidade de junho, conta de luz, oferenda…"
          />
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} className="bg-gradient-primary">
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
