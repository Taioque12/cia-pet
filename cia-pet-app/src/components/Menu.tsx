import { IonContent, IonMenu, IonMenuToggle } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const paginas = [
  { titulo: 'Painel',        url: '/dashboard',   emoji: '📊' },
  { titulo: 'Agendamentos',  url: '/agendamentos',emoji: '📅' },
  { titulo: 'Pacientes',     url: '/pacientes',   emoji: '🐾' },
  { titulo: 'Tutores',       url: '/tutores',     emoji: '👥' },
  { titulo: 'Estoque',       url: '/estoque',     emoji: '📦' },
  { titulo: 'Financeiro',    url: '/financeiro',  emoji: '💰' },
];

export default function Menu() {
  const location = useLocation();

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent style={{ '--background': '#1a2e27' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1a2e27' }}>

          {/* Logo */}
          <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, background: '#2a9d78', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>🐾</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>Cia Pet</div>
                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.72rem' }}>Painel da equipe</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 12px' }}>
            <div style={{ color: 'rgba(255,255,255,.3)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '8px 8px 4px' }}>
              Navegação
            </div>
            {paginas.map((p) => {
              const ativo = location.pathname === p.url;
              return (
                <IonMenuToggle key={p.url} autoHide={false}>
                  <a
                    href={p.url}
                    onClick={e => { e.preventDefault(); window.location.href = p.url; }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 10, marginBottom: 4,
                      background: ativo ? 'rgba(42,157,120,.25)' : 'transparent',
                      border: ativo ? '1px solid rgba(42,157,120,.4)' : '1px solid transparent',
                      textDecoration: 'none', cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: 17 }}>{p.emoji}</span>
                    <span style={{
                      color: ativo ? '#4ecda4' : 'rgba(255,255,255,.7)',
                      fontWeight: ativo ? 700 : 400, fontSize: '.92rem',
                    }}>{p.titulo}</span>
                    {ativo && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#2a9d78' }} />}
                  </a>
                </IonMenuToggle>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: '12px 12px 28px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                width: '100%', padding: '11px', borderRadius: 10,
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                color: 'rgba(255,255,255,.6)', fontSize: '.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .15s', fontFamily: 'inherit',
              }}
            >
              🚪 Sair da conta
            </button>
          </div>
        </div>
      </IonContent>
    </IonMenu>
  );
}
