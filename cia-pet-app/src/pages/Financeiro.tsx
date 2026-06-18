import { useEffect, useState, type FormEvent } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonText, IonSearchbar,
  IonBadge, IonButton, IonIcon, IonFab, IonFabButton, IonFabList, IonModal,
  IonInput, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol, IonCard,
  IonCardContent, IonSegment, IonSegmentButton,
} from '@ionic/react';
import {
  add, close, createOutline, trashOutline, checkmarkCircleOutline,
  arrowUpCircleOutline, arrowDownCircleOutline, downloadOutline,
} from 'ionicons/icons';
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
const FORMAS = ['Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Transferência', 'Boleto', 'Cheque'];
const CATEGORIAS_ENTRADA = ['Consultas', 'Cirurgias', 'Vacinas', 'Exames', 'Banho e Tosa', 'Produtos', 'Outras receitas'];
const CATEGORIAS_SAIDA = ['Folha de pagamento', 'Fornecedores', 'Aluguel', 'Energia/Água/Internet', 'Impostos', 'Equipamentos', 'Medicamentos/Insumos', 'Outras despesas'];

const VAZIO_CAIXA = { setor: '', tipo: 'Entrada', categoria: '', descricao: '', valor: '', data: hoje(), forma: '', status: 'Pago' };
const VAZIO_NOTA = { setor: '', numero: '', tipo: 'Entrada', descricao: '', parte: '', valor: '', data_emissao: hoje(), data_pagamento: '', boleto: '', status: 'Pendente' };

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

export default function Financeiro() {
  const [aba, setAba] = useState<'caixa' | 'notas'>('caixa');
  const [setor, setSetor] = useState('');
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [abrirCaixa, setAbrirCaixa] = useState(false);
  const [abrirNota, setAbrirNota] = useState(false);
  const [formCaixa, setFormCaixa] = useState<typeof VAZIO_CAIXA & { id?: string }>(VAZIO_CAIXA);
  const [formNota, setFormNota] = useState<typeof VAZIO_NOTA & { id?: string }>(VAZIO_NOTA);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [l, n] = await Promise.all([
      supabase.from('financeiro').select('*').order('data', { ascending: false }),
      supabase.from('notas_fiscais').select('*').order('data_emissao', { ascending: false }),
    ]);
    setLancamentos((l.data as Lancamento[]) ?? []);
    setNotas((n.data as Nota[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const lancsFiltrados = lancamentos
    .filter((m) => !setor || m.setor === setor)
    .filter((m) => !filtroTipo || m.tipo === filtroTipo)
    .filter((m) => !filtroStatus || m.status === filtroStatus)
    .filter((m) => { const t = busca.toLowerCase(); return !t || m.descricao.toLowerCase().includes(t) || (m.categoria ?? '').toLowerCase().includes(t); });

  const notasFiltradas = notas
    .filter((n) => !setor || n.setor === setor)
    .filter((n) => !filtroTipo || n.tipo === filtroTipo)
    .filter((n) => { if (!filtroStatus) return true; if (filtroStatus === 'Vencida') return notaVencida(n); return n.status === filtroStatus; })
    .filter((n) => { const t = busca.toLowerCase(); return !t || n.descricao.toLowerCase().includes(t) || n.numero.toLowerCase().includes(t) || (n.parte ?? '').toLowerCase().includes(t); });

  const base = lancamentos.filter((m) => !setor || m.setor === setor);
  const pagos = base.filter((m) => m.status === 'Pago');
  const totalEntradas = pagos.filter((m) => m.tipo === 'Entrada').reduce((s, m) => s + Number(m.valor), 0);
  const totalSaidas = pagos.filter((m) => m.tipo === 'Saída').reduce((s, m) => s + Number(m.valor), 0);
  const entradasMes = pagos.filter((m) => m.tipo === 'Entrada' && ehMesAtual(m.data)).reduce((s, m) => s + Number(m.valor), 0);
  const saidasMes = pagos.filter((m) => m.tipo === 'Saída' && ehMesAtual(m.data)).reduce((s, m) => s + Number(m.valor), 0);
  const baseNotas = notas.filter((n) => !setor || n.setor === setor);
  const aReceber = baseNotas.filter((n) => n.tipo === 'Entrada' && n.status === 'Pendente').reduce((s, n) => s + Number(n.valor), 0);
  const aPagar = baseNotas.filter((n) => n.tipo === 'Saída' && n.status === 'Pendente').reduce((s, n) => s + Number(n.valor), 0);
  const vencidas = baseNotas.filter(notaVencida).length;

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
    if (!formNota.numero.trim()) { window.alert('Informe o número da NF.'); return; }
    if (!formNota.descricao.trim()) { window.alert('Informe a descrição.'); return; }
    if (!formNota.valor || isNaN(parseFloat(formNota.valor))) { window.alert('Informe o valor.'); return; }
    setSalvando(true);
    const dados = { setor: formNota.setor, numero: formNota.numero, tipo: formNota.tipo, descricao: formNota.descricao, parte: formNota.parte || null, valor: parseFloat(formNota.valor), data_emissao: formNota.data_emissao || null, data_pagamento: formNota.data_pagamento || null, boleto: formNota.boleto || null, status: formNota.status };
    const resp = formNota.id ? await supabase.from('notas_fiscais').update(dados).eq('id', formNota.id) : await supabase.from('notas_fiscais').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro: ' + resp.error.message); return; }
    setAbrirNota(false); carregar();
  }

  async function darBaixaNota(n: Nota) {
    if (!window.confirm(`Dar baixa na NF ${n.numero} e lançar no caixa automaticamente?`)) return;
    const dataPag = n.data_pagamento || hoje();
    const [r1, r2] = await Promise.all([
      supabase.from('notas_fiscais').update({ status: 'Pago', data_pagamento: dataPag }).eq('id', n.id),
      supabase.from('financeiro').insert({ setor: n.setor, tipo: n.tipo, categoria: n.tipo === 'Entrada' ? 'Outras receitas' : 'Fornecedores', descricao: `NF ${n.numero} — ${n.descricao}`, valor: Number(n.valor), data: dataPag, forma: n.boleto ? 'Boleto' : 'Transferência', status: 'Pago' }),
    ]);
    if (r1.error || r2.error) { window.alert('Erro ao dar baixa.'); return; }
    window.alert(`NF ${n.numero} baixada e lançada no caixa automaticamente.`);
    carregar();
  }

  async function excluirLanc(m: Lancamento) {
    if (!window.confirm('Excluir este lançamento?')) return;
    await supabase.from('financeiro').delete().eq('id', m.id); carregar();
  }
  async function excluirNota(n: Nota) {
    if (!window.confirm('Excluir esta nota fiscal?')) return;
    await supabase.from('notas_fiscais').delete().eq('id', n.id); carregar();
  }

  function exportar() {
    const setorLabel = setor || 'Consolidado';
    const lancBase = setor ? lancamentos.filter((m) => m.setor === setor) : lancamentos;
    const notasBase = setor ? notas.filter((n) => n.setor === setor) : notas;
    const resumo = [
      ['Relatório Financeiro — Cia Pet'], ['Setor', setorLabel], ['Gerado em', new Date().toLocaleString('pt-BR')], [],
      ['FLUXO DE CAIXA'], ['Entradas pagas (R$)', totalEntradas], ['Saídas pagas (R$)', totalSaidas], ['Saldo (R$)', totalEntradas - totalSaidas], [],
      ['NOTAS FISCAIS'], ['A receber (R$)', aReceber], ['A pagar (R$)', aPagar], ['Contas vencidas', vencidas],
    ];
    const caixaAOA = [
      ['Data', 'Setor', 'Tipo', 'Categoria', 'Descrição', 'Forma', 'Valor (R$)', 'Status'],
      ...lancBase.map((m) => [dataBR(m.data), m.setor, m.tipo, m.categoria ?? '', m.descricao, m.forma ?? '', Number(m.valor), m.status]),
    ];
    const notasAOA = [
      ['Nº NF', 'Setor', 'Tipo', 'Descrição', 'Parte', 'Emissão', 'Pagamento', 'Boleto', 'Valor (R$)', 'Status'],
      ...notasBase.map((n) => [n.numero, n.setor, n.tipo, n.descricao, n.parte ?? '', dataBR(n.data_emissao), dataBR(n.data_pagamento), n.boleto ?? '', Number(n.valor), notaVencida(n) ? 'Vencida' : n.status]),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), 'Resumo');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(caixaAOA), 'Fluxo de Caixa');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(notasAOA), 'Notas Fiscais');
    XLSX.writeFile(wb, `Financeiro_${setorLabel.replace(/[^\wÀ-ÿ]+/g, '_')}_${hoje()}.xlsx`);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Financeiro</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={exportar} title="Exportar Excel">
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar color="primary">
          <IonSegment value={aba} onIonChange={(e) => { setAba(e.detail.value as 'caixa' | 'notas'); setBusca(''); setFiltroTipo(''); setFiltroStatus(''); }}>
            <IonSegmentButton value="caixa">Fluxo de Caixa</IonSegmentButton>
            <IonSegmentButton value="notas">Notas Fiscais</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Filtro setor */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {['', ...SETORES].map((s) => (
            <IonButton key={s} size="small" fill={setor === s ? 'solid' : 'outline'} onClick={() => setSetor(s)}>
              {s || 'Consolidado'}
            </IonButton>
          ))}
        </div>

        {/* Estatísticas */}
        {aba === 'caixa' ? (
          <IonGrid className="ion-no-padding ion-margin-bottom">
            <IonRow>
              {[
                { label: 'Saldo total', valor: moeda(totalEntradas - totalSaidas), cor: (totalEntradas - totalSaidas) >= 0 ? 'success' : 'danger' },
                { label: 'Entradas (mês)', valor: moeda(entradasMes), cor: 'success' },
                { label: 'Saídas (mês)', valor: moeda(saidasMes), cor: 'danger' },
                { label: 'Resultado (mês)', valor: moeda(entradasMes - saidasMes), cor: (entradasMes - saidasMes) >= 0 ? 'success' : 'danger' },
              ].map(({ label, valor, cor }) => (
                <IonCol key={label} size="6" sizeMd="3">
                  <IonCard style={{ margin: '4px' }}>
                    <IonCardContent style={{ textAlign: 'center', padding: '10px 6px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: `var(--ion-color-${cor})` }}>{valor}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{label}</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        ) : (
          <IonGrid className="ion-no-padding ion-margin-bottom">
            <IonRow>
              {[
                { label: 'A receber', valor: moeda(aReceber), cor: 'success' },
                { label: 'A pagar', valor: moeda(aPagar), cor: 'danger' },
                { label: 'Vencidas', valor: vencidas, cor: vencidas > 0 ? 'danger' : 'medium' },
                { label: 'Total notas', valor: baseNotas.length, cor: 'primary' },
              ].map(({ label, valor, cor }) => (
                <IonCol key={label} size="6" sizeMd="3">
                  <IonCard style={{ margin: '4px' }}>
                    <IonCardContent style={{ textAlign: 'center', padding: '10px 6px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: `var(--ion-color-${cor})` }}>{valor}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{label}</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

        <IonSearchbar placeholder="Buscar..." value={busca} onIonInput={(e) => setBusca(e.detail.value ?? '')} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <IonSelect style={{ flex: 1 }} label="Tipo" labelPlacement="stacked" placeholder="Todos" value={filtroTipo} onIonChange={(e) => setFiltroTipo(e.detail.value ?? '')}>
            <IonSelectOption value="">Todos</IonSelectOption>
            <IonSelectOption value="Entrada">Entrada</IonSelectOption>
            <IonSelectOption value="Saída">Saída</IonSelectOption>
          </IonSelect>
          <IonSelect style={{ flex: 1 }} label="Status" labelPlacement="stacked" placeholder="Todos" value={filtroStatus} onIonChange={(e) => setFiltroStatus(e.detail.value ?? '')}>
            <IonSelectOption value="">Todos</IonSelectOption>
            <IonSelectOption value="Pago">Pago</IonSelectOption>
            <IonSelectOption value="Pendente">Pendente</IonSelectOption>
            {aba === 'notas' && <IonSelectOption value="Vencida">Vencida</IonSelectOption>}
          </IonSelect>
        </div>

        {/* Lista */}
        {carregando ? <IonSpinner /> : aba === 'caixa' ? (
          lancsFiltrados.length === 0
            ? <IonText color="medium"><p className="ion-padding">Nenhuma movimentação encontrada.</p></IonText>
            : <IonList>
              {lancsFiltrados.map((m) => (
                <IonItem key={m.id} lines="full">
                  <IonLabel className="ion-text-wrap">
                    <h2>{m.descricao}</h2>
                    <p>{dataBR(m.data)} · {m.setor} · {m.categoria ?? '—'}{m.forma ? ` · ${m.forma}` : ''}</p>
                    <p style={{ fontWeight: 700, color: m.tipo === 'Entrada' ? 'var(--ion-color-success)' : 'var(--ion-color-danger)' }}>
                      {m.tipo === 'Entrada' ? '+' : '−'} {moeda(Number(m.valor))}
                    </p>
                  </IonLabel>
                  <IonBadge color={m.status === 'Pago' ? 'success' : 'warning'}>{m.status}</IonBadge>
                  {m.status === 'Pendente' && (
                    <IonButton fill="clear" color="success" slot="end" title="Marcar como pago"
                      onClick={async () => { await supabase.from('financeiro').update({ status: 'Pago' }).eq('id', m.id); carregar(); }}>
                      <IonIcon slot="icon-only" icon={checkmarkCircleOutline} />
                    </IonButton>
                  )}
                  <IonButton fill="clear" slot="end" onClick={() => { setFormCaixa({ id: m.id, setor: m.setor, tipo: m.tipo, categoria: m.categoria ?? '', descricao: m.descricao, valor: String(m.valor), data: m.data, forma: m.forma ?? '', status: m.status }); setAbrirCaixa(true); }}>
                    <IonIcon slot="icon-only" icon={createOutline} />
                  </IonButton>
                  <IonButton fill="clear" color="danger" slot="end" onClick={() => excluirLanc(m)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
        ) : (
          notasFiltradas.length === 0
            ? <IonText color="medium"><p className="ion-padding">Nenhuma nota fiscal encontrada.</p></IonText>
            : <IonList>
              {notasFiltradas.map((n) => {
                const vencida = notaVencida(n);
                return (
                  <IonItem key={n.id} lines="full">
                    <IonLabel className="ion-text-wrap">
                      <h2>NF {n.numero} · {n.descricao}</h2>
                      <p>{n.setor}{n.parte ? ` · ${n.parte}` : ''}</p>
                      <p>Emissão: {dataBR(n.data_emissao)} · Pagto: {dataBR(n.data_pagamento)}</p>
                      {n.boleto && <p style={{ fontSize: '0.78rem' }}>Boleto: {n.boleto}</p>}
                      <p style={{ fontWeight: 700, color: n.tipo === 'Entrada' ? 'var(--ion-color-success)' : 'var(--ion-color-danger)' }}>
                        {moeda(Number(n.valor))}
                      </p>
                    </IonLabel>
                    <IonBadge color={vencida ? 'danger' : n.status === 'Pago' ? 'success' : 'warning'}>
                      {vencida ? 'Vencida' : n.status}
                    </IonBadge>
                    {n.status === 'Pendente' && (
                      <IonButton fill="clear" color="success" slot="end" title="Dar baixa" onClick={() => darBaixaNota(n)}>
                        <IonIcon slot="icon-only" icon={checkmarkCircleOutline} />
                      </IonButton>
                    )}
                    <IonButton fill="clear" slot="end" onClick={() => { setFormNota({ id: n.id, setor: n.setor, numero: n.numero, tipo: n.tipo, descricao: n.descricao, parte: n.parte ?? '', valor: String(n.valor), data_emissao: n.data_emissao ?? '', data_pagamento: n.data_pagamento ?? '', boleto: n.boleto ?? '', status: n.status }); setAbrirNota(true); }}>
                      <IonIcon slot="icon-only" icon={createOutline} />
                    </IonButton>
                    <IonButton fill="clear" color="danger" slot="end" onClick={() => excluirNota(n)}>
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </IonItem>
                );
              })}
            </IonList>
        )}

        {/* FAB */}
        {aba === 'caixa' ? (
          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton><IonIcon icon={add} /></IonFabButton>
            <IonFabList side="top">
              <IonFabButton color="success" title="Nova entrada" onClick={() => { setFormCaixa({ ...VAZIO_CAIXA, tipo: 'Entrada', setor, data: hoje() }); setAbrirCaixa(true); }}>
                <IonIcon icon={arrowDownCircleOutline} />
              </IonFabButton>
              <IonFabButton color="danger" title="Nova saída" onClick={() => { setFormCaixa({ ...VAZIO_CAIXA, tipo: 'Saída', setor, data: hoje() }); setAbrirCaixa(true); }}>
                <IonIcon icon={arrowUpCircleOutline} />
              </IonFabButton>
            </IonFabList>
          </IonFab>
        ) : (
          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton onClick={() => { setFormNota({ ...VAZIO_NOTA, setor, data_emissao: hoje() }); setAbrirNota(true); }}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Modal Caixa */}
        <IonModal isOpen={abrirCaixa} onDidDismiss={() => setAbrirCaixa(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>{formCaixa.id ? 'Editar lançamento' : formCaixa.tipo === 'Entrada' ? 'Nova entrada' : 'Nova saída'}</IonTitle>
              <IonButtons slot="end"><IonButton onClick={() => setAbrirCaixa(false)}><IonIcon slot="icon-only" icon={close} /></IonButton></IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={salvarCaixa}>
              <IonSelect className="ion-margin-bottom" label="Setor *" labelPlacement="stacked" placeholder="Selecione" value={formCaixa.setor} onIonChange={(e) => setCaixa('setor', e.detail.value)}>
                {SETORES.map((s) => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
              </IonSelect>
              <IonSelect className="ion-margin-bottom" label="Tipo *" labelPlacement="stacked" value={formCaixa.tipo} onIonChange={(e) => setCaixa('tipo', e.detail.value)}>
                <IonSelectOption value="Entrada">Entrada</IonSelectOption>
                <IonSelectOption value="Saída">Saída</IonSelectOption>
              </IonSelect>
              <IonSelect className="ion-margin-bottom" label="Categoria" labelPlacement="stacked" placeholder="Selecione" value={formCaixa.categoria} onIonChange={(e) => setCaixa('categoria', e.detail.value)}>
                {(formCaixa.tipo === 'Entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA).map((c) => <IonSelectOption key={c} value={c}>{c}</IonSelectOption>)}
              </IonSelect>
              <IonInput className="ion-margin-bottom" label="Descrição *" labelPlacement="stacked" value={formCaixa.descricao} onIonInput={(e) => setCaixa('descricao', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Valor (R$) *" labelPlacement="stacked" type="number" inputmode="decimal" placeholder="0,00" value={formCaixa.valor} onIonInput={(e) => setCaixa('valor', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Data *" labelPlacement="stacked" type="date" value={formCaixa.data} onIonInput={(e) => setCaixa('data', e.detail.value ?? '')} />
              <IonSelect className="ion-margin-bottom" label="Forma de pagamento" labelPlacement="stacked" placeholder="Selecione" value={formCaixa.forma} onIonChange={(e) => setCaixa('forma', e.detail.value)}>
                {FORMAS.map((f) => <IonSelectOption key={f} value={f}>{f}</IonSelectOption>)}
              </IonSelect>
              <IonSelect className="ion-margin-bottom" label="Status" labelPlacement="stacked" value={formCaixa.status} onIonChange={(e) => setCaixa('status', e.detail.value)}>
                <IonSelectOption value="Pago">Pago</IonSelectOption>
                <IonSelectOption value="Pendente">Pendente</IonSelectOption>
              </IonSelect>
              <IonButton type="submit" expand="block" className="ion-margin-top" disabled={salvando}>
                {salvando ? <IonSpinner name="crescent" /> : 'Salvar lançamento'}
              </IonButton>
            </form>
          </IonContent>
        </IonModal>

        {/* Modal Nota Fiscal */}
        <IonModal isOpen={abrirNota} onDidDismiss={() => setAbrirNota(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>{formNota.id ? 'Editar nota fiscal' : 'Nova nota fiscal'}</IonTitle>
              <IonButtons slot="end"><IonButton onClick={() => setAbrirNota(false)}><IonIcon slot="icon-only" icon={close} /></IonButton></IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={salvarNota}>
              <IonSelect className="ion-margin-bottom" label="Setor *" labelPlacement="stacked" placeholder="Selecione" value={formNota.setor} onIonChange={(e) => setNota('setor', e.detail.value)}>
                {SETORES.map((s) => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
              </IonSelect>
              <IonInput className="ion-margin-bottom" label="Número da NF *" labelPlacement="stacked" placeholder="Ex.: 000123" value={formNota.numero} onIonInput={(e) => setNota('numero', e.detail.value ?? '')} />
              <IonSelect className="ion-margin-bottom" label="Tipo *" labelPlacement="stacked" value={formNota.tipo} onIonChange={(e) => setNota('tipo', e.detail.value)}>
                <IonSelectOption value="Entrada">Entrada (a receber)</IonSelectOption>
                <IonSelectOption value="Saída">Saída (a pagar)</IonSelectOption>
              </IonSelect>
              <IonInput className="ion-margin-bottom" label="Descrição *" labelPlacement="stacked" value={formNota.descricao} onIonInput={(e) => setNota('descricao', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Cliente / Fornecedor" labelPlacement="stacked" value={formNota.parte} onIonInput={(e) => setNota('parte', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Valor (R$) *" labelPlacement="stacked" type="number" inputmode="decimal" placeholder="0,00" value={formNota.valor} onIonInput={(e) => setNota('valor', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Data de emissão" labelPlacement="stacked" type="date" value={formNota.data_emissao} onIonInput={(e) => setNota('data_emissao', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Data de vencimento / pagamento" labelPlacement="stacked" type="date" value={formNota.data_pagamento} onIonInput={(e) => setNota('data_pagamento', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Linha do boleto" labelPlacement="stacked" placeholder="Opcional" value={formNota.boleto} onIonInput={(e) => setNota('boleto', e.detail.value ?? '')} />
              <IonSelect className="ion-margin-bottom" label="Status" labelPlacement="stacked" value={formNota.status} onIonChange={(e) => setNota('status', e.detail.value)}>
                <IonSelectOption value="Pendente">Pendente</IonSelectOption>
                <IonSelectOption value="Pago">Pago</IonSelectOption>
              </IonSelect>
              <IonButton type="submit" expand="block" className="ion-margin-top" disabled={salvando}>
                {salvando ? <IonSpinner name="crescent" /> : 'Salvar nota fiscal'}
              </IonButton>
            </form>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
