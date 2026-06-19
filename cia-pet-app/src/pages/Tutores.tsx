import { useEffect, useState, type FormEvent } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage,
  IonTitle, IonToolbar, IonSpinner, IonModal,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

interface Tutor {
  id: string; nome: string; cpf: string | null; telefone: string | null;
  email: string | null; endereco: string | null; contato_emergencia: string | null;
}

const VAZIO: Partial<Tutor> = {
  nome: '', cpf: '', telefone: '', email: '', endereco: '', contato_emergencia: '',
};

function Avatar({ nome }: { nome: string }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: '#e3f3eb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: '1.1rem', color: '#2a9d78', flexShrink: 0,
    }}>
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#1a2e27', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #e4ece8', fontSize: '.95rem', color: '#1a2e27',
  background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
};

export default function Tutores() {
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<Tutor>>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase.from('tutores').select('*').order('nome');
    setTutores((data as Tutor[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const set = (campo: keyof Tutor, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.nome?.trim()) { window.alert('Informe o nome do tutor.'); return; }
    setSalvando(true);
    const dados = {
      nome: form.nome, cpf: form.cpf, telefone: form.telefone,
      email: form.email, endereco: form.endereco, contato_emergencia: form.contato_emergencia,
    };
    const resp = form.id
      ? await supabase.from('tutores').update(dados).eq('id', form.id)
      : await supabase.from('tutores').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro ao salvar: ' + resp.error.message); return; }
    setAberto(false);
    carregar();
  }

  async function excluir(t: Tutor) {
    if (!window.confirm(`Excluir o tutor ${t.nome}?`)) return;
    const { error } = await supabase.from('tutores').delete().eq('id', t.id);
    if (error) window.alert('Não foi possível excluir — verifique se há pets vinculados.');
    carregar();
  }

  const filtrados = tutores.filter((t) =>
    t.nome.toLowerCase().includes(busca.toLowerCase()) || (t.cpf ?? '').includes(busca),
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Tutores</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#f4f7f5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

          {/* Barra de busca + botão */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <input
              placeholder="🔍 Buscar por nome ou CPF..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => { setForm(VAZIO); setAberto(true); }} style={{
              padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#2a9d78', color: '#fff', fontWeight: 700, fontSize: '.9rem',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              + Novo tutor
            </button>
          </div>

          {/* Lista */}
          {carregando ? (
            <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7f79' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <p style={{ margin: 0 }}>Nenhum tutor encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtrados.map((t) => (
                <div key={t.id} style={{
                  background: '#fff', borderRadius: 14, padding: '16px 20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <Avatar nome={t.nome} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.97rem' }}>{t.nome}</div>
                    <div style={{ color: '#6b7f79', fontSize: '.82rem', marginTop: 3 }}>
                      {t.telefone && `📞 ${t.telefone}`}
                      {t.email && ` · ✉️ ${t.email}`}
                    </div>
                    {t.cpf && <div style={{ color: '#6b7f79', fontSize: '.78rem', marginTop: 2 }}>CPF: {t.cpf}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { setForm(t); setAberto(true); }} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e4ece8',
                      background: '#fff', color: '#1a2e27', cursor: 'pointer',
                      fontSize: '.82rem', fontFamily: 'inherit',
                    }}>✏️ Editar</button>
                    <button onClick={() => excluir(t)} style={{
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
                {form.id ? '✏️ Editar tutor' : '👤 Novo tutor'}
              </h2>
              <button onClick={() => setAberto(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <form onSubmit={salvar}>
                <Campo label="Nome completo *">
                  <input style={inputStyle} value={form.nome ?? ''} onChange={e => set('nome', e.target.value)} placeholder="Nome do tutor" />
                </Campo>
                <Campo label="CPF">
                  <input style={inputStyle} value={form.cpf ?? ''} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                </Campo>
                <Campo label="Telefone">
                  <input style={inputStyle} value={form.telefone ?? ''} onChange={e => set('telefone', e.target.value)} placeholder="(14) 9 0000-0000" />
                </Campo>
                <Campo label="E-mail">
                  <input style={inputStyle} type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
                </Campo>
                <Campo label="Endereço">
                  <input style={inputStyle} value={form.endereco ?? ''} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro" />
                </Campo>
                <Campo label="Contato de emergência">
                  <input style={inputStyle} value={form.contato_emergencia ?? ''} onChange={e => set('contato_emergencia', e.target.value)} placeholder="Nome e telefone" />
                </Campo>
                <button type="submit" disabled={salvando} style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: salvando ? '#7fcfb4' : '#2a9d78', color: '#fff',
                  fontWeight: 700, fontSize: '1rem', cursor: salvando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', marginTop: 8,
                }}>
                  {salvando ? 'Salvando...' : 'Salvar tutor'}
                </button>
              </form>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
