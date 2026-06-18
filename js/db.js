/* =============================================================
   CIA ANIMAL — Camada de "Banco de Dados" (PROTÓTIPO)
   -------------------------------------------------------------
   Esta é uma SIMULAÇÃO de banco de dados usando o localStorage do
   navegador. Serve apenas para demonstração do fluxo. Em produção,
   tudo isto deve ser substituído por um back-end real (ex.: Node.js
   + SQLite/PostgreSQL) com autenticação e criptografia de verdade.
   ============================================================= */

const DB = (() => {
  const KEYS = {
    usuarios: 'cia_usuarios',
    tutores: 'cia_tutores',
    pets: 'cia_pets',
    agendamentos: 'cia_agendamentos',
    prontuarios: 'cia_prontuarios',
    insumos: 'cia_insumos',
    financeiro: 'cia_financeiro',
    notas: 'cia_notas',
    sessao: 'cia_sessao',
  };

  // ---- utilitários internos --------------------------------------------
  const read = (key) => JSON.parse(localStorage.getItem(key) || '[]');
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // "Hash" didático (NÃO é criptografia real — apenas ofusca a senha na
  // demonstração). Em produção use bcrypt/argon2 no servidor.
  const fakeHash = (texto) => {
    let h = 0;
    for (let i = 0; i < texto.length; i++) {
      h = (h << 5) - h + texto.charCodeAt(i);
      h |= 0;
    }
    return 'h' + Math.abs(h).toString(16);
  };

  // ---- seed (dados iniciais de demonstração) ---------------------------
  function seed() {
    if (!localStorage.getItem(KEYS.usuarios)) {
      write(KEYS.usuarios, [
        {
          id: uid(),
          nome: 'Dr. Ighor Morales',
          email: 'vet@ciapet.com.br',
          crmv: 'CRMV-SP 12345',
          senhaHash: fakeHash('123456'),
        },
      ]);
    }

    if (!localStorage.getItem(KEYS.tutores)) {
      const t1 = { id: uid(), nome: 'Carlos Almeida', cpf: '123.456.789-00', telefone: '(11) 98888-1111', email: 'carlos@email.com', endereco: 'Rua das Flores, 100 — São Paulo/SP', emergencia: '(11) 97777-2222' };
      const t2 = { id: uid(), nome: 'Mariana Souza', cpf: '987.654.321-00', telefone: '(11) 96666-3333', email: 'mariana@email.com', endereco: 'Av. Brasil, 2500 — São Paulo/SP', emergencia: '(11) 95555-4444' };
      write(KEYS.tutores, [t1, t2]);

      write(KEYS.pets, [
        { id: uid(), tutorId: t1.id, nome: 'Thor', especie: 'Canino', raca: 'Dachshund', nascimento: '2021-03-10', porte: 'Pequeno', alergias: 'Alergia a frango. Sensibilidade a shampoos com fragrância forte.', condicoes: 'Nenhuma condição preexistente relevante.' },
        { id: uid(), tutorId: t2.id, nome: 'Mel', especie: 'Felino', raca: 'Siamês', nascimento: '2019-07-22', porte: 'Pequeno', alergias: 'Sem alergias conhecidas.', condicoes: 'Doença renal crônica em acompanhamento.' },
      ]);
    }

    if (!localStorage.getItem(KEYS.agendamentos)) {
      const hoje = new Date().toISOString().slice(0, 10);
      write(KEYS.agendamentos, [
        { id: uid(), tutorNome: 'Carlos Almeida', tutorTelefone: '(11) 98888-1111', petNome: 'Thor', setor: 'Clínica Veterinária', data: hoje, turno: 'Manhã (08h–12h)', status: 'Confirmado', criadoEm: new Date().toISOString() },
        { id: uid(), tutorNome: 'Mariana Souza', tutorTelefone: '(11) 96666-3333', petNome: 'Mel', setor: 'Estética (Banho/Tosa)', data: hoje, turno: 'Tarde (13h–18h)', status: 'Confirmado', criadoEm: new Date().toISOString() },
      ]);
    }

    if (!localStorage.getItem(KEYS.prontuarios)) {
      write(KEYS.prontuarios, []);
    }

    if (!localStorage.getItem(KEYS.financeiro)) {
      const dia = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
      write(KEYS.financeiro, [
        { id: uid(), setor: 'Clínica Veterinária', tipo: 'Entrada', categoria: 'Consultas',    descricao: 'Atendimentos clínicos do dia', valor: 720, data: dia(0),  forma: 'Dinheiro',      status: 'Pago' },
        { id: uid(), setor: 'Banho e Tosa',        tipo: 'Entrada', categoria: 'Banho e Tosa', descricao: 'Serviços de estética',          valor: 480, data: dia(0),  forma: 'PIX',           status: 'Pago' },
        { id: uid(), setor: 'Clínica Veterinária', tipo: 'Entrada', categoria: 'Vendas',       descricao: 'Venda de ração e acessórios',   valor: 350, data: dia(-1), forma: 'Cartão',        status: 'Pago' },
        { id: uid(), setor: 'Clínica Veterinária', tipo: 'Saída',   categoria: 'Fornecedores', descricao: 'Compra de medicamentos',        valor: 680, data: dia(-1), forma: 'Boleto',        status: 'Pago' },
        { id: uid(), setor: 'Banho e Tosa',        tipo: 'Saída',   categoria: 'Salários',     descricao: 'Adiantamento do tosador',       valor: 900, data: dia(-2), forma: 'Transferência', status: 'Pago' },
        { id: uid(), setor: 'Banho e Tosa',        tipo: 'Saída',   categoria: 'Fornecedores', descricao: 'Produtos de banho e tosa',      valor: 260, data: dia(-2), forma: 'Cartão',        status: 'Pago' },
        { id: uid(), setor: 'Clínica Veterinária', tipo: 'Saída',   categoria: 'Aluguel',      descricao: 'Aluguel do imóvel (rateio clínica)', valor: 1500, data: dia(3), forma: 'Boleto',   status: 'Pendente' },
      ]);
    }

    if (!localStorage.getItem(KEYS.notas)) {
      const dia = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
      write(KEYS.notas, [
        { id: uid(), setor: 'Clínica Veterinária', numero: '000124', tipo: 'Entrada', descricao: 'Pacote de serviços — cliente PJ', parte: 'Canil Estrela Ltda.', valor: 2400, dataEmissao: dia(-5), dataPagamento: dia(-1), boleto: '', status: 'Pago' },
        { id: uid(), setor: 'Clínica Veterinária', numero: '000125', tipo: 'Saída', descricao: 'Ração e insumos veterinários', parte: 'PetSupply Distribuidora', valor: 1250, dataEmissao: dia(-3), dataPagamento: dia(7), boleto: '34191.79001 01043.510047 91020.150008 9 91230000125000', status: 'Pendente' },
        { id: uid(), setor: 'Banho e Tosa', numero: '000126', tipo: 'Saída', descricao: 'Conta de energia elétrica (rateio estética)', parte: 'Companhia Elétrica', valor: 540, dataEmissao: dia(-10), dataPagamento: dia(-2), boleto: '83660000000 5 40880013100 2 01234567890 1 12340000054000', status: 'Pendente' },
      ]);
    }

    // migração: atualiza o usuário demo (Cia Animal -> Cia Pet / Dr. Ighor Morales)
    const usuarios = read(KEYS.usuarios);
    let mudou = false;
    usuarios.forEach((u) => {
      if (u.email === 'vet@ciaanimal.com.br') { u.email = 'vet@ciapet.com.br'; mudou = true; }
      if (u.nome === 'Dra. Helena Martins') { u.nome = 'Dr. Ighor Morales'; mudou = true; }
    });
    if (mudou) write(KEYS.usuarios, usuarios);

    // atualiza a sessão ativa, se houver
    const ses = JSON.parse(localStorage.getItem(KEYS.sessao) || 'null');
    if (ses && ses.nome === 'Dra. Helena Martins') {
      ses.nome = 'Dr. Ighor Morales';
      ses.email = 'vet@ciapet.com.br';
      localStorage.setItem(KEYS.sessao, JSON.stringify(ses));
    }

    if (!localStorage.getItem(KEYS.insumos)) {
      const futuro = (dias) => new Date(Date.now() + dias * 864e5).toISOString().slice(0, 10);
      write(KEYS.insumos, [
        { id: uid(), nome: 'Amoxicilina 500mg', categoria: 'Medicação', unidade: 'comprimido', quantidade: 8, minimo: 20, validade: futuro(120), observacao: 'Antibiótico de uso geral.' },
        { id: uid(), nome: 'Vacina V10 (déctupla)', categoria: 'Medicação', unidade: 'frasco', quantidade: 15, minimo: 10, validade: futuro(20), observacao: 'Manter refrigerada (2–8°C).' },
        { id: uid(), nome: 'Luvas de procedimento (M)', categoria: 'Descartável/EPI', unidade: 'caixa', quantidade: 3, minimo: 5, validade: '', observacao: 'Caixa com 100 unidades.' },
        { id: uid(), nome: 'Seringa 5ml', categoria: 'Descartável/EPI', unidade: 'unidade', quantidade: 120, minimo: 50, validade: '', observacao: '' },
        { id: uid(), nome: 'Tesoura de tosa', categoria: 'Material/Ferramenta', unidade: 'unidade', quantidade: 6, minimo: 2, validade: '', observacao: 'Setor de estética.' },
        { id: uid(), nome: 'Shampoo hipoalergênico', categoria: 'Higiene', unidade: 'frasco', quantidade: 4, minimo: 6, validade: futuro(300), observacao: 'Para pets com pele sensível.' },
        { id: uid(), nome: 'Gaze estéril', categoria: 'Descartável/EPI', unidade: 'pacote', quantidade: 40, minimo: 15, validade: futuro(500), observacao: '' },
      ]);
    }
  }

  // ---- API pública ------------------------------------------------------
  return {
    KEYS,
    seed,
    fakeHash,
    uid,

    // genéricos
    getAll: (entidade) => read(KEYS[entidade]),
    saveAll: (entidade, lista) => write(KEYS[entidade], lista),
    add: (entidade, registro) => {
      const lista = read(KEYS[entidade]);
      const novo = { id: uid(), ...registro };
      lista.push(novo);
      write(KEYS[entidade], lista);
      return novo;
    },
    update: (entidade, id, dados) => {
      const lista = read(KEYS[entidade]).map((r) => (r.id === id ? { ...r, ...dados } : r));
      write(KEYS[entidade], lista);
    },
    remove: (entidade, id) => {
      write(KEYS[entidade], read(KEYS[entidade]).filter((r) => r.id !== id));
    },

    // autenticação (simulada)
    login: (email, senha) => {
      const u = read(KEYS.usuarios).find(
        (x) => (x.email === email || x.crmv === email) && x.senhaHash === fakeHash(senha)
      );
      if (u) {
        localStorage.setItem(KEYS.sessao, JSON.stringify({ id: u.id, nome: u.nome, crmv: u.crmv, email: u.email }));
        return u;
      }
      return null;
    },
    sessao: () => JSON.parse(localStorage.getItem(KEYS.sessao) || 'null'),
    logout: () => localStorage.removeItem(KEYS.sessao),

    // reset total (útil para demonstração)
    reset: () => {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
      seed();
    },
  };
})();

// inicializa os dados de demonstração assim que o script carrega
DB.seed();
