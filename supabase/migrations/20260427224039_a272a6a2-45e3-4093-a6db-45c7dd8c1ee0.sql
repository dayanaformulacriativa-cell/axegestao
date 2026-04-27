-- Permitir que qualquer membro autenticado registre e edite presenças
DROP POLICY IF EXISTS attendance_insert_sacerdote ON public.attendance;
DROP POLICY IF EXISTS attendance_update_sacerdote ON public.attendance;

CREATE POLICY attendance_insert_authenticated
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY attendance_update_authenticated
ON public.attendance
FOR UPDATE
TO authenticated
USING (true);

-- Permitir que todos autenticados vejam todos os registros (para listagem em "Recentes")
DROP POLICY IF EXISTS attendance_select_own ON public.attendance;

CREATE POLICY attendance_select_authenticated
ON public.attendance
FOR SELECT
TO authenticated
USING (true);