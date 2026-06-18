-- =============================================================
--  CIA PET — Esquema do banco de dados (Supabase / PostgreSQL)
--  Fase 1 do backend. Cole este script no SQL Editor do Supabase
--  e clique em "Run". Cria todas as tabelas, relacionamentos e
--  a segurança básica (RLS).
-- =============================================================

-- ---------- FUNCIONÁRIOS (equipe / perfil de acesso) ----------
-- A autenticação fica no Supabase Auth (auth.users). Esta tabela
-- guarda os dados de perfil de cada membro da equipe.
create table if not exists funcionarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text,
  crmv        text,
  papel       text not null default 'veterinario'
              check (papel in ('admin','veterinario','recepcao','financeiro')),
  criado_em   timestamptz not null default now()
);

-- ---------- TUTORES (clientes) ----------
create table if not exists tutores (
  id                  uuid primary key default gen_random_uuid(),
  nome                text not null,
  cpf                 text,
  telefone            text,
  email               text,
  endereco            text,
  contato_emergencia  text,
  criado_em           timestamptz not null default now()
);

-- ---------- PETS (pacientes) ----------
create table if not exists pets (
  id           uuid primary key default gen_random_uuid(),
  tutor_id     uuid not null references tutores(id) on delete cascade,
  nome         text not null,
  especie      text not null,
  raca         text,
  nascimento   date,
  porte        text check (porte in ('Pequeno','Médio','Grande','Gigante')),
  alergias     text,
  condicoes    text,
  criado_em    timestamptz not null default now()
);

-- ---------- PRONTUÁRIOS (histórico clínico) ----------
create table if not exists prontuarios (
  id              uuid primary key default gen_random_uuid(),
  pet_id          uuid not null references pets(id) on delete cascade,
  funcionario_id  uuid references funcionarios(id) on delete set null,
  anamnese        text not null,
  peso            numeric(6,2),
  vacinas         text,
  exames          text,
  prescricao      text,
  criado_em       timestamptz not null default now()
);

-- ---------- AGENDAMENTOS ----------
create table if not exists agendamentos (
  id              uuid primary key default gen_random_uuid(),
  tutor_nome      text not null,
  tutor_telefone  text not null,
  pet_nome        text not null,
  setor           text not null check (setor in ('Clínica Veterinária','Banho e Tosa')),
  data            date not null,
  turno           text not null,
  status          text not null default 'Pendente'
                  check (status in ('Pendente','Confirmado','Cancelado')),
  criado_em       timestamptz not null default now()
);

-- ---------- INSUMOS (estoque) ----------
create table if not exists insumos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  categoria   text not null,
  unidade     text not null,
  quantidade  integer not null default 0,
  minimo      integer not null default 0,
  validade    date,
  observacao  text,
  criado_em   timestamptz not null default now()
);

-- ---------- FINANCEIRO (fluxo de caixa) ----------
create table if not exists financeiro (
  id          uuid primary key default gen_random_uuid(),
  setor       text not null check (setor in ('Clínica Veterinária','Banho e Tosa')),
  tipo        text not null check (tipo in ('Entrada','Saída')),
  categoria   text,
  descricao   text not null,
  valor       numeric(12,2) not null,
  data        date not null,
  forma       text,
  status      text not null default 'Pago' check (status in ('Pago','Pendente')),
  criado_em   timestamptz not null default now()
);

-- ---------- NOTAS FISCAIS ----------
create table if not exists notas_fiscais (
  id              uuid primary key default gen_random_uuid(),
  setor           text not null check (setor in ('Clínica Veterinária','Banho e Tosa')),
  numero          text not null,
  tipo            text not null check (tipo in ('Entrada','Saída')),
  descricao       text not null,
  parte           text,
  valor           numeric(12,2) not null,
  data_emissao    date,
  data_pagamento  date,
  boleto          text,
  status          text not null default 'Pendente' check (status in ('Pago','Pendente')),
  criado_em       timestamptz not null default now()
);

-- =============================================================
--  SEGURANÇA (Row Level Security)
-- =============================================================
alter table funcionarios   enable row level security;
alter table tutores        enable row level security;
alter table pets           enable row level security;
alter table prontuarios    enable row level security;
alter table agendamentos   enable row level security;
alter table insumos        enable row level security;
alter table financeiro     enable row level security;
alter table notas_fiscais  enable row level security;

-- Equipe logada (authenticated) tem acesso total às tabelas internas.
do $$
declare t text;
begin
  foreach t in array array['funcionarios','tutores','pets','prontuarios',
                           'agendamentos','insumos','financeiro','notas_fiscais']
  loop
    execute format(
      'create policy "equipe_total_%1$s" on %1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- O formulário público do site pode CRIAR agendamentos (visitante anônimo),
-- mas não pode ler/editar nada do restante.
create policy "publico_cria_agendamento"
  on agendamentos for insert to anon with check (true);
