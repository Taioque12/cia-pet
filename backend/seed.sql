-- =============================================================
--  CIA PET — Dados de exemplo (opcional, para testes)
--  Rode DEPOIS do schema.sql. Cole no SQL Editor e clique em Run.
--  Pode rodar mais de uma vez? Não — geraria duplicados. Rode uma vez.
-- =============================================================

-- ---------- TUTORES ----------
insert into tutores (nome, cpf, telefone, email, endereco, contato_emergencia) values
  ('Carlos Almeida', '123.456.789-00', '(14) 98888-1111', 'carlos@email.com', 'Rua das Flores, 100 — Lençóis Paulista/SP', '(14) 97777-2222'),
  ('Mariana Souza',  '987.654.321-00', '(14) 96666-3333', 'mariana@email.com', 'Av. Brasil, 2500 — Lençóis Paulista/SP', '(14) 95555-4444');

-- ---------- PETS (vinculados aos tutores pelo nome) ----------
insert into pets (tutor_id, nome, especie, raca, nascimento, porte, alergias, condicoes)
select id, 'Thor', 'Canino', 'Dachshund', date '2021-03-10', 'Pequeno',
       'Alergia a frango. Sensibilidade a shampoos com fragrância forte.',
       'Nenhuma condição preexistente relevante.'
from tutores where nome = 'Carlos Almeida';

insert into pets (tutor_id, nome, especie, raca, nascimento, porte, alergias, condicoes)
select id, 'Mel', 'Felino', 'Siamês', date '2019-07-22', 'Pequeno',
       'Sem alergias conhecidas.',
       'Doença renal crônica em acompanhamento.'
from tutores where nome = 'Mariana Souza';

-- ---------- AGENDAMENTOS ----------
insert into agendamentos (tutor_nome, tutor_telefone, pet_nome, setor, data, turno, status) values
  ('Carlos Almeida', '(14) 98888-1111', 'Thor', 'Clínica Veterinária', current_date, 'Manhã (08h–12h)', 'Confirmado'),
  ('Mariana Souza',  '(14) 96666-3333', 'Mel',  'Banho e Tosa',        current_date, 'Tarde (13h30–18h)', 'Confirmado');

-- ---------- INSUMOS (estoque) ----------
insert into insumos (nome, categoria, unidade, quantidade, minimo, validade, observacao) values
  ('Amoxicilina 500mg', 'Medicação', 'comprimido', 8, 20, current_date + 120, 'Antibiótico de uso geral.'),
  ('Vacina V10 (déctupla)', 'Medicação', 'frasco', 15, 10, current_date + 20, 'Manter refrigerada (2–8°C).'),
  ('Luvas de procedimento (M)', 'Descartável/EPI', 'caixa', 3, 5, null, 'Caixa com 100 unidades.'),
  ('Seringa 5ml', 'Descartável/EPI', 'unidade', 120, 50, null, ''),
  ('Tesoura de tosa', 'Material/Ferramenta', 'unidade', 6, 2, null, 'Setor de estética.'),
  ('Shampoo hipoalergênico', 'Higiene', 'frasco', 4, 6, current_date + 300, 'Para pets com pele sensível.'),
  ('Gaze estéril', 'Descartável/EPI', 'pacote', 40, 15, current_date + 500, '');

-- ---------- FINANCEIRO (fluxo de caixa, por setor) ----------
insert into financeiro (setor, tipo, categoria, descricao, valor, data, forma, status) values
  ('Clínica Veterinária', 'Entrada', 'Consultas',    'Atendimentos clínicos do dia', 720, current_date,     'Dinheiro',      'Pago'),
  ('Banho e Tosa',        'Entrada', 'Banho e Tosa', 'Serviços de estética',          480, current_date,     'PIX',           'Pago'),
  ('Clínica Veterinária', 'Entrada', 'Vendas',       'Venda de ração e acessórios',   350, current_date - 1, 'Cartão',        'Pago'),
  ('Clínica Veterinária', 'Saída',   'Fornecedores', 'Compra de medicamentos',        680, current_date - 1, 'Boleto',        'Pago'),
  ('Banho e Tosa',        'Saída',   'Salários',     'Adiantamento do tosador',       900, current_date - 2, 'Transferência', 'Pago'),
  ('Banho e Tosa',        'Saída',   'Fornecedores', 'Produtos de banho e tosa',      260, current_date - 2, 'Cartão',        'Pago'),
  ('Clínica Veterinária', 'Saída',   'Aluguel',      'Aluguel do imóvel (rateio clínica)', 1500, current_date + 3, 'Boleto',   'Pendente');

-- ---------- NOTAS FISCAIS (por setor) ----------
insert into notas_fiscais (setor, numero, tipo, descricao, parte, valor, data_emissao, data_pagamento, boleto, status) values
  ('Clínica Veterinária', '000124', 'Entrada', 'Pacote de serviços — cliente PJ', 'Canil Estrela Ltda.', 2400, current_date - 5, current_date - 1, '', 'Pago'),
  ('Clínica Veterinária', '000125', 'Saída', 'Ração e insumos veterinários', 'PetSupply Distribuidora', 1250, current_date - 3, current_date + 7, '34191.79001 01043.510047 91020.150008 9 91230000125000', 'Pendente'),
  ('Banho e Tosa', '000126', 'Saída', 'Conta de energia elétrica (rateio estética)', 'Companhia Elétrica', 540, current_date - 10, current_date - 2, '83660000000 5 40880013100 2 01234567890 1 12340000054000', 'Pendente');
