import { useEffect, useState, type FormEvent } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonSpinner, IonModal,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

interface Insumo {
  id: string; nome: string; categoria: string; unidade: string;
  quantidade: number; minimo: number; validade: string | null; observacao: string | null;
}

const CATEGORIAS = ['Medicamentos', 'Vacinas', 'Materiais Cirúrgicos', 'Higiene / Cosméticos', 'Alimentação', 'Administrativo', 'Outros'];
const CAT_EMOJI: Record<string, string> = {
  'Medicamentos': '💊', 'Vacinas': '💉', 'Materiais Cirúrgicos': '🔬',
  'Higiene / Cosméticos': '🧴', 'Alimentação': '🍖', 'Administrativo': '📋', 'Outros': '📦',
};

const VAZIO = { nome: '', categoria: '', unidade: '', quantidade: '0', minimo: '0', validade: '', observacao: '' };

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

function diasParaVencer(validade: string | null): number | null {
  if (!validade) return null;
  return Math.ceil((new Date(validade).getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5);
}

function situacao(i: Insumo): 'vencido' | 'vencendo' | 'baixo' | 'ok' {
  const dias = diasParaVencer(i.validade);
  if (dias !== null && dias < 0) return 'vencido';
  if (dias !== null && dias <= 30) return 'vencendo';
  if (i.quantidade <= i.minimo) return 'baixo';
  return 'ok';
}

const STATUS_BADGE: Record<string, { bg: string; cor: string; label: (i: Insumo) => string }> = {
  vencido:  { bg: '#fdecea', cor: '#d64545', label: () => '❌ Vencido' },
  vencendo: { bg: '#fff8ec', cor: '#e07b39', label: (i) => `⚠️ Vence em ${diasParaVencer(i.validade)}d` },
  baixo:    { bg: '#fff8ec', cor: '#e07b39', label: () => '📉 Estoque baixo' },
  ok:       { bg: '#e3f3eb', cor: '#2a9d78', label: () => '✅ OK' },
};

function Stat({ label, valor, cor }: { label: string; valor: string | number; cor: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120, background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: cor }}>{valor}</div>
      <div style={{ fontSize: '.78rem', color: '#6b7f79', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function Estoque() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [busca, setBusca] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase.from('insumos').select('*').order('nome');
    setInsumos((data as Insumo[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const set = (campo: string, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { window.alert('Informe o nome.'); return; }
    if (!form.categoria) { window.alert('Selecione a categoria.'); return; }
    if (!form.unidade.trim()) { window.alert('Informe a unidade.'); return; }
    setSalvando(true);
    const dados = { nome: form.nome, categoria: form.categoria, unidade: form.unidade, quantidade: parseInt(form.quantidade) || 0, minimo: parseInt(form.minimo) || 0, validade: form.validade || null, observacao: form.observacao || null };
    const resp = form.id ? await supabase.from('insumos').update(dados).eq('id', form.id) : await supabase.from('insumos').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro: ' + resp.error.message); return; }
    setAberto(false); carregar();
  }

  async function excluir(i: Insumo) {
    if (!window.confirm(`Excluir "${i.nome}"?`)) return;
    const { error } = await supabase.from('insumos').delete().eq('id', i.id);
    if (error) window.alert('Erro: ' + error.message);
    else carregar();
  }

  async function movimentar(i: Insumo, tipo: 'entrada' | 'saida') {
    const label = tipo === 'entrada' ? 'Entrada (repor estoque)' : 'Saída (dar baixa)';
    const qtdStr = window.prompt(`${label}\n${i.nome} — atual: ${i.quantidade} ${i.unidade}\n\nQuantidade:`, '1');
    if (qtdStr === null) return;
    const qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd <= 0) { window.alert('Quantidade inválida.'); return; }
    const nova = tipo === 'entrada' ? i.quantidade + qtd : i.quantidade - qtd;
    if (nova < 0) { window.alert('Estoque insuficiente.'); return; }
    const { error } = await supabase.from('insumos').update({ quantidade: nova }).eq('id', i.id);
    if (error) window.alert('Erro: ' + error.message);
    else carregar();
  }

  const filtrados = insumos.filter((i) => {
    const t = busca.toLowerCase();
    return (!catFiltro || i.categoria === catFiltro) &&
      (i.nome.toLowerCase().includes(t) || (i.observacao ?? '').toLowerCase().includes(t));
  });

  const totalBaixo   = insumos.filter((i) => situacao(i) === 'baixo').length;
  const totalAlerta  = insumos.filter((i) => { const s = situacao(i); return s === 'vencido' || s === 'vencendo'; }).length;
  const totalCats    = new Set(insumos.map((i) => i.categoria)).size;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Estoque / Insumos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#f4f7f5' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>

          {/* Cards resumo */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <Stat label="Total de itens" valor={insumos.length} cor="#2a9d78" />
            <Stat label="Estoque baixo" valor={totalBaixo} cor={totalBaixo > 0 ? '#e07b39' : '#6b7f79'} />
            <Stat label="Validade / Vencido" valor={totalAlerta} cor={totalAlerta > 0 ? '#d64545' : '#6b7f79'} />
            <Stat label="Categorias" valor={totalCats} cor="#5b6af5" />
          </div>

          {/* Busca + botão */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <input
              placeholder="🔍 Buscar insumo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => { setForm(VAZIO); setAberto(true); }} style={{
              padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#2a9d78', color: '#fff', fontWeight: 700, fontSize: '.9rem',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>+ Novo item</button>
          </div>

          {/* Filtro categoria */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {['', ...CATEGORIAS].map((c) => (
              <button key={c} onClick={() => setCatFiltro(c)} style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: catFiltro === c ? '#2a9d78' : '#fff',
                color: catFiltro === c ? '#fff' : '#5f6f69',
                fontWeight: catFiltro === c ? 700 : 400, fontSize: '.82rem',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)', fontFamily: 'inherit',
              }}>
                {c ? `${CAT_EMOJI[c]} ${c}` : 'Todos'}
              </button>
            ))}
          </div>

          {/* Lista */}
          {carregando ? (
            <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7f79' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <p style={{ margin: 0 }}>Nenhum insumo encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtrados.map((i) => {
                const sit = situacao(i);
                const badge = STATUS_BADGE[sit];
                const pct = i.minimo > 0 ? Math.min(100, Math.round((i.quantidade / (i.minimo * 2)) * 100)) : 100;
                return (
                  <div key={i.id} style={{
                    background: '#fff', borderRadius: 14, padding: '16px 20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  }}>
                    {/* Ícone categoria */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: '#f0f4f2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                    }}>
                      {CAT_EMOJI[i.categoria] ?? '📦'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.97rem', marginBottom: 2 }}>{i.nome}</div>
                      <div style={{ color: '#6b7f79', fontSize: '.8rem' }}>{i.categoria}</div>
                      {i.observacao && <div style={{ color: '#a0aea9', fontSize: '.75rem', marginTop: 2 }}>{i.observacao}</div>}
                      {/* Barra de estoque */}
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: '#f0f4f2', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: sit === 'ok' ? '#2a9d78' : sit === 'baixo' ? '#e07b39' : '#d64545', borderRadius: 4, transition: 'width .3s' }} />
                        </div>
                        <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#1a2e27', whiteSpace: 'nowrap' }}>
                          {i.quantidade} <span style={{ color: '#6b7f79', fontWeight: 400 }}>{i.unidade}</span>
                        </span>
                        <span style={{ fontSize: '.75rem', color: '#6b7f79' }}>/ mín. {i.minimo}</span>
                      </div>
                    </div>

                    {/* Badge status */}
                    <span style={{ background: badge.bg, color: badge.cor, borderRadius: 8, padding: '5px 12px', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {badge.label(i)}
                    </span>

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => movimentar(i, 'entrada')} title="Entrada" style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e3f3eb', background: '#e3f3eb', color: '#2a9d78', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 700 }}>＋</button>
                      <button onClick={() => movimentar(i, 'saida')} title="Saída" style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #fff8ec', background: '#fff8ec', color: '#e07b39', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 700 }}>－</button>
                      <button onClick={() => { setForm({ id: i.id, nome: i.nome, categoria: i.categoria, unidade: i.unidade, quantidade: String(i.quantidade), minimo: String(i.minimo), validade: i.validade ?? '', observacao: i.observacao ?? '' }); setAberto(true); }} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e4ece8', background: '#fff', color: '#1a2e27', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.82rem' }}>✏️</button>
                      <button onClick={() => excluir(i)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #fdecea', background: '#fdecea', color: '#d64545', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.82rem' }}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        <IonModal isOpen={aberto} onDidDismiss={() => setAberto(false)}>
          <div style={{ height: '100%', background: '#f4f7f5', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg,#1c6f54,#2a9d78)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{form.id ? '✏️ Editar insumo' : '📦 Novo insumo'}</h2>
              <button onClick={() => setAberto(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <form onSubmit={salvar}>
                <Campo label="Nome do insumo *"><input style={inputStyle} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex.: Amoxicilina 500mg" /></Campo>
                <Campo label="Categoria *">
                  <select style={inputStyle} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                    <option value="">Selecione...</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                  </select>
                </Campo>
                <Campo label="Unidade *"><input style={inputStyle} value={form.unidade} onChange={e => set('unidade', e.target.value)} placeholder="Ex.: un, ml, kg, caixa" /></Campo>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><Campo label="Qtd. em estoque"><input style={inputStyle} type="number" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} /></Campo></div>
                  <div style={{ flex: 1 }}><Campo label="Qtd. mínima (alerta)"><input style={inputStyle} type="number" value={form.minimo} onChange={e => set('minimo', e.target.value)} /></Campo></div>
                </div>
                <Campo label="Validade"><input style={inputStyle} type="date" value={form.validade} onChange={e => set('validade', e.target.value)} /></Campo>
                <Campo label="Observação"><textarea style={{ ...inputStyle, minHeight: 68, resize: 'vertical' }} value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Ex.: Manter refrigerado" /></Campo>
                <button type="submit" disabled={salvando} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: salvando ? '#7fcfb4' : '#2a9d78', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
                  {salvando ? 'Salvando...' : 'Salvar insumo'}
                </button>
              </form>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
