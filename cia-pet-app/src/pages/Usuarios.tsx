import { useEffect, useState, type FormEvent } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonSpinner, IonModal,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

interface Usuario {
  id: string; email: string; nome: string; crmv: string;
  criado: string; ultimo_login: string | null;
}

const VAZIO = { email: '', password: '', nome: '', crmv: '' };

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

function Avatar({ nome, email }: { nome: string; email: string }) {
  const letra = (nome || email).charAt(0).toUpperCase();
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#1c6f54,#2a9d78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: '1.1rem', color: '#fff', flexShrink: 0,
    }}>{letra}</div>
  );
}

function dataBR(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function chamarAPI(method: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
  return resp.json();
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const data = await chamarAPI('GET');
    setUsuarios(Array.isArray(data) ? data : []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const set = (campo: string, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  function abrirNovo() {
    setEditando(null);
    setForm(VAZIO);
    setErro('');
    setAberto(true);
  }

  function abrirEditar(u: Usuario) {
    setEditando(u);
    setForm({ email: u.email, password: '', nome: u.nome, crmv: u.crmv ?? '' });
    setErro('');
    setAberto(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    let res: { error?: string };
    if (editando) {
      res = await chamarAPI('PATCH', { id: editando.id, nome: form.nome, crmv: form.crmv, ...(form.password ? { password: form.password } : {}) });
    } else {
      res = await chamarAPI('POST', { email: form.email, password: form.password, nome: form.nome, crmv: form.crmv });
    }
    setSalvando(false);
    if (res.error) { setErro(res.error); return; }
    setAberto(false);
    carregar();
  }

  async function excluir(u: Usuario) {
    if (!window.confirm(`Excluir o usuário ${u.email}? Esta ação não pode ser desfeita.`)) return;
    const res = await chamarAPI('DELETE', { id: u.id });
    if (res.error) { window.alert('Erro: ' + res.error); return; }
    carregar();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Usuários do sistema</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#f4f7f5' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

          {/* Cabeçalho */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '1rem' }}>Gerenciar acesso</div>
              <div style={{ color: '#6b7f79', fontSize: '.82rem', marginTop: 2 }}>Crie e gerencie contas para a equipe.</div>
            </div>
            <button onClick={abrirNovo} style={{
              padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#2a9d78', color: '#fff', fontWeight: 700, fontSize: '.9rem', fontFamily: 'inherit',
            }}>+ Novo usuário</button>
          </div>

          {/* Lista */}
          {carregando ? (
            <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
          ) : usuarios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7f79' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <p style={{ margin: 0 }}>Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {usuarios.map((u) => (
                <div key={u.id} style={{
                  background: '#fff', borderRadius: 14, padding: '16px 20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <Avatar nome={u.nome} email={u.email} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.97rem' }}>
                      {u.nome || '—'}
                    </div>
                    <div style={{ color: '#6b7f79', fontSize: '.82rem', marginTop: 2 }}>
                      ✉️ {u.email}{u.crmv ? ` · 🩺 ${u.crmv}` : ''}
                    </div>
                    <div style={{ color: '#a0aea9', fontSize: '.75rem', marginTop: 2 }}>
                      Criado em {dataBR(u.criado)}
                      {u.ultimo_login && ` · Último acesso: ${dataBR(u.ultimo_login)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => abrirEditar(u)} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e4ece8',
                      background: '#fff', color: '#1a2e27', cursor: 'pointer', fontSize: '.82rem', fontFamily: 'inherit',
                    }}>✏️ Editar</button>
                    <button onClick={() => excluir(u)} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1.5px solid #fdecea',
                      background: '#fdecea', color: '#d64545', cursor: 'pointer', fontSize: '.82rem', fontFamily: 'inherit',
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
                {editando ? '✏️ Editar usuário' : '👤 Novo usuário'}
              </h2>
              <button onClick={() => setAberto(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {erro && (
                <div style={{ background: '#fdecea', color: '#d64545', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '.88rem', fontWeight: 600 }}>
                  ⚠️ {erro}
                </div>
              )}
              <form onSubmit={salvar}>
                <Campo label="Nome">
                  <input style={inputStyle} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex.: Dr. Ighor Morales" />
                </Campo>
                <Campo label="CRMV (aparece no receituário)">
                  <input style={inputStyle} value={form.crmv} onChange={e => set('crmv', e.target.value)} placeholder="Ex.: CRMV-SP 12345 (opcional)" />
                </Campo>
                <Campo label="E-mail *">
                  <input style={{ ...inputStyle, background: editando ? '#f4f7f5' : '#fff', color: editando ? '#6b7f79' : '#1a2e27' }}
                    type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="email@exemplo.com" disabled={!!editando} />
                </Campo>
                <Campo label={editando ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}>
                  <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder={editando ? 'Nova senha...' : 'Mínimo 6 caracteres'} />
                </Campo>
                <div style={{ background: '#e3f3eb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '.82rem', color: '#1c6f54' }}>
                  🔒 As senhas são armazenadas com segurança pelo Supabase. Nunca são salvas em texto puro.
                </div>
                <button type="submit" disabled={salvando} style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: salvando ? '#7fcfb4' : '#2a9d78', color: '#fff',
                  fontWeight: 700, fontSize: '1rem', cursor: salvando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar usuário'}
                </button>
              </form>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
