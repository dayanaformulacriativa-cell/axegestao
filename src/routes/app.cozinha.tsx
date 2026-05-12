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
  ChefHat,
  Plus,
  Trash2,
  Clock,
  Users,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  UtensilsCrossed,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { errorMessage } from "@/lib/error-message";

export const Route = createFileRoute("/app/cozinha")({
  component: KitchenPage,
});

interface Member {
  id: string;
  civil_name: string;
  orunko: string | null;
}
interface Meal {
  id: string;
  meal_date: string;
  meal_type: string;
  meal_time: string | null;
  menu: string | null;
  coordinator_id: string | null;
  notes: string | null;
}
interface Helper {
  id: string;
  meal_id: string;
  member_id: string;
  task: string | null;
}
interface PantryItem {
  id: string;
  movement_type: "in" | "out";
  item_name: string;
  quantity: number;
  unit: string | null;
  movement_date: string;
  notes: string | null;
}
interface Recipe {
  id: string;
  name: string;
  orixa_vodun: string | null;
  tradition: string | null;
  ingredients: string;
  instructions: string;
  notes: string | null;
}

const MEAL_TYPES: Record<string, string> = {
  cafe: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  ceia: "Ceia",
};

const UNITS = ["kg", "g", "l", "ml", "un", "pct", "dz"];

function KitchenPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [m, me, h, p, r] = await Promise.all([
      supabase.from("members").select("id, civil_name, orunko").order("civil_name"),
      supabase.from("kitchen_meals").select("*").order("meal_date", { ascending: false }).order("meal_time"),
      supabase.from("kitchen_meal_helpers").select("*"),
      supabase.from("kitchen_pantry").select("*").order("movement_date", { ascending: false }),
      supabase.from("kitchen_recipes").select("*").order("name"),
    ]);
    setMembers((m.data ?? []) as Member[]);
    setMeals((me.data ?? []) as Meal[]);
    setHelpers((h.data ?? []) as Helper[]);
    setPantry((p.data ?? []) as PantryItem[]);
    setRecipes((r.data ?? []) as Recipe[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const memberName = (id: string | null) => {
    if (!id) return "—";
    const m = members.find((x) => x.id === id);
    if (!m) return "—";
    return m.orunko ? `${m.orunko} (${m.civil_name})` : m.civil_name;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <ChefHat className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cozinha</h1>
          <p className="text-xs text-muted-foreground">
            Refeições, dispensa e receitas de santo
          </p>
        </div>
      </div>

      <Tabs defaultValue="meals" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="meals">
            <UtensilsCrossed className="mr-1 h-3.5 w-3.5" /> Refeições
          </TabsTrigger>
          <TabsTrigger value="pantry">
            <Package className="mr-1 h-3.5 w-3.5" /> Dispensa
          </TabsTrigger>
          <TabsTrigger value="recipes">
            <BookOpen className="mr-1 h-3.5 w-3.5" /> Receitas
          </TabsTrigger>
        </TabsList>

        {/* ============ REFEIÇÕES ============ */}
        <TabsContent value="meals" className="space-y-3">
          <MealForm members={members} onSaved={loadAll} />
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : meals.length === 0 ? (
            <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Nenhuma refeição agendada ainda.
            </Card>
          ) : (
            meals.map((meal) => {
              const mealHelpers = helpers.filter((h) => h.meal_id === meal.id);
              return (
                <Card key={meal.id} className="rounded-2xl border-border/60 p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-bessem text-primary-foreground">
                          {MEAL_TYPES[meal.meal_type] ?? meal.meal_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(meal.meal_date + "T00:00"), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        {meal.meal_time && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {meal.meal_time.slice(0, 5)}
                          </span>
                        )}
                      </div>
                      {meal.menu && (
                        <p className="mt-2 text-sm font-medium">{meal.menu}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Coordenador:</span>{" "}
                        {memberName(meal.coordinator_id)}
                      </p>
                      {meal.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">{meal.notes}</p>
                      )}
                      {mealHelpers.length > 0 && (
                        <div className="mt-3 space-y-1 rounded-lg bg-muted/40 p-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <Users className="mr-1 inline h-3 w-3" /> Ajudantes
                          </p>
                          {mealHelpers.map((h) => (
                            <div key={h.id} className="flex items-center justify-between gap-2 text-xs">
                              <span>
                                <span className="font-medium">{memberName(h.member_id)}</span>
                                {h.task && <span className="text-muted-foreground"> — {h.task}</span>}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={async () => {
                                  await supabase.from("kitchen_meal_helpers").delete().eq("id", h.id);
                                  loadAll();
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <HelperForm mealId={meal.id} members={members} onSaved={loadAll} />
                    </div>
                    <DeleteBtn
                      onConfirm={async () => {
                        await supabase.from("kitchen_meals").delete().eq("id", meal.id);
                        toast.success("Refeição removida");
                        loadAll();
                      }}
                    />
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ============ DISPENSA ============ */}
        <TabsContent value="pantry" className="space-y-3">
          <PantryForm onSaved={loadAll} />
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : pantry.length === 0 ? (
            <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Nenhuma movimentação registrada.
            </Card>
          ) : (
            pantry.map((p) => (
              <Card key={p.id} className="rounded-2xl border-border/60 p-3 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {p.movement_type === "in" ? (
                      <ArrowDownCircle className="h-5 w-5 text-success" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.quantity} {p.unit ?? ""} •{" "}
                        {format(new Date(p.movement_date + "T00:00"), "dd/MM/yyyy")}
                      </p>
                      {p.notes && <p className="text-[11px] text-muted-foreground">{p.notes}</p>}
                    </div>
                  </div>
                  <DeleteBtn
                    onConfirm={async () => {
                      await supabase.from("kitchen_pantry").delete().eq("id", p.id);
                      toast.success("Removido");
                      loadAll();
                    }}
                  />
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ============ RECEITAS ============ */}
        <TabsContent value="recipes" className="space-y-3">
          <RecipeForm onSaved={loadAll} />
          <Card className="rounded-2xl border-bessem/30 bg-bessem/5 p-3 text-xs text-muted-foreground">
            Receitas tradicionais do <span className="font-semibold text-foreground">Candomblé Djeje Nagô Vodun Kpodagba</span>.
          </Card>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : recipes.length === 0 ? (
            <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Nenhuma receita cadastrada ainda.
            </Card>
          ) : (
            recipes.map((r) => (
              <Card key={r.id} className="rounded-2xl border-border/60 p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{r.name}</h3>
                      {r.orixa_vodun && (
                        <Badge variant="secondary" className="text-[10px]">
                          {r.orixa_vodun}
                        </Badge>
                      )}
                    </div>
                    {r.tradition && (
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {r.tradition}
                      </p>
                    )}
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Ingredientes
                        </p>
                        <p className="whitespace-pre-wrap text-xs">{r.ingredients}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Modo de preparo
                        </p>
                        <p className="whitespace-pre-wrap text-xs">{r.instructions}</p>
                      </div>
                      {r.notes && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Observações
                          </p>
                          <p className="whitespace-pre-wrap text-xs">{r.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <DeleteBtn
                    onConfirm={async () => {
                      await supabase.from("kitchen_recipes").delete().eq("id", r.id);
                      toast.success("Receita removida");
                      loadAll();
                    }}
                  />
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Reusable bits ---------------- */

function DeleteBtn({ onConfirm }: { onConfirm: () => void | Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover este registro?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Remover</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------- Forms ---------------- */

function MealForm({ members, onSaved }: { members: Member[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState("almoco");
  const [time, setTime] = useState("");
  const [menu, setMenu] = useState("");
  const [coordinator, setCoordinator] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("kitchen_meals").insert({
      meal_date: date,
      meal_type: type,
      meal_time: time || null,
      menu: menu || null,
      coordinator_id: coordinator || null,
      notes: notes || null,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Refeição agendada");
    setOpen(false);
    setMenu("");
    setNotes("");
    setTime("");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl">
          <Plus className="mr-1 h-4 w-4" /> Nova refeição
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar refeição</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MEAL_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cardápio</Label>
            <Textarea value={menu} onChange={(e) => setMenu(e.target.value)} placeholder="Ex.: arroz, feijão, frango..." rows={2} />
          </div>
          <div>
            <Label>Coordenador da cozinha</Label>
            <Select value={coordinator} onValueChange={setCoordinator}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar membro" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.orunko ? `${m.orunko} — ${m.civil_name}` : m.civil_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HelperForm({ mealId, members, onSaved }: { mealId: string; members: Member[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState("");
  const [task, setTask] = useState("");

  const submit = async () => {
    if (!member) {
      toast.error("Selecione um membro");
      return;
    }
    const { error } = await supabase.from("kitchen_meal_helpers").insert({
      meal_id: mealId,
      member_id: member,
      task: task || null,
    });
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Ajudante adicionado");
    setOpen(false);
    setMember("");
    setTask("");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2 h-7 rounded-lg text-xs">
          <Plus className="mr-1 h-3 w-3" /> Adicionar ajudante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar ajudante</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Membro</Label>
            <Select value={member} onValueChange={setMember}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.orunko ? `${m.orunko} — ${m.civil_name}` : m.civil_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tarefa</Label>
            <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Ex.: cortar legumes, lavar louça..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PantryForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"in" | "out">("in");
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!item.trim()) {
      toast.error("Informe o item");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("kitchen_pantry").insert({
      movement_type: type,
      item_name: item,
      quantity: Number(qty) || 0,
      unit,
      movement_date: date,
      notes: notes || null,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Movimentação registrada");
    setOpen(false);
    setItem("");
    setQty("1");
    setNotes("");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl">
          <Plus className="mr-1 h-4 w-4" /> Nova movimentação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dispensa de alimentos</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "in" ? "default" : "outline"}
              onClick={() => setType("in")}
            >
              <ArrowDownCircle className="mr-1 h-4 w-4" /> Entrada
            </Button>
            <Button
              type="button"
              variant={type === "out" ? "default" : "outline"}
              onClick={() => setType("out")}
            >
              <ArrowUpCircle className="mr-1 h-4 w-4" /> Saída
            </Button>
          </div>
          <div>
            <Label>Item</Label>
            <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Ex.: arroz, dendê, milho..." />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Quantidade</Label>
              <Input type="number" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecipeForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [orixa, setOrixa] = useState("");
  const [tradition, setTradition] = useState("Djeje Nagô Vodun Kpodagba");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !ingredients.trim() || !instructions.trim()) {
      toast.error("Preencha nome, ingredientes e modo de preparo");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("kitchen_recipes").insert({
      name,
      orixa_vodun: orixa || null,
      tradition: tradition || null,
      ingredients,
      instructions,
      notes: notes || null,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    toast.success("Receita salva");
    setOpen(false);
    setName("");
    setOrixa("");
    setIngredients("");
    setInstructions("");
    setNotes("");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl">
          <Plus className="mr-1 h-4 w-4" /> Nova receita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receita de comida de santo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome da comida</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Acarajé, Amalá, Acaçá..." />
          </div>
          <div>
            <Label>Orixá / Vodun</Label>
            <Input value={orixa} onChange={(e) => setOrixa(e.target.value)} placeholder="Ex.: Xangô, Oxum, Dan..." />
          </div>
          <div>
            <Label>Tradição</Label>
            <Input value={tradition} onChange={(e) => setTradition(e.target.value)} />
          </div>
          <div>
            <Label>Ingredientes</Label>
            <Textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={5}
              placeholder="Liste os ingredientes, um por linha..."
            />
          </div>
          <div>
            <Label>Modo de preparo</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              placeholder="Descreva o passo a passo..."
            />
          </div>
          <div>
            <Label>Observações / fundamentos</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar receita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
