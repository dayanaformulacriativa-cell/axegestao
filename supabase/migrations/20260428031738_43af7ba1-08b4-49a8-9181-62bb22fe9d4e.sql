-- Categorias financeiras
CREATE TABLE public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY fc_select_authenticated ON public.finance_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY fc_insert_authenticated ON public.finance_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fc_update_authenticated ON public.finance_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY fc_delete_authenticated ON public.finance_categories FOR DELETE TO authenticated USING (true);

CREATE TRIGGER set_updated_at_finance_categories
BEFORE UPDATE ON public.finance_categories
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Transações financeiras
CREATE TABLE public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  reference_month TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_transactions_date ON public.finance_transactions(transaction_date DESC);
CREATE INDEX idx_finance_transactions_member ON public.finance_transactions(member_id);
CREATE INDEX idx_finance_transactions_category ON public.finance_transactions(category_id);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ft_select_authenticated ON public.finance_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY ft_insert_authenticated ON public.finance_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ft_update_authenticated ON public.finance_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY ft_delete_authenticated ON public.finance_transactions FOR DELETE TO authenticated USING (true);

CREATE TRIGGER set_updated_at_finance_transactions
BEFORE UPDATE ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Categorias padrão
INSERT INTO public.finance_categories (name, type, color) VALUES
  ('Mensalidade', 'income', '#10b981'),
  ('Doação', 'income', '#06b6d4'),
  ('Contribuição para Festividades', 'income', '#8b5cf6'),
  ('Pagamento de Feitura/Obrigação', 'income', '#f59e0b'),
  ('Despesa Fixa', 'expense', '#ef4444'),
  ('Gasto Extra', 'expense', '#f97316'),
  ('Despesa de Evento', 'expense', '#ec4899');