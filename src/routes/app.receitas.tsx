import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, ChevronLeft, Search } from "lucide-react";

export const Route = createFileRoute("/app/receitas")({
  component: RecipesByOrixaPage,
});

interface Recipe {
  id: string;
  name: string;
  orixa_vodun: string | null;
  tradition: string | null;
  ingredients: string;
  instructions: string;
  notes: string | null;
}

function RecipesByOrixaPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orixaFilter, setOrixaFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("kitchen_recipes")
        .select("*")
        .order("orixa_vodun")
        .order("name");
      setRecipes((data ?? []) as Recipe[]);
      setLoading(false);
    })();
  }, []);

  const orixas = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.orixa_vodun && set.add(r.orixa_vodun));
    return Array.from(set).sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (orixaFilter !== "all") {
        if (orixaFilter === "__none" ? r.orixa_vodun : r.orixa_vodun !== orixaFilter) return false;
      }
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [recipes, search, orixaFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Recipe[]>();
    filtered.forEach((r) => {
      const key = r.orixa_vodun ?? "Sem Orixá / Vodun definido";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/app/cozinha">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Receitas por Orixá / Vodun</h1>
          <p className="text-xs text-muted-foreground">Comidas de santo agrupadas por divindade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_240px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar receita..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={orixaFilter} onValueChange={setOrixaFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Orixás / Voduns</SelectItem>
            <SelectItem value="__none">Sem Orixá / Vodun definido</SelectItem>
            {orixas.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : grouped.length === 0 ? (
        <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">
          Nenhuma receita encontrada.
        </Card>
      ) : (
        grouped.map(([orixa, list]) => (
          <section key={orixa} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Badge className="bg-bessem text-primary-foreground">{orixa}</Badge>
              <span className="text-[11px] text-muted-foreground">
                {list.length} {list.length === 1 ? "receita" : "receitas"}
              </span>
            </div>
            {list.map((r) => (
              <Card key={r.id} className="rounded-2xl border-border/60 p-4 shadow-soft">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{r.name}</h3>
                  {r.tradition && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {r.tradition}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-3">
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
                        Observações de fundamento
                      </p>
                      <p className="whitespace-pre-wrap text-xs">{r.notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
