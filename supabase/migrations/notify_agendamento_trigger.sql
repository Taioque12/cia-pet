-- Trigger que dispara o email de notificação ao criar um agendamento.
-- A função chama a Edge Function `notify-agendamento` via pg_net (net.http_post),
-- enviando a linha crua (row_to_json(NEW)). A Edge Function aceita esse formato.
--
-- Endurecimentos de segurança aplicados:
--   * SET search_path = ''  (evita sequestro de search_path)
--   * REVOKE EXECUTE de anon/authenticated/public (não deve ser chamável via RPC)

CREATE OR REPLACE FUNCTION public.notify_novo_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://arwgvuevnguhertnbbex.supabase.co/functions/v1/notify-agendamento',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := pg_catalog.row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_novo_agendamento() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trg_notify_agendamento ON public.agendamentos;
CREATE TRIGGER trg_notify_agendamento
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_novo_agendamento();
