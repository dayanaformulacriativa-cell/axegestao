/**
 * Maps Supabase/Postgres errors to safe, user-facing Portuguese messages.
 * Avoids leaking schema details (table names, RLS policy names, constraints).
 */
export function errorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (import.meta.env.DEV && e) {
    // eslint-disable-next-line no-console
    console.error("[supabase-error]", e);
  }
  const code = e?.code;
  if (!code) return "Ocorreu um erro. Tente novamente.";
  if (code === "23505") return "Registro duplicado.";
  if (code === "23503") return "Referência inválida.";
  if (code === "23502") return "Preencha todos os campos obrigatórios.";
  if (code === "23514") return "Dados inválidos.";
  if (code === "22P02") return "Formato inválido.";
  if (code === "42501" || code === "PGRST301") return "Você não tem permissão para esta ação.";
  if (code.startsWith("42")) return "Erro de configuração.";
  if (code.startsWith("PGRST")) return "Não foi possível concluir a operação.";
  return "Ocorreu um erro. Tente novamente.";
}
