import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    if (req.method === 'GET') {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
      if (error) throw error;
      return json(data.users.map((u) => ({
        id: u.id,
        email: u.email,
        nome: u.user_metadata?.nome ?? '',
        criado: u.created_at,
        ultimo_login: u.last_sign_in_at ?? null,
      })));
    }

    if (req.method === 'POST') {
      const { email, password, nome } = await req.json();
      if (!email || !password) return json({ error: 'Email e senha são obrigatórios.' }, 400);
      if (password.length < 6) return json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { nome },
      });
      if (error) throw error;
      return json({ id: data.user.id, email: data.user.email });
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      if (!id) return json({ error: 'ID obrigatório.' }, 400);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (req.method === 'PATCH') {
      const { id, password, nome } = await req.json();
      if (!id) return json({ error: 'ID obrigatório.' }, 400);
      const updates: Record<string, unknown> = {};
      if (nome !== undefined) updates.user_metadata = { nome };
      if (password) {
        if (password.length < 6) return json({ error: 'Senha deve ter pelo menos 6 caracteres.' }, 400);
        updates.password = password;
      }
      const { error } = await admin.auth.admin.updateUserById(id, updates);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: 'Método não permitido.' }, 405);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 400);
  }
});
