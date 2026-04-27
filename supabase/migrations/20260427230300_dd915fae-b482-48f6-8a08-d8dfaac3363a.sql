
-- MEMBERS: liberar insert/update/delete para qualquer autenticado
DROP POLICY IF EXISTS members_insert_sacerdote ON public.members;
DROP POLICY IF EXISTS members_update_sacerdote ON public.members;
DROP POLICY IF EXISTS members_delete_sacerdote ON public.members;

CREATE POLICY members_insert_authenticated ON public.members
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY members_update_authenticated ON public.members
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY members_delete_authenticated ON public.members
  FOR DELETE TO authenticated USING (true);

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS ann_insert_sacerdote ON public.announcements;
DROP POLICY IF EXISTS ann_update_sacerdote ON public.announcements;
DROP POLICY IF EXISTS ann_delete_sacerdote ON public.announcements;

CREATE POLICY ann_insert_authenticated ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ann_update_authenticated ON public.announcements
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY ann_delete_authenticated ON public.announcements
  FOR DELETE TO authenticated USING (true);

-- EVENTS (Calendário)
DROP POLICY IF EXISTS events_insert_sacerdote ON public.events;
DROP POLICY IF EXISTS events_update_sacerdote ON public.events;
DROP POLICY IF EXISTS events_delete_sacerdote ON public.events;

CREATE POLICY events_insert_authenticated ON public.events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY events_update_authenticated ON public.events
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY events_delete_authenticated ON public.events
  FOR DELETE TO authenticated USING (true);
