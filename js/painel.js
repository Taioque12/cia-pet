/* =============================================================
   CIA ANIMAL — Painel do Veterinário
   ============================================================= */

// ---- proteção de rota -------------------------------------------------
const sessao = DB.sessao();
if (!sessao) window.location.href = 'login.html';

// ---- utilitários ------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const hojeISO = () => new Date().toISOString().slice(0, 10);

function dataBR(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
function calcularIdade(nascimento) {
  if (!nascimento) return '—';
  const n = new Date(nascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - n.getFullYear();
  let meses = hoje.getMonth() - n.getMonth();
  if (meses < 0 || (meses === 0 && hoje.getDate() < n.getDate())) anos--, (meses += 12);
  if (anos <= 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}
function badge(status) {
  const classe = { Pendente: 'pendente', Confirmado: 'confirmado', Cancelado: 'cancelado' }[status] || 'pendente';
  return `<span class="badge badge--${classe}">${status}</span>`;
}
function vazio(texto) {
  return `<div class="vazio"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><p>${texto}</p></div>`;
}
const nomeTutor = (id) => (DB.getAll('tutores').find((t) => t.id === id)?.nome || '—');

// formata número como moeda brasileira
const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
// verifica se uma data ISO pertence ao mês/ano atuais
function ehMesAtual(iso) {
  if (!iso) return false;
  const d = new Date(iso), h = new Date();
  return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth();
}
// uma nota está vencida se está pendente e a data de pagamento já passou
function notaVencida(n) {
  return n.status === 'Pendente' && n.dataPagamento && new Date(n.dataPagamento) < new Date(hojeISO());
}

// dias até a validade (negativo = vencido); null se não houver validade
function diasParaVencer(validade) {
  if (!validade) return null;
  return Math.ceil((new Date(validade) - new Date()) / 864e5);
}
// classifica um insumo: { baixo, vencido, vencendo }
function situacaoInsumo(item) {
  const baixo = Number(item.quantidade) <= Number(item.minimo);
  const dias = diasParaVencer(item.validade);
  return {
    baixo,
    vencido: dias !== null && dias < 0,
    vencendo: dias !== null && dias >= 0 && dias <= 30,
  };
}

// ---- cabeçalho do usuário --------------------------------------------
$('#usuarioNome').textContent = sessao.nome;
$('#usuarioCRMV').textContent = sessao.crmv;
$('#avatar').textContent = sessao.nome.split(' ').map((p) => p[0]).slice(0, 2).join('');

$('#btnSair').addEventListener('click', () => { DB.logout(); window.location.href = 'login.html'; });

// ---- navegação por abas ----------------------------------------------
const titulos = { dashboard: 'Dashboard', agendamentos: 'Agendamentos', pacientes: 'Pacientes', tutores: 'Tutores', estoque: 'Estoque / Insumos', financeiro: 'Financeiro' };
$$('.menu-lateral button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const aba = btn.dataset.aba;
    $$('.menu-lateral button').forEach((b) => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    $$('.aba').forEach((s) => s.classList.remove('ativa'));
    $(`#aba-${aba}`).classList.add('ativa');
    $('#tituloAba').textContent = titulos[aba];
    renderTudo();
  });
});

// ====================================================================
//  DASHBOARD
// ====================================================================
function renderDashboard() {
  const ags = DB.getAll('agendamentos');
  const pets = DB.getAll('pets');
  const tutores = DB.getAll('tutores');
  const hoje = hojeISO();

  const confirmadosHoje = ags.filter((a) => a.data === hoje && a.status === 'Confirmado');
  const pendentes = ags.filter((a) => a.status === 'Pendente');

  $('#statHoje').textContent = confirmadosHoje.length;
  $('#statPendentes').textContent = pendentes.length;
  $('#statPacientes').textContent = pets.length;
  $('#statTutores').textContent = tutores.length;
  $('#dataHoje').textContent = dataBR(hoje);

  // alertas do sistema: agendamentos pendentes + estoque
  const insumos = DB.getAll('insumos');
  const itensBaixos = insumos.filter((i) => situacaoInsumo(i).baixo);
  const itensVencendo = insumos.filter((i) => { const s = situacaoInsumo(i); return s.vencido || s.vencendo; });

  const sino = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>`;
  const caixa = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>`;

  const blocos = [];

  pendentes.forEach((a) => blocos.push(
    `<div class="alerta-clinico" style="margin-bottom:10px">${sino}
      <div>Novo agendamento <strong>pendente</strong>: ${a.petNome} (${a.setor}) — ${dataBR(a.data)}, ${a.turno}. Tutor: ${a.tutorNome} · ${a.tutorTelefone}
      <div style="margin-top:8px"><button class="btn btn--primario btn--pequeno" data-confirmar="${a.id}">Confirmar</button></div></div>
    </div>`
  ));

  if (itensBaixos.length)
    blocos.push(
      `<div class="alerta-clinico" style="margin-bottom:10px">${caixa}
        <div><strong>Estoque baixo</strong> (${itensBaixos.length} ${itensBaixos.length === 1 ? 'item' : 'itens'}): ${itensBaixos.map((i) => `${i.nome} (${i.quantidade}/${i.minimo} ${i.unidade})`).join(' · ')}
        <div style="margin-top:8px"><button class="btn btn--contorno btn--pequeno" data-ir-estoque>Ver estoque</button></div></div>
      </div>`
    );

  if (itensVencendo.length)
    blocos.push(
      `<div class="alerta-clinico" style="margin-bottom:10px">${caixa}
        <div><strong>Validade</strong> (${itensVencendo.length} ${itensVencendo.length === 1 ? 'item' : 'itens'}): ${itensVencendo.map((i) => { const d = diasParaVencer(i.validade); return `${i.nome} (${d < 0 ? 'vencido' : 'vence em ' + d + 'd'})`; }).join(' · ')}
        <div style="margin-top:8px"><button class="btn btn--contorno btn--pequeno" data-ir-estoque>Ver estoque</button></div></div>
      </div>`
    );

  const notasVencidas = DB.getAll('notas').filter(notaVencida);
  if (notasVencidas.length) {
    const total = notasVencidas.reduce((s, n) => s + Number(n.valor), 0);
    blocos.push(
      `<div class="alerta-clinico" style="margin-bottom:10px">${caixa}
        <div><strong>Contas vencidas</strong> (${notasVencidas.length}): ${notasVencidas.map((n) => `NF ${n.numero} [${n.setor}] — ${moeda(n.valor)} (${n.tipo === 'Saída' ? 'a pagar' : 'a receber'})`).join(' · ')}. Total: <strong>${moeda(total)}</strong>
        <div style="margin-top:8px"><button class="btn btn--contorno btn--pequeno" data-ir-financeiro>Ver financeiro</button></div></div>
      </div>`
    );
  }

  const alertas = $('#listaAlertas');
  alertas.innerHTML = blocos.length
    ? blocos.join('')
    : `<p style="color:var(--cinza)">Nenhum alerta no momento. Tudo em dia! ✅</p>`;

  // agenda confirmada de hoje
  const agenda = $('#agendaHoje');
  if (confirmadosHoje.length === 0) {
    agenda.innerHTML = vazio('Nenhuma consulta confirmada para hoje.');
  } else {
    agenda.innerHTML =
      `<table><thead><tr><th>Turno</th><th>Pet</th><th>Tutor</th><th>Setor</th></tr></thead><tbody>` +
      confirmadosHoje
        .sort((a, b) => a.turno.localeCompare(b.turno))
        .map((a) => `<tr><td>${a.turno}</td><td><strong>${a.petNome}</strong></td><td>${a.tutorNome}</td><td>${a.setor}</td></tr>`)
        .join('') +
      `</tbody></table>`;
  }
}

// ====================================================================
//  AGENDAMENTOS
// ====================================================================
function renderAgendamentos() {
  const filtro = $('#filtroStatus').value;
  let ags = DB.getAll('agendamentos').sort((a, b) => (b.data + b.turno).localeCompare(a.data + a.turno));
  if (filtro) ags = ags.filter((a) => a.status === filtro);

  const tbody = $('#tabelaAgendamentos');
  if (ags.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">${vazio('Nenhum agendamento encontrado.')}</td></tr>`;
    return;
  }
  tbody.innerHTML = ags
    .map((a) => {
      let acoes = '';
      if (a.status === 'Pendente')
        acoes = `<button class="btn-icone" data-confirmar="${a.id}">✓ Confirmar</button>
                 <button class="btn-icone btn-icone--perigo" data-cancelar="${a.id}">✕ Cancelar</button>`;
      else if (a.status === 'Confirmado')
        acoes = `<button class="btn-icone btn-icone--perigo" data-cancelar="${a.id}">Cancelar</button>`;
      else acoes = `<button class="btn-icone" data-reabrir="${a.id}">Reabrir</button>`;
      return `<tr><td>${dataBR(a.data)}</td><td>${a.turno}</td><td>${a.tutorNome}</td><td><strong>${a.petNome}</strong></td><td>${a.setor}</td><td>${badge(a.status)}</td><td><div class="acoes-linha">${acoes}</div></td></tr>`;
    })
    .join('');
}
$('#filtroStatus').addEventListener('change', renderAgendamentos);

// delegação de cliques para ações de agendamento (em qualquer aba)
document.addEventListener('click', (e) => {
  const conf = e.target.closest('[data-confirmar]');
  const canc = e.target.closest('[data-cancelar]');
  const reab = e.target.closest('[data-reabrir]');
  if (conf) { DB.update('agendamentos', conf.dataset.confirmar, { status: 'Confirmado' }); renderTudo(); }
  if (canc) { DB.update('agendamentos', canc.dataset.cancelar, { status: 'Cancelado' }); renderTudo(); }
  if (reab) { DB.update('agendamentos', reab.dataset.reabrir, { status: 'Pendente' }); renderTudo(); }
  if (e.target.closest('[data-ir-estoque]')) document.querySelector('.menu-lateral button[data-aba="estoque"]').click();
  if (e.target.closest('[data-ir-financeiro]')) document.querySelector('.menu-lateral button[data-aba="financeiro"]').click();
});

// ====================================================================
//  TUTORES
// ====================================================================
function renderTutores() {
  const tutores = DB.getAll('tutores');
  const pets = DB.getAll('pets');
  const tbody = $('#tabelaTutores');
  if (tutores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">${vazio('Nenhum tutor cadastrado.')}</td></tr>`;
    return;
  }
  tbody.innerHTML = tutores
    .map((t) => {
      const qtd = pets.filter((p) => p.tutorId === t.id).length;
      return `<tr><td><strong>${t.nome}</strong></td><td>${t.cpf}</td><td>${t.telefone}</td><td>${t.email || '—'}</td><td>${qtd}</td>
        <td><div class="acoes-linha">
          <button class="btn-icone" data-edit-tutor="${t.id}">Editar</button>
          <button class="btn-icone btn-icone--perigo" data-del-tutor="${t.id}">Excluir</button>
        </div></td></tr>`;
    })
    .join('');
}

const modalTutor = $('#modalTutor');
const formTutor = $('#formTutor');
$('#btnNovoTutor').addEventListener('click', () => {
  formTutor.reset();
  formTutor.id.value = '';
  $('#tituloModalTutor').textContent = 'Novo tutor';
  abrirModal(modalTutor);
});
formTutor.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(formTutor).entries());
  if (dados.id) DB.update('tutores', dados.id, dados);
  else { delete dados.id; DB.add('tutores', dados); }
  fecharModais();
  renderTudo();
});
document.addEventListener('click', (e) => {
  const ed = e.target.closest('[data-edit-tutor]');
  const del = e.target.closest('[data-del-tutor]');
  if (ed) {
    const t = DB.getAll('tutores').find((x) => x.id === ed.dataset.editTutor);
    Object.keys(t).forEach((k) => { if (formTutor[k]) formTutor[k].value = t[k]; });
    $('#tituloModalTutor').textContent = 'Editar tutor';
    abrirModal(modalTutor);
  }
  if (del) {
    const temPet = DB.getAll('pets').some((p) => p.tutorId === del.dataset.delTutor);
    if (temPet) { alert('Este tutor possui pets cadastrados. Exclua ou transfira os pets antes.'); return; }
    if (confirm('Excluir este tutor?')) { DB.remove('tutores', del.dataset.delTutor); renderTudo(); }
  }
});

// ====================================================================
//  PACIENTES (PETS)
// ====================================================================
function renderPets() {
  const busca = ($('#buscaPet')?.value || '').toLowerCase().trim();
  const especie = $('#filtroespeciePet')?.value || '';
  const porte = $('#filtroPortePet')?.value || '';

  let pets = DB.getAll('pets').sort((a, b) => a.nome.localeCompare(b.nome));
  if (especie) pets = pets.filter((p) => p.especie === especie);
  if (porte)   pets = pets.filter((p) => p.porte === porte);
  if (busca)   pets = pets.filter((p) =>
    p.nome.toLowerCase().includes(busca) ||
    (p.raca || '').toLowerCase().includes(busca) ||
    nomeTutor(p.tutorId).toLowerCase().includes(busca)
  );

  const tbody = $('#tabelaPets');
  if (pets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">${vazio('Nenhum paciente encontrado.')}</td></tr>`;
    return;
  }
  tbody.innerHTML = pets
    .map(
      (p) => `<tr>
        <td><strong>${p.nome}</strong></td>
        <td>${p.especie}${p.raca ? ' · ' + p.raca : ''}</td>
        <td>${p.porte}</td>
        <td>${calcularIdade(p.nascimento)}</td>
        <td>${nomeTutor(p.tutorId)}</td>
        <td><div class="acoes-linha">
          <button class="btn-icone" data-prontuario="${p.id}">📋 Prontuário</button>
          <button class="btn-icone" data-edit-pet="${p.id}">Editar</button>
          <button class="btn-icone btn-icone--perigo" data-del-pet="${p.id}">Excluir</button>
        </div></td></tr>`
    )
    .join('');
}

$('#buscaPet').addEventListener('input', renderPets);
$('#filtroespeciePet').addEventListener('change', renderPets);
$('#filtroPortePet').addEventListener('change', renderPets);

const modalPet = $('#modalPet');
const formPet = $('#formPet');
function preencherSelectTutores() {
  const sel = $('#selectTutorPet');
  sel.innerHTML = '<option value="">Selecione o tutor...</option>' +
    DB.getAll('tutores').map((t) => `<option value="${t.id}">${t.nome}</option>`).join('');
}
$('#btnNovoPet').addEventListener('click', () => {
  if (DB.getAll('tutores').length === 0) { alert('Cadastre um tutor antes de cadastrar um pet.'); return; }
  formPet.reset();
  formPet.id.value = '';
  preencherSelectTutores();
  $('#tituloModalPet').textContent = 'Novo paciente';
  abrirModal(modalPet);
});
formPet.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(formPet).entries());
  if (dados.id) DB.update('pets', dados.id, dados);
  else { delete dados.id; DB.add('pets', dados); }
  fecharModais();
  renderTudo();
});
document.addEventListener('click', (e) => {
  const ed = e.target.closest('[data-edit-pet]');
  const del = e.target.closest('[data-del-pet]');
  if (ed) {
    const p = DB.getAll('pets').find((x) => x.id === ed.dataset.editPet);
    preencherSelectTutores();
    Object.keys(p).forEach((k) => { if (formPet[k]) formPet[k].value = p[k]; });
    $('#tituloModalPet').textContent = 'Editar paciente';
    abrirModal(modalPet);
  }
  if (del && confirm('Excluir este paciente e todo o seu prontuário?')) {
    DB.getAll('prontuarios').filter((r) => r.petId === del.dataset.delPet).forEach((r) => DB.remove('prontuarios', r.id));
    DB.remove('pets', del.dataset.delPet);
    renderTudo();
  }
});

// ====================================================================
//  PRONTUÁRIO
// ====================================================================
const modalProntuario = $('#modalProntuario');
const formProntuario = $('#formProntuario');

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-prontuario]');
  if (!btn) return;
  abrirProntuario(btn.dataset.prontuario);
});

function abrirProntuario(petId) {
  const p = DB.getAll('pets').find((x) => x.id === petId);
  if (!p) return;
  $('#tituloProntuario').textContent = `Prontuário — ${p.nome}`;
  $('#subProntuario').textContent = `${p.especie} · ${p.raca || 'SRD'} · ${p.porte} · ${calcularIdade(p.nascimento)} · Tutor: ${nomeTutor(p.tutorId)}`;

  // alerta clínico (alergias e condições)
  $('#alertaClinicoTexto').innerHTML =
    `<strong>Atenção clínica:</strong><br>Alergias: ${p.alergias || '—'}<br>Condições preexistentes: ${p.condicoes || '—'}`;

  // ficha resumida
  $('#fichaPet').innerHTML = `
    <div class="ficha-bloco"><h4>Espécie / Raça</h4><div>${p.especie} · ${p.raca || 'SRD'}</div></div>`;

  formProntuario.reset();
  formProntuario.petId.value = petId;
  renderHistorico(petId);
  abrirModal(modalProntuario);
}

function renderHistorico(petId) {
  const registros = DB.getAll('prontuarios')
    .filter((r) => r.petId === petId)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const cont = $('#historicoProntuario');
  if (registros.length === 0) {
    cont.innerHTML = vazio('Nenhum atendimento registrado ainda.');
    return;
  }
  cont.innerHTML = registros
    .map(
      (r) => `<div class="prontuario-item">
        <div class="prontuario-item__cab"><span>${new Date(r.criadoEm).toLocaleString('pt-BR')}</span><span>${r.medico || ''}</span></div>
        <h4>Anamnese</h4><p>${r.anamnese}</p>
        ${r.peso ? `<div class="ficha-bloco" style="margin-top:8px"><h4>Peso</h4><div>${r.peso} kg</div></div>` : ''}
        ${r.vacinas ? `<div class="ficha-bloco"><h4>Vacinas</h4><div>${r.vacinas}</div></div>` : ''}
        ${r.exames ? `<div class="ficha-bloco"><h4>Exames / Anexos</h4><div>${r.exames}</div></div>` : ''}
        ${r.prescricao ? `<div class="ficha-bloco"><h4>Prescrição</h4><div>${r.prescricao}</div></div>` : ''}
      </div>`
    )
    .join('');
}

formProntuario.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(formProntuario).entries());
  DB.add('prontuarios', { ...dados, medico: sessao.nome, criadoEm: new Date().toISOString() });
  const petId = dados.petId;
  formProntuario.reset();
  formProntuario.petId.value = petId;
  renderHistorico(petId);
  renderDashboard();
});

// ====================================================================
//  ESTOQUE / INSUMOS
// ====================================================================
function renderInsumos() {
  const todos = DB.getAll('insumos');
  const busca = ($('#buscaInsumo')?.value || '').toLowerCase().trim();
  const cat = $('#filtroCategoria')?.value || '';

  // estatísticas (sempre sobre o total)
  const baixos = todos.filter((i) => situacaoInsumo(i).baixo).length;
  const vencendo = todos.filter((i) => { const s = situacaoInsumo(i); return s.vencido || s.vencendo; }).length;
  $('#statInsumos').textContent = todos.length;
  $('#statBaixos').textContent = baixos;
  $('#statVencendo').textContent = vencendo;
  $('#statCategorias').textContent = new Set(todos.map((i) => i.categoria)).size;

  let lista = todos.sort((a, b) => a.nome.localeCompare(b.nome));
  if (cat) lista = lista.filter((i) => i.categoria === cat);
  if (busca) lista = lista.filter((i) => i.nome.toLowerCase().includes(busca) || (i.observacao || '').toLowerCase().includes(busca));

  const tbody = $('#tabelaInsumos');
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">${vazio('Nenhum insumo encontrado.')}</td></tr>`;
    return;
  }
  tbody.innerHTML = lista
    .map((i) => {
      const s = situacaoInsumo(i);
      const dias = diasParaVencer(i.validade);
      // selo de situação
      let situacao = '<span class="badge badge--confirmado">OK</span>';
      if (s.baixo) situacao = '<span class="badge badge--pendente">Estoque baixo</span>';
      if (s.vencendo) situacao = `<span class="badge badge--pendente">Vence em ${dias}d</span>`;
      if (s.vencido) situacao = '<span class="badge badge--cancelado">Vencido</span>';
      const validadeTxt = i.validade ? dataBR(i.validade) : '—';
      const estoqueCor = s.baixo ? 'color:var(--aviso); font-weight:700' : '';
      return `<tr>
        <td><strong>${i.nome}</strong>${i.observacao ? `<br><span style="color:var(--cinza); font-size:.82rem">${i.observacao}</span>` : ''}</td>
        <td>${i.categoria}</td>
        <td style="${estoqueCor}">${i.quantidade} ${i.unidade}</td>
        <td>${i.minimo} ${i.unidade}</td>
        <td>${validadeTxt}</td>
        <td>${situacao}</td>
        <td><div class="acoes-linha">
          <button class="btn-icone" data-saida="${i.id}" title="Dar baixa (saída)">−</button>
          <button class="btn-icone" data-entrada="${i.id}" title="Repor (entrada)">+</button>
        </div></td>
        <td><div class="acoes-linha">
          <button class="btn-icone" data-edit-insumo="${i.id}">Editar</button>
          <button class="btn-icone btn-icone--perigo" data-del-insumo="${i.id}">Excluir</button>
        </div></td>
      </tr>`;
    })
    .join('');
}
$('#buscaInsumo').addEventListener('input', renderInsumos);
$('#filtroCategoria').addEventListener('change', renderInsumos);

const modalInsumo = $('#modalInsumo');
const formInsumo = $('#formInsumo');
$('#btnNovoInsumo').addEventListener('click', () => {
  formInsumo.reset();
  formInsumo.id.value = '';
  $('#tituloModalInsumo').textContent = 'Novo insumo';
  abrirModal(modalInsumo);
});
formInsumo.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(formInsumo).entries());
  dados.quantidade = Number(dados.quantidade);
  dados.minimo = Number(dados.minimo);
  if (dados.id) DB.update('insumos', dados.id, dados);
  else { delete dados.id; DB.add('insumos', dados); }
  fecharModais();
  renderTudo();
});

// movimentação de estoque (entrada / saída) e ações
document.addEventListener('click', (e) => {
  const entrada = e.target.closest('[data-entrada]');
  const saida = e.target.closest('[data-saida]');
  const ed = e.target.closest('[data-edit-insumo]');
  const del = e.target.closest('[data-del-insumo]');

  if (entrada || saida) {
    const id = (entrada || saida).dataset[entrada ? 'entrada' : 'saida'];
    const item = DB.getAll('insumos').find((x) => x.id === id);
    const acao = entrada ? 'Entrada (repor)' : 'Saída (dar baixa)';
    const qtd = prompt(`${acao} — ${item.nome}\nEstoque atual: ${item.quantidade} ${item.unidade}\n\nInforme a quantidade:`, '1');
    if (qtd === null) return;
    const n = parseInt(qtd, 10);
    if (isNaN(n) || n <= 0) { alert('Informe um número válido.'); return; }
    let nova = Number(item.quantidade) + (entrada ? n : -n);
    if (nova < 0) { alert('Estoque insuficiente para essa saída.'); return; }
    DB.update('insumos', id, { quantidade: nova });
    renderTudo();
  }
  if (ed) {
    const i = DB.getAll('insumos').find((x) => x.id === ed.dataset.editInsumo);
    Object.keys(i).forEach((k) => { if (formInsumo[k]) formInsumo[k].value = i[k]; });
    $('#tituloModalInsumo').textContent = 'Editar insumo';
    abrirModal(modalInsumo);
  }
  if (del && confirm('Excluir este insumo do estoque?')) {
    DB.remove('insumos', del.dataset.delInsumo);
    renderTudo();
  }
});

// ====================================================================
//  FINANCEIRO
// ====================================================================

// setor ativo no financeiro ('' = consolidado)
let setorFinanceiro = '';
$$('.setor-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.setor-btn').forEach((b) => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    setorFinanceiro = btn.dataset.setor;
    renderFinanceiro();
  });
});

// --- sub-navegação (Caixa / Notas) ---
$$('.sub-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    $$('.sub-pill').forEach((p) => p.classList.remove('ativo'));
    pill.classList.add('ativo');
    $$('.sub-conteudo').forEach((s) => s.classList.remove('ativa'));
    $(`#sub-${pill.dataset.sub}`).classList.add('ativa');
  });
});

// ----- FLUXO DE CAIXA -----
function renderCaixa() {
  let todos = DB.getAll('financeiro');
  if (setorFinanceiro) todos = todos.filter((m) => m.setor === setorFinanceiro);
  const pagos = todos.filter((m) => m.status === 'Pago');

  const totalEntradasPagas = pagos.filter((m) => m.tipo === 'Entrada').reduce((s, m) => s + Number(m.valor), 0);
  const totalSaidasPagas = pagos.filter((m) => m.tipo === 'Saída').reduce((s, m) => s + Number(m.valor), 0);
  const entradasMes = pagos.filter((m) => m.tipo === 'Entrada' && ehMesAtual(m.data)).reduce((s, m) => s + Number(m.valor), 0);
  const saidasMes = pagos.filter((m) => m.tipo === 'Saída' && ehMesAtual(m.data)).reduce((s, m) => s + Number(m.valor), 0);

  $('#finSaldo').textContent = moeda(totalEntradasPagas - totalSaidasPagas);
  $('#finEntradas').textContent = moeda(entradasMes);
  $('#finSaidas').textContent = moeda(saidasMes);
  const resultado = entradasMes - saidasMes;
  const elRes = $('#finResultado');
  elRes.textContent = moeda(resultado);
  elRes.style.color = resultado >= 0 ? 'var(--ok)' : 'var(--erro)';

  // filtros
  const busca = ($('#buscaCaixa')?.value || '').toLowerCase().trim();
  const fTipo = $('#filtroTipoCaixa')?.value || '';
  const fStatus = $('#filtroStatusCaixa')?.value || '';
  let lista = todos.sort((a, b) => b.data.localeCompare(a.data));
  if (fTipo) lista = lista.filter((m) => m.tipo === fTipo);
  if (fStatus) lista = lista.filter((m) => m.status === fStatus);
  if (busca) lista = lista.filter((m) => m.descricao.toLowerCase().includes(busca) || (m.categoria || '').toLowerCase().includes(busca));

  const tbody = $('#tabelaCaixa');
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">${vazio('Nenhuma movimentação encontrada.')}</td></tr>`;
    return;
  }
  tbody.innerHTML = lista
    .map((m) => {
      const sinal = m.tipo === 'Entrada' ? '+' : '−';
      const classe = m.tipo === 'Entrada' ? 'valor-entrada' : 'valor-saida';
      const stBadge = m.status === 'Pago' ? '<span class="badge badge--confirmado">Pago</span>' : '<span class="badge badge--pendente">Pendente</span>';
      return `<tr>
        <td>${dataBR(m.data)}</td>
        <td><strong>${m.descricao}</strong></td>
        <td><span class="badge badge--setor">${m.setor || '—'}</span></td>
        <td>${m.categoria || '—'}</td>
        <td>${m.forma || '—'}</td>
        <td>${m.tipo}</td>
        <td class="${classe}">${sinal} ${moeda(m.valor)}</td>
        <td>${stBadge}</td>
        <td><div class="acoes-linha">
          ${m.status === 'Pendente' ? `<button class="btn-icone" data-pagar-caixa="${m.id}" title="Marcar como pago">✓</button>` : ''}
          <button class="btn-icone" data-edit-caixa="${m.id}">Editar</button>
          <button class="btn-icone btn-icone--perigo" data-del-caixa="${m.id}">Excluir</button>
        </div></td>
      </tr>`;
    })
    .join('');
}

const modalCaixa = $('#modalCaixa');
const formCaixa = $('#formCaixa');
function abrirNovoCaixa(tipo) {
  formCaixa.reset();
  formCaixa.id.value = '';
  formCaixa.tipo.value = tipo;
  formCaixa.setor.value = setorFinanceiro;
  formCaixa.data.value = hojeISO();
  formCaixa.status.value = 'Pago';
  $('#tituloModalCaixa').textContent = tipo === 'Entrada' ? 'Nova entrada' : 'Nova saída';
  abrirModal(modalCaixa);
}
$('#btnNovaEntrada').addEventListener('click', () => abrirNovoCaixa('Entrada'));
$('#btnNovaSaida').addEventListener('click', () => abrirNovoCaixa('Saída'));
['buscaCaixa', 'filtroTipoCaixa', 'filtroStatusCaixa'].forEach((id) => {
  $('#' + id).addEventListener(id === 'buscaCaixa' ? 'input' : 'change', renderCaixa);
});
formCaixa.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(formCaixa).entries());
  dados.valor = Number(dados.valor);
  if (dados.id) DB.update('financeiro', dados.id, dados);
  else { delete dados.id; DB.add('financeiro', dados); }
  fecharModais();
  renderTudo();
});

// ----- NOTAS FISCAIS -----
function renderNotas() {
  let todas = DB.getAll('notas');
  if (setorFinanceiro) todas = todas.filter((n) => n.setor === setorFinanceiro);

  const aReceber = todas.filter((n) => n.tipo === 'Entrada' && n.status === 'Pendente').reduce((s, n) => s + Number(n.valor), 0);
  const aPagar = todas.filter((n) => n.tipo === 'Saída' && n.status === 'Pendente').reduce((s, n) => s + Number(n.valor), 0);
  const vencidas = todas.filter(notaVencida).length;
  const emitidoMes = todas.filter((n) => ehMesAtual(n.dataEmissao)).reduce((s, n) => s + Number(n.valor), 0);

  $('#finReceber').textContent = moeda(aReceber);
  $('#finPagar').textContent = moeda(aPagar);
  $('#finVencidas').textContent = vencidas;
  $('#finNotasMes').textContent = moeda(emitidoMes);

  // filtros
  const busca = ($('#buscaNota')?.value || '').toLowerCase().trim();
  const fTipo = $('#filtroTipoNota')?.value || '';
  const fStatus = $('#filtroStatusNota')?.value || '';
  let lista = todas.sort((a, b) => (b.dataEmissao || '').localeCompare(a.dataEmissao || ''));
  if (fTipo) lista = lista.filter((n) => n.tipo === fTipo);
  if (fStatus === 'Vencida') lista = lista.filter(notaVencida);
  else if (fStatus) lista = lista.filter((n) => n.status === fStatus);
  if (busca) lista = lista.filter((n) => n.numero.toLowerCase().includes(busca) || n.descricao.toLowerCase().includes(busca) || (n.parte || '').toLowerCase().includes(busca));

  const tbody = $('#tabelaNotas');
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">${vazio('Nenhuma nota fiscal encontrada.')}</td></tr>`;
    return;
  }
  tbody.innerHTML = lista
    .map((n) => {
      const classe = n.tipo === 'Entrada' ? 'valor-entrada' : 'valor-saida';
      let stBadge = '<span class="badge badge--confirmado">Pago</span>';
      if (notaVencida(n)) stBadge = '<span class="badge badge--cancelado">Vencida</span>';
      else if (n.status === 'Pendente') stBadge = '<span class="badge badge--pendente">Pendente</span>';
      const boleto = n.boleto
        ? `<span class="boleto-cel" title="${n.boleto}">${n.boleto}</span>`
        : '<span style="color:var(--cinza)">—</span>';
      return `<tr>
        <td><strong>${n.numero}</strong><br><span style="color:var(--cinza); font-size:.8rem">${n.tipo}</span></td>
        <td>${n.descricao}</td>
        <td><span class="badge badge--setor">${n.setor || '—'}</span></td>
        <td>${n.parte || '—'}</td>
        <td>${dataBR(n.dataEmissao)}</td>
        <td>${dataBR(n.dataPagamento)}</td>
        <td>${boleto}</td>
        <td class="${classe}">${moeda(n.valor)}</td>
        <td>${stBadge}</td>
        <td><div class="acoes-linha">
          ${n.status === 'Pendente' ? `<button class="btn-icone" data-pagar-nota="${n.id}" title="Dar baixa / marcar paga">✓ Baixar</button>` : ''}
          <button class="btn-icone" data-edit-nota="${n.id}">Editar</button>
          <button class="btn-icone btn-icone--perigo" data-del-nota="${n.id}">Excluir</button>
        </div></td>
      </tr>`;
    })
    .join('');
}

const modalNota = $('#modalNota');
const formNota = $('#formNota');
$('#btnNovaNota').addEventListener('click', () => {
  formNota.reset();
  formNota.id.value = '';
  formNota.setor.value = setorFinanceiro;
  formNota.dataEmissao.value = hojeISO();
  formNota.status.value = 'Pendente';
  $('#tituloModalNota').textContent = 'Nova nota fiscal';
  abrirModal(modalNota);
});
['buscaNota', 'filtroTipoNota', 'filtroStatusNota'].forEach((id) => {
  $('#' + id).addEventListener(id === 'buscaNota' ? 'input' : 'change', renderNotas);
});
formNota.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(formNota).entries());
  dados.valor = Number(dados.valor);
  if (dados.id) DB.update('notas', dados.id, dados);
  else { delete dados.id; DB.add('notas', dados); }
  fecharModais();
  renderTudo();
});

// ações de caixa e notas (delegação)
document.addEventListener('click', (e) => {
  const pagarC = e.target.closest('[data-pagar-caixa]');
  const editC = e.target.closest('[data-edit-caixa]');
  const delC = e.target.closest('[data-del-caixa]');
  const pagarN = e.target.closest('[data-pagar-nota]');
  const editN = e.target.closest('[data-edit-nota]');
  const delN = e.target.closest('[data-del-nota]');

  if (pagarC) { DB.update('financeiro', pagarC.dataset.pagarCaixa, { status: 'Pago' }); renderTudo(); }
  if (editC) {
    const m = DB.getAll('financeiro').find((x) => x.id === editC.dataset.editCaixa);
    Object.keys(m).forEach((k) => { if (formCaixa[k]) formCaixa[k].value = m[k]; });
    $('#tituloModalCaixa').textContent = 'Editar lançamento';
    abrirModal(modalCaixa);
  }
  if (delC && confirm('Excluir este lançamento de caixa?')) { DB.remove('financeiro', delC.dataset.delCaixa); renderTudo(); }

  if (pagarN) {
    const n = DB.getAll('notas').find((x) => x.id === pagarN.dataset.pagarNota);
    const dados = { status: 'Pago' };
    if (!n.dataPagamento) dados.dataPagamento = hojeISO();
    DB.update('notas', n.id, dados);
    // gera automaticamente a movimentação de caixa correspondente
    DB.add('financeiro', {
      setor: n.setor,
      tipo: n.tipo,
      categoria: n.tipo === 'Entrada' ? 'Outras receitas' : 'Fornecedores',
      descricao: `NF ${n.numero} — ${n.descricao}`,
      valor: Number(n.valor),
      data: dados.dataPagamento || n.dataPagamento || hojeISO(),
      forma: n.boleto ? 'Boleto' : 'Transferência',
      status: 'Pago',
    });
    alert(`Nota ${n.numero} baixada e lançada no caixa automaticamente.`);
    renderTudo();
  }
  if (editN) {
    const n = DB.getAll('notas').find((x) => x.id === editN.dataset.editNota);
    Object.keys(n).forEach((k) => { if (formNota[k]) formNota[k].value = n[k]; });
    $('#tituloModalNota').textContent = 'Editar nota fiscal';
    abrirModal(modalNota);
  }
  if (delN && confirm('Excluir esta nota fiscal?')) { DB.remove('notas', delN.dataset.delNota); renderTudo(); }
});

// ----- EXPORTAÇÃO PARA EXCEL -----
function dadosFinanceirosFiltrados() {
  let caixa = DB.getAll('financeiro');
  let notas = DB.getAll('notas');
  if (setorFinanceiro) {
    caixa = caixa.filter((m) => m.setor === setorFinanceiro);
    notas = notas.filter((n) => n.setor === setorFinanceiro);
  }
  return { caixa, notas };
}

function exportarFinanceiro() {
  const setorLabel = setorFinanceiro || 'Consolidado';
  const { caixa, notas } = dadosFinanceirosFiltrados();
  const nomeArq = `Financeiro_${setorLabel.replace(/[^\wÀ-ÿ]+/g, '_')}_${hojeISO()}`;

  // sem internet / biblioteca indisponível -> CSV
  if (typeof XLSX === 'undefined') return exportarCSV(caixa, notas, nomeArq);

  // --- aba Resumo ---
  const entPagas = caixa.filter((m) => m.status === 'Pago' && m.tipo === 'Entrada').reduce((s, m) => s + Number(m.valor), 0);
  const saiPagas = caixa.filter((m) => m.status === 'Pago' && m.tipo === 'Saída').reduce((s, m) => s + Number(m.valor), 0);
  const aReceber = notas.filter((n) => n.tipo === 'Entrada' && n.status === 'Pendente').reduce((s, n) => s + Number(n.valor), 0);
  const aPagar = notas.filter((n) => n.tipo === 'Saída' && n.status === 'Pendente').reduce((s, n) => s + Number(n.valor), 0);
  const vencidas = notas.filter(notaVencida).length;

  const resumo = [
    ['Relatório Financeiro — Cia Pet'],
    ['Setor', setorLabel],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
    [],
    ['FLUXO DE CAIXA (lançamentos pagos)'],
    ['Total de entradas (R$)', entPagas],
    ['Total de saídas (R$)', saiPagas],
    ['Saldo em caixa (R$)', entPagas - saiPagas],
    [],
    ['NOTAS FISCAIS'],
    ['A receber — pendente (R$)', aReceber],
    ['A pagar — pendente (R$)', aPagar],
    ['Contas vencidas (qtd)', vencidas],
  ];

  const caixaAOA = [
    ['Data', 'Setor', 'Tipo', 'Categoria', 'Descrição', 'Forma de pagamento', 'Valor (R$)', 'Status'],
    ...caixa.sort((a, b) => b.data.localeCompare(a.data)).map((m) => [
      dataBR(m.data), m.setor || '', m.tipo, m.categoria || '', m.descricao, m.forma || '', Number(m.valor), m.status,
    ]),
  ];

  const notasAOA = [
    ['Nº NF', 'Setor', 'Tipo', 'Descrição', 'Cliente/Fornecedor', 'Emissão', 'Pagamento', 'Boleto', 'Valor (R$)', 'Status'],
    ...notas.sort((a, b) => (b.dataEmissao || '').localeCompare(a.dataEmissao || '')).map((n) => [
      n.numero, n.setor || '', n.tipo, n.descricao, n.parte || '', dataBR(n.dataEmissao), dataBR(n.dataPagamento), n.boleto || '', Number(n.valor), notaVencida(n) ? 'Vencida' : n.status,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const wsR = XLSX.utils.aoa_to_sheet(resumo);
  wsR['!cols'] = [{ wch: 30 }, { wch: 26 }];
  const wsC = XLSX.utils.aoa_to_sheet(caixaAOA);
  wsC['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 16 }, { wch: 36 }, { wch: 18 }, { wch: 12 }, { wch: 10 }];
  const wsN = XLSX.utils.aoa_to_sheet(notasAOA);
  wsN['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 36 }, { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 42 }, { wch: 12 }, { wch: 10 }];

  XLSX.utils.book_append_sheet(wb, wsR, 'Resumo');
  XLSX.utils.book_append_sheet(wb, wsC, 'Fluxo de Caixa');
  XLSX.utils.book_append_sheet(wb, wsN, 'Notas Fiscais');
  XLSX.writeFile(wb, nomeArq + '.xlsx');
}

// fallback: gera CSV (abre no Excel) quando a biblioteca não está disponível
function exportarCSV(caixa, notas, nomeArq) {
  const sep = ';';
  const linha = (arr) => arr.map((c) => `"${(c == null ? '' : c).toString().replace(/"/g, '""')}"`).join(sep);
  const num = (v) => Number(v).toFixed(2).replace('.', ',');

  const csvCaixa = ['﻿' + linha(['Data', 'Setor', 'Tipo', 'Categoria', 'Descrição', 'Forma', 'Valor', 'Status'])]
    .concat(caixa.map((m) => linha([dataBR(m.data), m.setor, m.tipo, m.categoria, m.descricao, m.forma, num(m.valor), m.status]))).join('\r\n');
  const csvNotas = ['﻿' + linha(['Nº NF', 'Setor', 'Tipo', 'Descrição', 'Cliente/Fornecedor', 'Emissão', 'Pagamento', 'Boleto', 'Valor', 'Status'])]
    .concat(notas.map((n) => linha([n.numero, n.setor, n.tipo, n.descricao, n.parte, dataBR(n.dataEmissao), dataBR(n.dataPagamento), n.boleto, num(n.valor), notaVencida(n) ? 'Vencida' : n.status]))).join('\r\n');

  baixarArquivo(csvCaixa, nomeArq + '_caixa.csv', 'text/csv');
  baixarArquivo(csvNotas, nomeArq + '_notas.csv', 'text/csv');
  alert('Biblioteca Excel indisponível (provavelmente sem internet). Exportei em CSV — que também abre no Excel — em dois arquivos: caixa e notas.');
}

function baixarArquivo(conteudo, nome, mime) {
  const blob = new Blob([conteudo], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

$('#btnExportar').addEventListener('click', exportarFinanceiro);

function renderFinanceiro() { renderCaixa(); renderNotas(); }

// ====================================================================
//  MODAIS (genérico)
// ====================================================================
function abrirModal(m) { m.classList.add('aberto'); }
function fecharModais() { $$('.modal-fundo').forEach((m) => m.classList.remove('aberto')); }
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-fechar]')) fecharModais();
  if (e.target.classList.contains('modal-fundo')) fecharModais();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModais(); });

// ====================================================================
//  RENDER GERAL
// ====================================================================
function renderTudo() {
  renderDashboard();
  renderAgendamentos();
  renderPets();
  renderTutores();
  renderInsumos();
  renderFinanceiro();
}
renderTudo();
