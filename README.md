# Cia Pet — Sistema da Clínica Veterinária

Sistema da **Cia Pet** (clínica veterinária, banho e tosa — Lençóis Paulista/SP):
site institucional, agendamento e painel interno (pacientes, prontuários,
estoque e financeiro).

## Estrutura do repositório

| Pasta / arquivo | O que é |
|-----------------|---------|
| `index.html`, `login.html`, `painel.html`, `css/`, `js/` | **Protótipo** original (HTML/CSS/JS puro) — referência visual e de fluxos |
| `cia-pet-app/` | **Aplicação de produção** — React + Ionic + Capacitor + Supabase (TypeScript) |
| `backend/` | Scripts SQL do banco de dados (Supabase): `schema.sql` e `seed.sql` |
| `PLANEJAMENTO-BACKEND.md` | Plano técnico, modelo de dados e roteiro das etapas |
| `LEIA-ME.txt` | Instruções de uso do protótipo |

## Tecnologias (produção)

- **Banco de dados / login:** Supabase (PostgreSQL)
- **Frontend / app:** React 18 + Ionic 8 + Capacitor + TypeScript (Vite)

## Como rodar a aplicação (`cia-pet-app`)

```bash
cd cia-pet-app
npm install
# copie .env.example para .env.local e preencha as chaves do Supabase
npm run dev
```

A aplicação abre em http://localhost:5173

## Banco de dados

Os scripts em `backend/` criam toda a estrutura no Supabase:
1. `schema.sql` — cria as tabelas e a segurança (RLS)
2. `seed.sql` — popula dados de exemplo (opcional)

## Status do projeto

- [x] Backend (Supabase) — 8 tabelas + autenticação
- [x] Painel: Dashboard, Agendamentos, Pacientes, Tutores
- [x] Painel: Estoque, Financeiro, Usuários
- [x] Site público + agendamento (com email + Google Agenda)
- [x] Empacotamento como app (Capacitor — projeto Android gerado)
