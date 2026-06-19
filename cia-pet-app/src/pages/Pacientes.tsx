import { useEffect, useState, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonSpinner, IonModal,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

interface PetRow {
  id: string; nome: string; especie: string; raca: string | null;
  porte: string | null; nascimento: string | null; tutor_id: string;
  alergias: string | null; condicoes: string | null;
  tutores: { nome: string } | null;
}
interface TutorOpc { id: string; nome: string; }

const VAZIO: Partial<PetRow> = {
  nome: '', especie: '', raca: '', porte: '', nascimento: '', tutor_id: '',
  alergias: '', condicoes: '',
};

const ESPECIES: Record<string, string> = {
  Canino: '🐶', Felino: '🐱', Ave: '🐦', Roedor: '🐹', Réptil: '🦎', Outro: '🐾',
};

function idade(nascimento: string | null): string {
  if (!nascimento) return '—';
  const n = new Date(nascimento), h = new Date();
  let anos = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) anos--;
  return anos <= 0 ? 'menos de 1 ano' : `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
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

export default function Pacientes() {
  const history = useHistory();
  const [pets, setPets] = useState<PetRow[]>([]);
  const [tutoresOpc, setTutoresOpc] = useState<TutorOpc[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<PetRow>>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [p, t] = await Promise.all([
      supabase.from('pets').select('id, nome, especie, raca, porte, nascimento, tutor_id, alergias, condicoes, tutores(nome)').order('nome'),
      supabase.from('tutores').select('id, nome').order('nome'),
    ]);
    setPets((p.data as unknown as PetRow[]) ?? []);
    setTutoresOpc((t.data as TutorOpc[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const set = (campo: keyof PetRow, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.nome?.trim()) { window.alert('Informe o nome do pet.'); return; }
    if (!form.tutor_id) { window.alert('Selecione o tutor responsável.'); return; }
    if (!form.especie) { window.alert('Selecione a espécie.'); return; }
    setSalvando(true);
    const dados = {
      nome: form.nome, especie: form.especie, raca: form.raca, porte: form.porte || null,
      nascimento: form.nascimento || null, tutor_id: form.tutor_id,
      alergias: form.alergias, condicoes: form.condicoes,
    };
    const resp = form.id
      ? await supabase.from('pets').update(dados).eq('id', form.id)
      : await supabase.from('pets').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro ao salvar: ' + resp.error.message); return; }
    setAberto(false);
    carregar();
  }

  async function excluir(p: PetRow) {
    if (!window.confirm(`Excluir o paciente ${p.nome}? O histórico clínico também será removido.`)) return;
    const { error } = await supabase.from('pets').delete().eq('id', p.id);
    if (error) window.alert('Erro ao excluir: ' + error.message);
    carregar();
  }

  const filtrados = pets.filter((p) => {
    const t = busca.toLowerCase();
    return p.nome.toLowerCase().includes(t) || (p.raca ?? '').toLowerCase().includes(t) || (p.tutores?.nome ?? '').toLowerCase().includes(t);
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Pacientes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#f4f7f5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

          {/* Busca + botão */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <input
              placeholder="🔍 Buscar por nome, raça ou tutor..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => { setForm(VAZIO); setAberto(true); }} style={{
              padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#2a9d78', color: '#fff', fontWeight: 700, fontSize: '.9rem',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              + Novo paciente
            </button>
          </div>

          {/* Lista */}
          {carregando ? (
            <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7f79' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🐾</div>
              <p style={{ margin: 0 }}>Nenhum paciente encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtrados.map((p) => (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: 14, padding: '16px 20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                }}>
                  {/* Avatar espécie */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: '#e3f3eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>
                    {ESPECIES[p.especie] ?? '🐾'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.97rem', marginBottom: 3 }}>
                      {p.nome}
                      {p.porte && (
                        <span style={{
                          marginLeft: 8, fontSize: '.72rem', fontWeight: 600,
                          background: '#f0f4f2', color: '#5f6f69',
                          borderRadius: 6, padding: '2px 8px',
                        }}>{p.porte}</span>
                      )}
                    </div>
                    <div style={{ color: '#6b7f79', fontSize: '.82rem' }}>
                      {p.especie}{p.raca ? ` · ${p.raca}` : ''} · {idade(p.nascimento)}
                    </div>
                    <div style={{ color: '#6b7f79', fontSize: '.78rem', marginTop: 2 }}>
                      👤 {p.tutores?.nome ?? '—'}
                    </div>
                  </div>

                  {/* Alertas */}
                  {p.alergias && (
                    <span style={{
                      background: '#fff8ec', color: '#e07b39', border: '1px solid #fdd9b5',
                      borderRadius: 8, padding: '4px 10px', fontSize: '.75rem', fontWeight: 600,
                    }}>⚠️ Alergia</span>
                  )}

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => history.push(`/pacientes/${p.id}/prontuarios`)} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1.5px solid #eef0ff',
                      background: '#eef0ff', color: '#5b6af5', cursor: 'pointer',
                      fontSize: '.82rem', fontFamily: 'inherit', fontWeight: 600,
                    }}>📋 Prontuários</button>
                    <button onClick={() => { setForm(p); setAberto(true); }} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e4ece8',
                      background: '#fff', color: '#1a2e27', cursor: 'pointer',
                      fontSize: '.82rem', fontFamily: 'inherit',
                    }}>✏️</button>
                    <button onClick={() => excluir(p)} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1.5px solid #fdecea',
                      background: '#fdecea', color: '#d64545', cursor: 'pointer',
                      fontSize: '.82rem', fontFamily: 'inherit',
                    }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <IonModal isOpen={aberto} onDidDismiss={() => setAberto(false)}>
          <div style={{ height: '100%', background: '#f4f7f5', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg,#1c6f54,#2a9d78)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {form.id ? '✏️ Editar paciente' : '🐾 Novo paciente'}
              </h2>
              <button onClick={() => setAberto(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <form onSubmit={salvar}>
                <Campo label="Tutor responsável *">
                  <select style={inputStyle} value={form.tutor_id ?? ''} onChange={e => set('tutor_id', e.target.value)}>
                    <option value="">Selecione o tutor...</option>
                    {tutoresOpc.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </Campo>
                <Campo label="Nome do pet *">
                  <input style={inputStyle} value={form.nome ?? ''} onChange={e => set('nome', e.target.value)} placeholder="Nome do animal" />
                </Campo>
                <Campo label="Espécie *">
                  <select style={inputStyle} value={form.especie ?? ''} onChange={e => set('especie', e.target.value)}>
                    <option value="">Selecione a espécie...</option>
                    {Object.keys(ESPECIES).map(x => <option key={x} value={x}>{ESPECIES[x]} {x}</option>)}
                  </select>
                </Campo>
                <Campo label="Raça">
                  <input style={inputStyle} value={form.raca ?? ''} onChange={e => set('raca', e.target.value)} placeholder="Ex.: Dachshund, Siamês, SRD" />
                </Campo>
                <Campo label="Porte">
                  <select style={inputStyle} value={form.porte ?? ''} onChange={e => set('porte', e.target.value)}>
                    <option value="">Selecione...</option>
                    {['Pequeno', 'Médio', 'Grande', 'Gigante'].map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </Campo>
                <Campo label="Data de nascimento">
                  <input style={inputStyle} type="date" value={form.nascimento ?? ''} onChange={e => set('nascimento', e.target.value)} />
                </Campo>
                <Campo label="Alergias">
                  <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.alergias ?? ''} onChange={e => set('alergias', e.target.value)} placeholder="Vital para medicação e shampoos" />
                </Campo>
                <Campo label="Condições preexistentes">
                  <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.condicoes ?? ''} onChange={e => set('condicoes', e.target.value)} placeholder="Doenças, cirurgias anteriores..." />
                </Campo>
                <button type="submit" disabled={salvando} style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: salvando ? '#7fcfb4' : '#2a9d78', color: '#fff',
                  fontWeight: 700, fontSize: '1rem', cursor: salvando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', marginTop: 8,
                }}>
                  {salvando ? 'Salvando...' : 'Salvar paciente'}
                </button>
              </form>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
