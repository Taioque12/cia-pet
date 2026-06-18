# Planejamento Técnico — Cia Pet (Site + App + Banco de Dados)

> Documento-guia para transformar o protótipo atual (HTML/CSS/JS) em um
> sistema real, com site e aplicativo usando o **mesmo banco de dados**.
> Última atualização: 17/06/2026.

---

## 1. Objetivo

Sair de um protótipo (dados salvos só no navegador) para um sistema de
produção onde:

- O **site** e o **app de celular** compartilham o **mesmo banco de dados** na nuvem.
- Os dados são seguros, com backup e acesso controlado por login.
- Tudo é construído sobre **um único código**, fácil de manter e evoluir.

---

## 2. Stack escolhido (tecnologias)

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Banco de dados + login | **Supabase** (PostgreSQL) | Guarda os dados, autenticação, backups, armazenamento de arquivos |
| Frontend (interface) | **React + Ionic** | A tela do site e do app, com componentes prontos com cara de app |
| Empacotamento do app | **Capacitor** | Transforma o mesmo código em app Android e iOS |
| Qualidade de código | **TypeScript** | Reduz bugs antes de chegarem em produção |
| Hospedagem do site | **Vercel** (ou Netlify) | Publica o site na internet |

**Resultado:** um único codebase gera o **site (web)**, o **app Android** e o
**app iOS**, todos lendo e gravando no mesmo banco.

---

## 3. Modelo de dados (tabelas do Supabase)

Estas tabelas vêm direto do protótipo que já validamos. Em PostgreSQL, cada
tabela tem um `id` único e datas de criação/atualização automáticas.

### 3.1 `funcionarios` (equipe / acesso ao painel)
> A autenticação em si fica no **Supabase Auth**; esta tabela guarda os dados do perfil.

| Campo | Tipo | Observação |
|-------|------|-----------|
| id | uuid | vínculo com o login (Supabase Auth) |
| nome | texto | ex.: Dr. Ighor Morales |
| email | texto | login |
| crmv | texto | registro profissional |
| papel | texto | veterinário, recepção, financeiro, admin |

### 3.2 `tutores` (clientes)
| Campo | Tipo |
|-------|------|
| id | uuid |
| nome | texto |
| cpf | texto |
| telefone | texto |
| email | texto |
| endereco | texto |
| contato_emergencia | texto |

### 3.3 `pets` (pacientes)
| Campo | Tipo | Observação |
|-------|------|-----------|
| id | uuid | |
| tutor_id | uuid | → liga a `tutores` |
| nome | texto | |
| especie | texto | Canino, Felino, etc. |
| raca | texto | |
| nascimento | data | idade calculada a partir daqui |
| porte | texto | Pequeno, Médio, Grande, Gigante |
| alergias | texto | obrigatório (vital p/ medicação e banho) |
| condicoes | texto | condições preexistentes |

### 3.4 `prontuarios` (histórico clínico)
| Campo | Tipo | Observação |
|-------|------|-----------|
| id | uuid | |
| pet_id | uuid | → liga a `pets` |
| funcionario_id | uuid | quem atendeu |
| anamnese | texto | |
| peso | número | |
| vacinas | texto | |
| exames | texto / arquivo | no futuro: upload de arquivos no Supabase Storage |
| prescricao | texto | |
| criado_em | data/hora | |

### 3.5 `agendamentos`
| Campo | Tipo | Observação |
|-------|------|-----------|
| id | uuid | |
| tutor_nome | texto | (do formulário público) |
| tutor_telefone | texto | |
| pet_nome | texto | |
| setor | texto | Clínica Veterinária / Banho e Tosa |
| data | data | |
| turno | texto | Manhã / Tarde |
| status | texto | Pendente, Confirmado, Cancelado |
| criado_em | data/hora | |

### 3.6 `insumos` (estoque)
| Campo | Tipo |
|-------|------|
| id | uuid |
| nome | texto |
| categoria | texto |
| unidade | texto |
| quantidade | número |
| minimo | número |
| validade | data |
| observacao | texto |

### 3.7 `financeiro` (fluxo de caixa)
| Campo | Tipo | Observação |
|-------|------|-----------|
| id | uuid | |
| setor | texto | Clínica Veterinária / Banho e Tosa |
| tipo | texto | Entrada / Saída |
| categoria | texto | |
| descricao | texto | |
| valor | número | |
| data | data | |
| forma | texto | Dinheiro, PIX, Cartão, Boleto, Transferência |
| status | texto | Pago / Pendente |

### 3.8 `notas_fiscais`
| Campo | Tipo | Observação |
|-------|------|-----------|
| id | uuid | |
| setor | texto | |
| numero | texto | |
| tipo | texto | Entrada (a receber) / Saída (a pagar) |
| descricao | texto | |
| parte | texto | cliente / fornecedor |
| valor | número | |
| data_emissao | data | |
| data_pagamento | data | |
| boleto | texto | linha digitável |
| status | texto | Pago / Pendente (Vencida é calculada) |

### 3.9 Tabelas futuras (quando precisar)
- `movimentacoes_estoque` — histórico de entradas/saídas de insumos (quem, quando).
- `importacoes` — registro de planilhas financeiras importadas (quem subiu, quando).

---

## 4. Roteiro de etapas (fases)

### Fase 0 — Preparação e decisões
- Definir endereço real, CNPJ real e dados de contato definitivos.
- Criar contas: Supabase, Vercel, (mais tarde) Google Play e Apple.
- Definir quem desenvolve (continuar comigo / contratar dev / equipe).

### Fase 1 — Backend (Supabase)
- Criar o projeto no Supabase.
- Criar as tabelas acima e os relacionamentos.
- Configurar **autenticação** (login da equipe).
- Configurar **regras de segurança (RLS)** — quem pode ver/editar o quê.
- Migrar os dados de exemplo para o banco real.

### Fase 2 — Frontend em React + Ionic
- Montar o projeto base (React + Ionic + Capacitor + TypeScript).
- Recriar as telas usando o protótipo como planta:
  1. Páginas públicas (institucional + agendamento).
  2. Login e painel.
  3. Pacientes, prontuários, estoque, financeiro.
- Conectar tudo à API do Supabase.

### Fase 3 — Funcionalidades que dependem do backend
- Agendamento real: ao enviar, **notifica a recepção** (e-mail/WhatsApp/alerta) e grava como "Pendente".
- Login seguro com criptografia de verdade.
- **Importação de planilhas** financeiras (com validação e conferência).
- Upload de exames nos prontuários.

### Fase 4 — App (PWA + Capacitor)
- Transformar o site em **PWA** (instalável).
- Empacotar com **Capacitor** para Android e iOS.
- Testar em celulares reais.

### Fase 5 — Publicação
- Publicar o site (domínio próprio + Vercel).
- Publicar os apps na **Google Play** e **App Store**.

### Fase 6 — Pós-lançamento
- Monitorar, ajustar, backups, suporte e novas funcionalidades.

---

## 5. Estimativa de esforço (referência)

> Estimativa de ordem de grandeza — varia conforme quem desenvolve e ajustes pedidos.

| Fase | Esforço aproximado |
|------|--------------------|
| 1 — Backend (Supabase) | 1 a 2 semanas |
| 2 — Frontend React/Ionic | 3 a 5 semanas |
| 3 — Funcionalidades de backend | 2 a 3 semanas |
| 4 — App (Capacitor) | 1 a 2 semanas |
| 5 — Publicação | alguns dias + tempo de aprovação das lojas |

---

## 6. Custos previstos (aproximados)

| Item | Custo |
|------|-------|
| Supabase | Grátis no início; ~US$ 25/mês no plano Pro quando crescer |
| Vercel (site) | Grátis para começar |
| Domínio (ex.: ciapet.com.br) | ~R$ 40/ano |
| Google Play (conta de dev) | US$ 25 (pagamento único) |
| Apple Developer (conta de dev) | US$ 99/ano |

> Só há custo de loja se você publicar o app nas stores. Como **PWA**, o app
> funciona sem essas taxas.

---

## 7. PRÓXIMOS PASSOS (o que fazer agora)

1. **Validar este documento** — confirmar se o escopo e o stack estão de acordo.
2. **Reunir os dados reais** da clínica: endereço, CNPJ, telefones, e-mail,
   horários e o CRMV real do Dr. Ighor.
3. **Decidir o modelo de desenvolvimento:** eu continuo construindo, você
   contrata um desenvolvedor, ou um misto.
4. **Definir prioridade do app:** começar por **PWA** (mais rápido e barato) e
   ir para as lojas depois? Ou já mirar Play Store/App Store desde o início?
5. **Criar a conta no Supabase** (posso te orientar passo a passo) — é o
   primeiro item técnico, a base de tudo.
6. **Listar quem terá acesso** ao painel e com qual papel (veterinário,
   recepção, financeiro, admin) — isso define as regras de segurança.

> Quando você decidir os itens 2, 3 e 4 acima, partimos para a **Fase 1
> (Backend)**, que é o alicerce do sistema.

---

## 7.1 Modelo de desenvolvimento — como vamos trabalhar

**Eu (Claude) desenvolvo** todo o código. Divisão de responsabilidades:

**O que EU faço:**
- Escrevo todo o código (backend, frontend React/Ionic, app Capacitor).
- Crio o script das tabelas do Supabase (SQL pronto para colar).
- Configuro a segurança, a conexão com o banco e empacoto o app.
- Te guio passo a passo no que for sua parte.

**O que SÓ VOCÊ pode fazer (preciso de você):**
- Criar as contas (Supabase, Vercel, lojas) — usam seu e-mail/pagamento.
- Instalar o ambiente na sua máquina (ex.: Node.js) — eu te passo o passo a passo.
- Fornecer os dados reais (endereço, CNPJ, CRMV, logo).
- Aprovar/publicar nas lojas de apps.
- Testar e dar o retorno final.

> Importante: hoje sua máquina **não tem ambiente de desenvolvimento**
> (sem Node.js). O primeiro passo prático será instalar o Node — rápido e gratuito.

---

## 8. Decisões pendentes (precisam da sua resposta)

- [ ] Endereço e CNPJ reais da clínica
- [ ] CRMV real do Dr. Ighor Morales
- [ ] Quantos funcionários terão acesso ao painel e quais funções
- [x] App: começar por PWA ou já publicar nas lojas? → **PWA primeiro** (decidido em 17/06/2026)
- [x] Quem desenvolve daqui pra frente → **Claude (eu) desenvolvo** (decidido em 17/06/2026)
- [ ] Precisa de app iOS no início, ou Android primeiro?
