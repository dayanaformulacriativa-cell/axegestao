
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('sacerdote', 'filho_da_casa');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separado por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função has_role (security definer, evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função is_sacerdote (atalho)
CREATE OR REPLACE FUNCTION public.is_sacerdote(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'sacerdote')
$$;

-- Members (filhos da casa)
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  civil_name TEXT NOT NULL,
  orunko TEXT,
  orixa_vodun TEXT,
  role_title TEXT,
  phone TEXT,
  entry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  attended_on DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Trigger: cria profile + role no signup
-- Primeiro usuário vira sacerdote, demais viram filho_da_casa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'sacerdote';
  ELSE
    assigned_role := 'filho_da_casa';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== RLS POLICIES ==============

-- profiles: todos autenticados podem ler; cada um edita o próprio; sacerdote edita todos
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_sacerdote" ON public.profiles FOR UPDATE TO authenticated USING (public.is_sacerdote(auth.uid()));

-- user_roles: cada um vê o próprio papel; sacerdote vê e gerencia todos
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "roles_select_sacerdote" ON public.user_roles FOR SELECT TO authenticated USING (public.is_sacerdote(auth.uid()));
CREATE POLICY "roles_manage_sacerdote" ON public.user_roles FOR ALL TO authenticated USING (public.is_sacerdote(auth.uid())) WITH CHECK (public.is_sacerdote(auth.uid()));

-- members: todos veem; só sacerdote escreve
CREATE POLICY "members_select_authenticated" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_insert_sacerdote" ON public.members FOR INSERT TO authenticated WITH CHECK (public.is_sacerdote(auth.uid()));
CREATE POLICY "members_update_sacerdote" ON public.members FOR UPDATE TO authenticated USING (public.is_sacerdote(auth.uid()));
CREATE POLICY "members_delete_sacerdote" ON public.members FOR DELETE TO authenticated USING (public.is_sacerdote(auth.uid()));

-- attendance: sacerdote vê tudo; demais veem só do próprio member.user_id
CREATE POLICY "attendance_select_sacerdote" ON public.attendance FOR SELECT TO authenticated USING (public.is_sacerdote(auth.uid()));
CREATE POLICY "attendance_select_own" ON public.attendance FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.id = attendance.member_id AND m.user_id = auth.uid())
);
CREATE POLICY "attendance_insert_sacerdote" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.is_sacerdote(auth.uid()));
CREATE POLICY "attendance_update_sacerdote" ON public.attendance FOR UPDATE TO authenticated USING (public.is_sacerdote(auth.uid()));
CREATE POLICY "attendance_delete_sacerdote" ON public.attendance FOR DELETE TO authenticated USING (public.is_sacerdote(auth.uid()));

-- events: todos veem; só sacerdote escreve
CREATE POLICY "events_select_authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert_sacerdote" ON public.events FOR INSERT TO authenticated WITH CHECK (public.is_sacerdote(auth.uid()));
CREATE POLICY "events_update_sacerdote" ON public.events FOR UPDATE TO authenticated USING (public.is_sacerdote(auth.uid()));
CREATE POLICY "events_delete_sacerdote" ON public.events FOR DELETE TO authenticated USING (public.is_sacerdote(auth.uid()));

-- announcements: todos veem; só sacerdote escreve
CREATE POLICY "ann_select_authenticated" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ann_insert_sacerdote" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.is_sacerdote(auth.uid()));
CREATE POLICY "ann_update_sacerdote" ON public.announcements FOR UPDATE TO authenticated USING (public.is_sacerdote(auth.uid()));
CREATE POLICY "ann_delete_sacerdote" ON public.announcements FOR DELETE TO authenticated USING (public.is_sacerdote(auth.uid()));
