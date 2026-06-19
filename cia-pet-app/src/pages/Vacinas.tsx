import { useEffect, useState, type FormEvent } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonSpinner, IonModal,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

interface VacinaRow {
  id: string;
  pet_nome: string;
  tutor_nome: string;
  tutor_telefone: string | null;
  vacina: string;
  data_aplicacao: string;
  proxima_dose: string | null;
  observacao: string | null;
}

const VAZIO: Partial<VacinaRow> = {
  pet_nome: '', tutor_nome: '', tutor_telefone: '', vacina: '',
  data_aplicacao: '', proxima_dose: '', observacao: '',
};

// Vacinas comuns para sugestão rápida
const VACINAS_COMUNS = [
  'V8 (Óctupla)', 'V10 (Déctupla)', 'Antirrábica', 'Gripe canina',
  'Giárdia', 'Leishmaniose', 'V3 (Felina)', 'V4 (Felina)', 'V5 (Felina)',
];

type StatusKey = 'atrasada' | 'breve' | 'emdia' | 'sem';

function statusDose(proxima: string | null): { label: string; cor: string; bg: string; key: StatusKey } {
  if (!proxima) return { label: 'Sem próxima dose', cor: '#6b7f79', bg: '#f0f4f2', key: 'sem' };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const p = new Date(proxima + 'T00:00:00');
  const dias = Math.round((p.getTime() - hoje.getTime()) / 86400000);
  if (dias < 0) return { label: `Atrasada há ${Math.abs(dias)}d`, cor: '#d64545', bg: '#fdecea', key: 'atrasada' };
  if (dias === 0) return { label: 'Vence hoje', cor: '#d64545', bg: '#fdecea', key: 'atrasada' };
  if (dias <= 30) return { label: `Em ${dias}d`, cor: '#e07b39', bg: '#fff8ec', key: 'breve' };
  return { label: 'Em dia', cor: '#2a9d78', bg: '#e3f3eb', key: 'emdia' };
}

function dataBR(iso: string | null): string {
  if (!iso) return '—';
  return iso.split('-').reverse().join('/');
}

function linkWhatsApp(tel: string | null): string | null {
  if (!tel) return null;
  const num = tel.replace(/\D/g, '');
  if (num.length < 10) return null;
  return `https://wa.me/55${num}`;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #e4ece8', fontSize: '.95rem', color: '#1a2e27',
  background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
};

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#1a2e27', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const FILTROS: { chave: StatusKey | 'todas'; rotulo: string }[] = [
  { chave: 'todas',    rotulo: '💉 Todas' },
  { chave: 'atrasada', rotulo: '🔴 Atrasadas' },
  { chave: 'breve',    rotulo: '🟡 Em breve' },
  { chave: 'emdia',    rotulo: '🟢 Em dia' },
];

export default function Vacinas() {
  const [vacinas, setVacinas] = useState<VacinaRow[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<StatusKey | 'todas'>('todas');
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<VacinaRow>>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase
      .from('vacinas')
      .select('id, pet_nome, tutor_nome, tutor_telefone, vacina, data_aplicacao, proxima_dose, observacao')
      .order('proxima_dose', { ascending: true, nullsFirst: false });
    setVacinas((data as VacinaRow[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const set = (campo: keyof VacinaRow, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.pet_nome?.trim()) { window.alert('Informe o nome do pet.'); return; }
    if (!form.tutor_nome?.trim()) { window.alert('Informe o nome do tutor.'); return; }
    if (!form.vacina?.trim()) { window.alert('Informe a vacina aplicada.'); return; }
    if (!form.data_aplicacao) { window.alert('Informe a data de aplicação.'); return; }
    setSalvando(true);
    const dados = {
      pet_nome: form.pet_nome, tutor_nome: form.tutor_nome,
      tutor_telefone: form.tutor_telefone || null, vacina: form.vacina,
      data_aplicacao: form.data_aplicacao, proxima_dose: form.proxima_dose || null,
      observacao: form.observacao || null,
    };
    const resp = form.id
      ? await supabase.from('vacinas').update(dados).eq('id', form.id)
      : await supabase.from('vacinas').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro ao salvar: ' + resp.error.message); return; }
    setAberto(false);
    carregar();
  }

  async function excluir(v: VacinaRow) {
    if (!window.confirm(`Excluir o registro de ${v.vacina} do pet ${v.pet_nome}?`)) return;
    const { error } = await supabase.from('vacinas').delete().eq('id', v.id);
    if (error) window.alert('Erro ao excluir: ' + error.message);
    carregar();
  }

  const filtradas = vacinas.filter((v) => {
    const t = busca.toLowerCase();
    const casaBusca =
      v.pet_nome.toLowerCase().includes(t) ||
      v.tutor_nome.toLowerCase().includes(t) ||
      v.vacina.toLowerCase().includes(t) ||
      (v.tutor_telefone ?? '').includes(t);
    const casaFiltro = filtro === 'todas' || statusDose(v.proxima_dose).key === filtro;
    return casaBusca && casaFiltro;
  });

  // Resumo
  const totalAtrasadas = vacinas.filter(v => statusDose(v.proxima_dose).key === 'atrasada').length;
  const totalBreve     = vacinas.filter(v => statusDose(v.proxima_dose).key === 'breve').length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Vacinas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#f4f7f5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

          {/* Resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { rotulo: 'Total', valor: vacinas.length, cor: '#1a2e27', emoji: '💉' },
              { rotulo: 'Atrasadas', valor: totalAtrasadas, cor: '#d64545', emoji: '🔴' },
              { rotulo: 'Em breve', valor: totalBreve, cor: '#e07b39', emoji: '🟡' },
            ].map((c) => (
              <div key={c.rotulo} style={{
                background: '#fff', borderRadius: 14, padding: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,.06)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{c.emoji}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.cor, lineHeight: 1 }}>{c.valor}</div>
                <div style={{ fontSize: '.74rem', color: '#6b7f79', marginTop: 4 }}>{c.rotulo}</div>
              </div>
            ))}
          </div>

          {/* Busca + botão */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <input
              placeholder="🔍 Buscar por pet, tutor, vacina ou telefone..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => { setForm(VAZIO); setAberto(true); }} style={{
              padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#2a9d78', color: '#fff', fontWeight: 700, fontSize: '.9rem',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              + Nova vacina
            </button>
          </div>

          {/* Filtros por status */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {FILTROS.map((f) => {
              const ativo = filtro === f.chave;
              return (
                <button key={f.chave} onClick={() => setFiltro(f.chave)} style={{
                  padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                  border: ativo ? '1.5px solid #2a9d78' : '1.5px solid #e4ece8',
                  background: ativo ? '#2a9d78' : '#fff',
                  color: ativo ? '#fff' : '#5f6f69', fontWeight: 600,
                  fontSize: '.82rem', fontFamily: 'inherit',
                }}>{f.rotulo}</button>
              );
            })}
          </div>

          {/* Lista */}
          {carregando ? (
            <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
          ) : filtradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7f79' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💉</div>
              <p style={{ margin: 0 }}>Nenhuma vacina encontrada.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtradas.map((v) => {
                const st = statusDose(v.proxima_dose);
                const wpp = linkWhatsApp(v.tutor_telefone);
                return (
                  <div key={v.id} style={{
                    background: '#fff', borderRadius: 14, padding: '16px 20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                    borderLeft: `4px solid ${st.cor}`,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: '#e3f3eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, flexShrink: 0,
                    }}>💉</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.97rem', marginBottom: 3 }}>
                        {v.pet_nome}
                        <span style={{
                          marginLeft: 8, fontSize: '.72rem', fontWeight: 600,
                          background: '#f0f4f2', color: '#5f6f69',
                          borderRadius: 6, padding: '2px 8px',
                        }}>{v.vacina}</span>
                      </div>
                      <div style={{ color: '#6b7f79', fontSize: '.82rem' }}>
                        👤 {v.tutor_nome}
                        {wpp ? (
                          <> · <a href={wpp} target="_blank" rel="noreferrer" style={{ color: '#2a9d78', textDecoration: 'none', fontWeight: 600 }}>
                            📱 {v.tutor_telefone}
                          </a></>
                        ) : v.tutor_telefone ? ` · 📱 ${v.tutor_telefone}` : ''}
                      </div>
                      <div style={{ color: '#6b7f79', fontSize: '.78rem', marginTop: 2 }}>
                        Última: <strong style={{ color: '#1a2e27' }}>{dataBR(v.data_aplicacao)}</strong>
                        {' · '}Próxima: <strong style={{ color: '#1a2e27' }}>{dataBR(v.proxima_dose)}</strong>
                      </div>
                    </div>

                    {/* Status */}
                    <span style={{
                      background: st.bg, color: st.cor,
                      borderRadius: 8, padding: '4px 10px', fontSize: '.75rem', fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}>{st.label}</span>

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setForm(v); setAberto(true); }} style={{
                        padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e4ece8',
                        background: '#fff', color: '#1a2e27', cursor: 'pointer',
                        fontSize: '.82rem', fontFamily: 'inherit',
                      }}>✏️</button>
                      <button onClick={() => excluir(v)} style={{
                        padding: '7px 14px', borderRadius: 8, border: '1.5px solid #fdecea',
                        background: '#fdecea', color: '#d64545', cursor: 'pointer',
                        fontSize: '.82rem', fontFamily: 'inherit',
                      }}>🗑️</button>
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
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {form.id ? '✏️ Editar vacina' : '💉 Nova vacina'}
              </h2>
              <button onClick={() => setAberto(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <form onSubmit={salvar}>
                <Campo label="Nome do pet *">
                  <input style={inputStyle} value={form.pet_nome ?? ''} onChange={e => set('pet_nome', e.target.value)} placeholder="Nome do animal" />
                </Campo>
                <Campo label="Nome do tutor *">
                  <input style={inputStyle} value={form.tutor_nome ?? ''} onChange={e => set('tutor_nome', e.target.value)} placeholder="Responsável pelo pet" />
                </Campo>
                <Campo label="Telefone para contato">
                  <input style={inputStyle} value={form.tutor_telefone ?? ''} onChange={e => set('tutor_telefone', e.target.value)} placeholder="(14) 99999-9999" />
                </Campo>
                <Campo label="Vacina aplicada *">
                  <input style={inputStyle} list="vacinas-comuns" value={form.vacina ?? ''} onChange={e => set('vacina', e.target.value)} placeholder="Ex.: V10, Antirrábica..." />
                  <datalist id="vacinas-comuns">
                    {VACINAS_COMUNS.map(x => <option key={x} value={x} />)}
                  </datalist>
                </Campo>
                <Campo label="Data da última aplicação *">
                  <input style={inputStyle} type="date" value={form.data_aplicacao ?? ''} onChange={e => set('data_aplicacao', e.target.value)} />
                </Campo>
                <Campo label="Data da próxima dose">
                  <input style={inputStyle} type="date" value={form.proxima_dose ?? ''} onChange={e => set('proxima_dose', e.target.value)} />
                </Campo>
                <Campo label="Observações">
                  <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.observacao ?? ''} onChange={e => set('observacao', e.target.value)} placeholder="Lote, reações, observações..." />
                </Campo>
                <button type="submit" disabled={salvando} style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: salvando ? '#7fcfb4' : '#2a9d78', color: '#fff',
                  fontWeight: 700, fontSize: '1rem', cursor: salvando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', marginTop: 8,
                }}>
                  {salvando ? 'Salvando...' : 'Salvar vacina'}
                </button>
              </form>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
