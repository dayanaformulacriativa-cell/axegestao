-- Tabela de refeições/escalas diárias
CREATE TABLE public.kitchen_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL, -- cafe, almoco, lanche, jantar, ceia
  meal_time TIME,
  menu TEXT,
  coordinator_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajudantes de cada refeição com suas tarefas
CREATE TABLE public.kitchen_meal_helpers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.kitchen_meals(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  task TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Movimentação de dispensa (entrada/saída de alimentos)
CREATE TABLE public.kitchen_pantry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type TEXT NOT NULL, -- in, out
  item_name TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit TEXT, -- kg, g, l, ml, un, pct
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Receitas de comidas de santo
CREATE TABLE public.kitchen_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  orixa_vodun TEXT, -- a quem pertence a comida
  tradition TEXT DEFAULT 'Djeje Nagô Vodun Kpodagba',
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.kitchen_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_meal_helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_recipes ENABLE ROW LEVEL SECURITY;

-- Políticas: todos os autenticados podem CRUD
CREATE POLICY km_select ON public.kitchen_meals FOR SELECT TO authenticated USING (true);
CREATE POLICY km_insert ON public.kitchen_meals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY km_update ON public.kitchen_meals FOR UPDATE TO authenticated USING (true);
CREATE POLICY km_delete ON public.kitchen_meals FOR DELETE TO authenticated USING (true);

CREATE POLICY kmh_select ON public.kitchen_meal_helpers FOR SELECT TO authenticated USING (true);
CREATE POLICY kmh_insert ON public.kitchen_meal_helpers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY kmh_update ON public.kitchen_meal_helpers FOR UPDATE TO authenticated USING (true);
CREATE POLICY kmh_delete ON public.kitchen_meal_helpers FOR DELETE TO authenticated USING (true);

CREATE POLICY kp_select ON public.kitchen_pantry FOR SELECT TO authenticated USING (true);
CREATE POLICY kp_insert ON public.kitchen_pantry FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY kp_update ON public.kitchen_pantry FOR UPDATE TO authenticated USING (true);
CREATE POLICY kp_delete ON public.kitchen_pantry FOR DELETE TO authenticated USING (true);

CREATE POLICY kr_select ON public.kitchen_recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY kr_insert ON public.kitchen_recipes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY kr_update ON public.kitchen_recipes FOR UPDATE TO authenticated USING (true);
CREATE POLICY kr_delete ON public.kitchen_recipes FOR DELETE TO authenticated USING (true);

-- Triggers de updated_at
CREATE TRIGGER trg_km_updated BEFORE UPDATE ON public.kitchen_meals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_kp_updated BEFORE UPDATE ON public.kitchen_pantry FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_kr_updated BEFORE UPDATE ON public.kitchen_recipes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
