import { useEffect, useState, type FormEvent } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonSpinner, IonModal,
} from '@ionic/react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface Lancamento {
  id: string; setor: string; tipo: string; categoria: string | null;
  descricao: string; valor: number; data: string; forma: string | null; status: string;
}
interface Nota {
  id: string; setor: string; numero: string; tipo: string; descricao: string;
  parte: string | null; valor: number; data_emissao: string | null;
  data_pagamento: string | null; boleto: string | null; status: string;
}

const SETORES = ['Clínica Veterinária', 'Banho e Tosa'];
const FORMAS  = ['Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Transferência', 'Boleto', 'Cheque'];
const CATS_ENTRADA = ['Consultas', 'Cirurgias', 'Vacinas', 'Exames', 'Banho e Tosa', 'Produtos', 'Outras receitas'];
const CATS_SAIDA   = ['Folha de pagamento', 'Fornecedores', 'Aluguel', 'Energia/Água/Internet', 'Impostos', 'Equipamentos', 'Medicamentos/Insumos', 'Outras despesas'];

const VAZIO_CAIXA = { setor: '', tipo: 'Entrada', categoria: '', descricao: '', valor: '', data: hoje(), forma: '', status: 'Pago' };
const VAZIO_NOTA  = { setor: '', numero: '', tipo: 'Entrada', descricao: '', parte: '', valor: '', data_emissao: hoje(), data_pagamento: '', boleto: '', status: 'Pendente' };

function hoje() { return new Date().toISOString().slice(0, 10); }
function moeda(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function dataBR(s: string | null) { return s ? new Date(s + 'T12:00:00').toLocaleDateString('pt-BR') : '—'; }
function ehMesAtual(s: string | null) {
  if (!s) return false;
  const d = new Date(s + 'T12:00:00'), n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function notaVencida(n: Nota) {
  if (n.status === 'Pago' || !n.data_pagamento) return false;
  return new Date(n.data_pagamento + 'T12:00:00') < new Date(hoje() + 'T12:00:00');
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e4ece8',
  fontSize: '.95rem', color: '#1a2e27', background: '#fff', boxSizing: 'border-box',
  fontFamily: 'inherit', outline: 'none',
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#1a2e27', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, valor, cor, sub }: { label: string; valor: string; cor: string; sub?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 140, background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: cor, marginBottom: 2 }}>{valor}</div>
      <div style={{ fontSize: '.78rem', color: '#6b7f79' }}>{label}</div>
      {sub && <div style={{ fontSize: '.72rem', color: '#a0aea9', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Financeiro() {
  const [aba, setAba]             = useState<'caixa' | 'notas'>('caixa');
  const [setor, setSetor]         = useState('');
  const [lancamentos, setLanc]    = useState<Lancamento[]>([]);
  const [notas, setNotas]         = useState<Nota[]>([]);
  const [busca, setBusca]         = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregando, setCarregando]     = useState(true);
  const [abrirCaixa, setAbrirCaixa]     = useState(false);
  const [abrirNota, setAbrirNota]       = useState(false);
  const [formCaixa, setFormCaixa]       = useState<typeof VAZIO_CAIXA & { id?: string }>(VAZIO_CAIXA);
  const [formNota, setFormNota]         = useState<typeof VAZIO_NOTA & { id?: string }>(VAZIO_NOTA);
  const [salvando, setSalvando]         = useState(false);

  async function carregar() {
    const [l, n] = await Promise.all([
      supabase.from('financeiro').select('*').order('data', { ascending: false }),
      supabase.from('notas_fiscais').select('*').order('data_emissao', { ascending: false }),
    ]);
    setLanc((l.data as Lancamento[]) ?? []);
    setNotas((n.data as Nota[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const base     = lancamentos.filter((m) => !setor || m.setor === setor);
  const pagos    = base.filter((m) => m.status === 'Pago');
  const totalE   = pagos.filter((m) => m.tipo === 'Entrada').reduce((s, m) => s + Number(m.valor), 0);
  const totalS   = pagos.filter((m) => m.tipo === 'Saída').reduce((s, m) => s + Number(m.valor), 0);
  const mesE     = pagos.filter((m) => m.tipo === 'Entrada' && ehMesAtual(m.data)).reduce((s, m) => s + Number(m.valor), 0);
  const mesS     = pagos.filter((m) => m.tipo === 'Saída' && ehMesAtual(m.data)).reduce((s, m) => s + Number(m.valor), 0);
  const baseN    = notas.filter((n) => !setor || n.setor === setor);
  const aReceber = baseN.filter((n) => n.tipo === 'Entrada' && n.status === 'Pendente').reduce((s, n) => s + Number(n.valor), 0);
  const aPagar   = baseN.filter((n) => n.tipo === 'Saída' && n.status === 'Pendente').reduce((s, n) => s + Number(n.valor), 0);
  const vencidas = baseN.filter(notaVencida).length;

  const lancsFilt = base
    .filter((m) => !filtroTipo || m.tipo === filtroTipo)
    .filter((m) => !filtroStatus || m.status === filtroStatus)
    .filter((m) => { const t = busca.toLowerCase(); return !t || m.descricao.toLowerCase().includes(t) || (m.categoria ?? '').toLowerCase().includes(t); });

  const notasFilt = baseN
    .filter((n) => !filtroTipo || n.tipo === filtroTipo)
    .filter((n) => { if (!filtroStatus) return true; if (filtroStatus === 'Vencida') return notaVencida(n); return n.status === filtroStatus; })
    .filter((n) => { const t = busca.toLowerCase(); return !t || n.descricao.toLowerCase().includes(t) || n.numero.toLowerCase().includes(t) || (n.parte ?? '').toLowerCase().includes(t); });

  const setCaixa = (c: string, v: string) => setFormCaixa((f) => ({ ...f, [c]: v }));
  async function salvarCaixa(e: FormEvent) {
    e.preventDefault();
    if (!formCaixa.setor) { window.alert('Selecione o setor.'); return; }
    if (!formCaixa.descricao.trim()) { window.alert('Informe a descrição.'); return; }
    if (!formCaixa.valor || isNaN(parseFloat(formCaixa.valor))) { window.alert('Informe o valor.'); return; }
    setSalvando(true);
    const dados = { setor: formCaixa.setor, tipo: formCaixa.tipo, categoria: formCaixa.categoria || null, descricao: formCaixa.descricao, valor: parseFloat(formCaixa.valor), data: formCaixa.data, forma: formCaixa.forma || null, status: formCaixa.status };
    const resp = formCaixa.id ? await supabase.from('financeiro').update(dados).eq('id', formCaixa.id) : await supabase.from('financeiro').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro: ' + resp.error.message); return; }
    setAbrirCaixa(false); carregar();
  }

  const setNota = (c: string, v: string) => setFormNota((f) => ({ ...f, [c]: v }));
  async function salvarNota(e: FormEvent) {
    e.preventDefault();
    if (!formNota.setor) { window.alert('Selecione o setor.'); return; }
    if (!formNota.numero.trim()) { window.alert('Informe o número.'); return; }
    if (!formNota.descricao.trim()) { window.alert('Informe a descrição.'); return; }
    if (!formNota.valor || isNaN(parseFloat(formNota.valor))) { window.alert('Informe o valor.'); return; }
    setSalvando(true);
    const dados = { setor: formNota.setor, numero: formNota.numero, tipo: formNota.tipo, descricao: formNota.descricao, parte: formNota.parte || null, valor: parseFloat(formNota.valor), data_emissao: formNota.data_emissao || null, data_pagamento: formNota.data_pagamento || null, boleto: formNota.boleto || null, status: formNota.status };
    const resp = formNota.id ? await supabase.from('notas_fiscais').update(dados).eq('id', formNota.id) : await supabase.from('notas_fiscais').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro: ' + resp.error.message); return; }
    setAbrirNota(false); carregar();
  }

  async function darBaixa(n: Nota) {
    if (!window.confirm(`Dar baixa na NF ${n.numero} e lançar no caixa?`)) return;
    const dataPag = n.data_pagamento || hoje();
    const [r1, r2] = await Promise.all([
      supabase.from('notas_fiscais').update({ status: 'Pago', data_pagamento: dataPag }).eq('id', n.id),
      supabase.from('financeiro').insert({ setor: n.setor, tipo: n.tipo, categoria: n.tipo === 'Entrada' ? 'Outras receitas' : 'Fornecedores', descricao: `NF ${n.numero} — ${n.descricao}`, valor: Number(n.valor), data: dataPag, forma: n.boleto ? 'Boleto' : 'Transferência', status: 'Pago' }),
    ]);
    if (r1.error || r2.error) { window.alert('Erro ao dar baixa.'); return; }
    carregar();
  }

  function exportar() {
    const label = setor || 'Consolidado';
    const lBase = setor ? lancamentos.filter((m) => m.setor === setor) : lancamentos;
    const nBase = setor ? notas.filter((n) => n.setor === setor) : notas;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Relatório Financeiro — Cia Pet'], ['Setor', label], ['Gerado em', new Date().toLocaleString('pt-BR')], [],
      ['FLUXO DE CAIXA'], ['Entradas pagas', totalE], ['Saídas pagas', totalS], ['Saldo', totalE - totalS], [],
      ['NOTAS FISCAIS'], ['A receber', aReceber], ['A pagar', aPagar], ['Vencidas', vencidas],
    ]), 'Resumo');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Data', 'Setor', 'Tipo', 'Categoria', 'Descrição', 'Forma', 'Valor (R$)', 'Status'],
      ...lBase.map((m) => [dataBR(m.data), m.setor, m.tipo, m.categoria ?? '', m.descricao, m.forma ?? '', Number(m.valor), m.status]),
    ]), 'Fluxo de Caixa');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Nº NF', 'Setor', 'Tipo', 'Descrição', 'Parte', 'Emissão', 'Pagamento', 'Boleto', 'Valor (R$)', 'Status'],
      ...nBase.map((n) => [n.numero, n.setor, n.tipo, n.descricao, n.parte ?? '', dataBR(n.data_emissao), dataBR(n.data_pagamento), n.boleto ?? '', Number(n.valor), notaVencida(n) ? 'Vencida' : n.status]),
    ]), 'Notas Fiscais');
    XLSX.writeFile(wb, `Financeiro_${label.replace(/[^\wÀ-ÿ]+/g, '_')}_${hoje()}.xlsx`);
  }

  const pill = (label: string, ativo: boolean, onClick: () => void, cor = '#2a9d78') => (
    <button onClick={onClick} style={{
      padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
      background: ativo ? cor : '#fff', color: ativo ? '#fff' : '#5f6f69',
      fontWeight: ativo ? 700 : 400, fontSize: '.85rem', fontFamily: 'inherit',
      boxShadow: '0 2px 8px rgba(0,0,0,.06)',
    }}>{label}</button>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Financeiro</IonTitle>
          <IonButtons slot="end">
            <button onClick={exportar} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '.85rem', fontFamily: 'inherit', fontWeight: 600 }}>
              📥 Excel
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f4f7f5' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>

          {/* Abas */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {pill('💵 Fluxo de Caixa', aba === 'caixa', () => { setAba('caixa'); setBusca(''); setFiltroTipo(''); setFiltroStatus(''); })}
            {pill('🧾 Notas Fiscais', aba === 'notas', () => { setAba('notas'); setBusca(''); setFiltroTipo(''); setFiltroStatus(''); })}
          </div>

          {/* Filtro setor */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {['', ...SETORES].map((s) => pill(s || 'Consolidado', setor === s, () => setSetor(s), '#1a2e27'))}
          </div>

          {/* Cards resumo */}
          {aba === 'caixa' ? (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <Stat label="Saldo total" valor={moeda(totalE - totalS)} cor={(totalE - totalS) >= 0 ? '#2a9d78' : '#d64545'} />
              <Stat label="Entradas do mês" valor={moeda(mesE)} cor="#2a9d78" />
              <Stat label="Saídas do mês" valor={moeda(mesS)} cor="#d64545" />
              <Stat label="Resultado do mês" valor={moeda(mesE - mesS)} cor={(mesE - mesS) >= 0 ? '#2a9d78' : '#d64545'} sub={(mesE - mesS) >= 0 ? 'Positivo' : 'Negativo'} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <Stat label="A receber" valor={moeda(aReceber)} cor="#2a9d78" />
              <Stat label="A pagar" valor={moeda(aPagar)} cor="#d64545" />
              <Stat label="Vencidas" valor={String(vencidas)} cor={vencidas > 0 ? '#d64545' : '#6b7f79'} />
              <Stat label="Total notas" valor={String(baseN.length)} cor="#5b6af5" />
            </div>
          )}

          {/* Busca + filtros + botão */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <input placeholder="🔍 Buscar..." value={busca} onChange={e => setBusca(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 120 }}>
              <option value="">Todos os tipos</option>
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
            </select>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 120 }}>
              <option value="">Todos status</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              {aba === 'notas' && <option value="Vencida">Vencida</option>}
            </select>
            {aba === 'caixa' ? (
              <>
                <button onClick={() => { setFormCaixa({ ...VAZIO_CAIXA, tipo: 'Entrada', setor, data: hoje() }); setAbrirCaixa(true); }} style={{ padding: '11px 16px', borderRadius: 10, border: 'none', background: '#2a9d78', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '.85rem' }}>+ Entrada</button>
                <button onClick={() => { setFormCaixa({ ...VAZIO_CAIXA, tipo: 'Saída', setor, data: hoje() }); setAbrirCaixa(true); }} style={{ padding: '11px 16px', borderRadius: 10, border: 'none', background: '#d64545', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '.85rem' }}>+ Saída</button>
              </>
            ) : (
              <button onClick={() => { setFormNota({ ...VAZIO_NOTA, setor, data_emissao: hoje() }); setAbrirNota(true); }} style={{ padding: '11px 16px', borderRadius: 10, border: 'none', background: '#2a9d78', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '.85rem' }}>+ Nova NF</button>
            )}
          </div>

          {/* Lista */}
          {carregando ? (
            <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
          ) : aba === 'caixa' ? (
            lancsFilt.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#6b7f79' }}><div style={{ fontSize: 40, marginBottom: 12 }}>💵</div><p>Nenhuma movimentação encontrada.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lancsFilt.map((m) => (
                  <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    {/* Ícone tipo */}
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: m.tipo === 'Entrada' ? '#e3f3eb' : '#fdecea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {m.tipo === 'Entrada' ? '📈' : '📉'}
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.95rem' }}>{m.descricao}</div>
                      <div style={{ color: '#6b7f79', fontSize: '.78rem', marginTop: 2 }}>
                        {dataBR(m.data)} · {m.setor}{m.categoria ? ` · ${m.categoria}` : ''}{m.forma ? ` · ${m.forma}` : ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: m.tipo === 'Entrada' ? '#2a9d78' : '#d64545', flexShrink: 0 }}>
                      {m.tipo === 'Entrada' ? '+' : '−'} {moeda(Number(m.valor))}
                    </div>
                    <span style={{ background: m.status === 'Pago' ? '#e3f3eb' : '#fff8ec', color: m.status === 'Pago' ? '#2a9d78' : '#e07b39', borderRadius: 8, padding: '4px 10px', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {m.status}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {m.status === 'Pendente' && <button onClick={async () => { await supabase.from('financeiro').update({ status: 'Pago' }).eq('id', m.id); carregar(); }} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#e3f3eb', color: '#2a9d78', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', fontWeight: 700 }}>✓ Pagar</button>}
                      <button onClick={() => { setFormCaixa({ id: m.id, setor: m.setor, tipo: m.tipo, categoria: m.categoria ?? '', descricao: m.descricao, valor: String(m.valor), data: m.data, forma: m.forma ?? '', status: m.status }); setAbrirCaixa(true); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e4ece8', background: '#fff', color: '#1a2e27', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem' }}>✏️</button>
                      <button onClick={async () => { if (window.confirm('Excluir?')) { await supabase.from('financeiro').delete().eq('id', m.id); carregar(); } }} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fdecea', background: '#fdecea', color: '#d64545', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            notasFilt.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#6b7f79' }}><div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div><p>Nenhuma nota fiscal encontrada.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notasFilt.map((n) => {
                  const vencida = notaVencida(n);
                  return (
                    <div key={n.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: n.tipo === 'Entrada' ? '#e3f3eb' : '#fdecea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        🧾
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.93rem' }}>NF {n.numero} · {n.descricao}</div>
                        <div style={{ color: '#6b7f79', fontSize: '.78rem', marginTop: 2 }}>
                          {n.setor}{n.parte ? ` · ${n.parte}` : ''} · Emissão: {dataBR(n.data_emissao)} · Pagto: {dataBR(n.data_pagamento)}
                        </div>
                        {n.boleto && <div style={{ color: '#a0aea9', fontSize: '.72rem', marginTop: 2 }}>Boleto: {n.boleto}</div>}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: n.tipo === 'Entrada' ? '#2a9d78' : '#d64545', flexShrink: 0 }}>
                        {moeda(Number(n.valor))}
                      </div>
                      <span style={{ background: vencida ? '#fdecea' : n.status === 'Pago' ? '#e3f3eb' : '#fff8ec', color: vencida ? '#d64545' : n.status === 'Pago' ? '#2a9d78' : '#e07b39', borderRadius: 8, padding: '4px 10px', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {vencida ? '⚠️ Vencida' : n.status === 'Pago' ? '✅ Pago' : '⏳ Pendente'}
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {n.status === 'Pendente' && <button onClick={() => darBaixa(n)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#e3f3eb', color: '#2a9d78', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', fontWeight: 700 }}>✓ Baixar</button>}
                        <button onClick={() => { setFormNota({ id: n.id, setor: n.setor, numero: n.numero, tipo: n.tipo, descricao: n.descricao, parte: n.parte ?? '', valor: String(n.valor), data_emissao: n.data_emissao ?? '', data_pagamento: n.data_pagamento ?? '', boleto: n.boleto ?? '', status: n.status }); setAbrirNota(true); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e4ece8', background: '#fff', color: '#1a2e27', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem' }}>✏️</button>
                        <button onClick={async () => { if (window.confirm('Excluir?')) { await supabase.from('notas_fiscais').delete().eq('id', n.id); carregar(); } }} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fdecea', background: '#fdecea', color: '#d64545', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem' }}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Modal Caixa */}
        <IonModal isOpen={abrirCaixa} onDidDismiss={() => setAbrirCaixa(false)}>
          <div style={{ height: '100%', background: '#f4f7f5', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: `linear-gradient(135deg,${formCaixa.tipo === 'Entrada' ? '#1c6f54,#2a9d78' : '#8b1a1a,#d64545'})`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{formCaixa.id ? '✏️ Editar lançamento' : formCaixa.tipo === 'Entrada' ? '📈 Nova entrada' : '📉 Nova saída'}</h2>
              <button onClick={() => setAbrirCaixa(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <form onSubmit={salvarCaixa}>
                <Campo label="Setor *"><select style={inputStyle} value={formCaixa.setor} onChange={e => setCaixa('setor', e.target.value)}><option value="">Selecione...</option>{SETORES.map(s => <option key={s} value={s}>{s}</option>)}</select></Campo>
                <Campo label="Tipo *"><select style={inputStyle} value={formCaixa.tipo} onChange={e => setCaixa('tipo', e.target.value)}><option value="Entrada">Entrada</option><option value="Saída">Saída</option></select></Campo>
                <Campo label="Categoria"><select style={inputStyle} value={formCaixa.categoria} onChange={e => setCaixa('categoria', e.target.value)}><option value="">Selecione...</option>{(formCaixa.tipo === 'Entrada' ? CATS_ENTRADA : CATS_SAIDA).map(c => <option key={c} value={c}>{c}</option>)}</select></Campo>
                <Campo label="Descrição *"><input style={inputStyle} value={formCaixa.descricao} onChange={e => setCaixa('descricao', e.target.value)} /></Campo>
                <Campo label="Valor (R$) *"><input style={inputStyle} type="number" step="0.01" placeholder="0,00" value={formCaixa.valor} onChange={e => setCaixa('valor', e.target.value)} /></Campo>
                <Campo label="Data *"><input style={inputStyle} type="date" value={formCaixa.data} onChange={e => setCaixa('data', e.target.value)} /></Campo>
                <Campo label="Forma de pagamento"><select style={inputStyle} value={formCaixa.forma} onChange={e => setCaixa('forma', e.target.value)}><option value="">Selecione...</option>{FORMAS.map(f => <option key={f} value={f}>{f}</option>)}</select></Campo>
                <Campo label="Status"><select style={inputStyle} value={formCaixa.status} onChange={e => setCaixa('status', e.target.value)}><option value="Pago">Pago</option><option value="Pendente">Pendente</option></select></Campo>
                <button type="submit" disabled={salvando} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: salvando ? '#7fcfb4' : '#2a9d78', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
                  {salvando ? 'Salvando...' : 'Salvar lançamento'}
                </button>
              </form>
            </div>
          </div>
        </IonModal>

        {/* Modal Nota Fiscal */}
        <IonModal isOpen={abrirNota} onDidDismiss={() => setAbrirNota(false)}>
          <div style={{ height: '100%', background: '#f4f7f5', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg,#1c6f54,#2a9d78)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{formNota.id ? '✏️ Editar NF' : '🧾 Nova nota fiscal'}</h2>
              <button onClick={() => setAbrirNota(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <form onSubmit={salvarNota}>
                <Campo label="Setor *"><select style={inputStyle} value={formNota.setor} onChange={e => setNota('setor', e.target.value)}><option value="">Selecione...</option>{SETORES.map(s => <option key={s} value={s}>{s}</option>)}</select></Campo>
                <Campo label="Número da NF *"><input style={inputStyle} value={formNota.numero} onChange={e => setNota('numero', e.target.value)} placeholder="Ex.: 000123" /></Campo>
                <Campo label="Tipo *"><select style={inputStyle} value={formNota.tipo} onChange={e => setNota('tipo', e.target.value)}><option value="Entrada">Entrada (a receber)</option><option value="Saída">Saída (a pagar)</option></select></Campo>
                <Campo label="Descrição *"><input style={inputStyle} value={formNota.descricao} onChange={e => setNota('descricao', e.target.value)} /></Campo>
                <Campo label="Cliente / Fornecedor"><input style={inputStyle} value={formNota.parte} onChange={e => setNota('parte', e.target.value)} /></Campo>
                <Campo label="Valor (R$) *"><input style={inputStyle} type="number" step="0.01" placeholder="0,00" value={formNota.valor} onChange={e => setNota('valor', e.target.value)} /></Campo>
                <Campo label="Data de emissão"><input style={inputStyle} type="date" value={formNota.data_emissao} onChange={e => setNota('data_emissao', e.target.value)} /></Campo>
                <Campo label="Data de vencimento"><input style={inputStyle} type="date" value={formNota.data_pagamento} onChange={e => setNota('data_pagamento', e.target.value)} /></Campo>
                <Campo label="Linha do boleto"><input style={inputStyle} value={formNota.boleto} onChange={e => setNota('boleto', e.target.value)} placeholder="Opcional" /></Campo>
                <Campo label="Status"><select style={inputStyle} value={formNota.status} onChange={e => setNota('status', e.target.value)}><option value="Pendente">Pendente</option><option value="Pago">Pago</option></select></Campo>
                <button type="submit" disabled={salvando} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: salvando ? '#7fcfb4' : '#2a9d78', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
                  {salvando ? 'Salvando...' : 'Salvar nota fiscal'}
                </button>
              </form>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
