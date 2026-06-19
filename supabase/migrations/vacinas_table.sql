-- Tabela de controle de vacinas.
-- Segue o mesmo padrao desnormalizado da tabela agendamentos: guarda nome do
-- pet, do tutor e telefone direto, para que a equipe registre uma vacina sem
-- precisar cadastrar o pet antes.

create table if not exists public.vacinas (
  id              uuid primary key default gen_random_uuid(),
  pet_nome        text not null,
  tutor_nome      text not null,
  tutor_telefone  text,
  vacina          text not null,
  data_aplicacao  date not null,
  proxima_dose    date,
  observacao      text,
  criado_em       timestamptz not null default now()
);

alter table public.vacinas enable row level security;

-- Equipe logada tem acesso total (mesmo modelo das demais tabelas internas).
create policy "equipe_total_vacinas"
  on public.vacinas for all to authenticated
  using (true) with check (true);
