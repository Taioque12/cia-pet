import { useState, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage } from '@ionic/react';
import { supabase } from '../lib/supabase';
import '../site.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const history = useHistory();

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro('E-mail ou senha inválidos. Verifique suas credenciais.');
      setEnviando(false);
    } else {
      history.replace('/dashboard');
    }
  }

  return (
    <IonPage>
    <div className="sp-root" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Lado esquerdo — branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #1c6f54 0%, #2a9d78 60%, #3dbf8f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,.07)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(255,255,255,.05)',
        }} />

        {/* Logo */}
        <div style={{ zIndex: 1, textAlign: 'center', color: '#fff' }}>
          <div style={{
            width: 72, height: 72, background: 'rgba(255,255,255,.15)',
            borderRadius: 20, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px', fontSize: 36,
            backdropFilter: 'blur(10px)',
          }}>
            🐾
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>
            Cia Pet
          </h1>
          <p style={{ fontSize: '.9rem', opacity: .8, margin: '0 0 48px', color: '#fff' }}>
            Clínica · Banho e Tosa
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,.2)', paddingTop: 40 }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 24 }}>
              Painel exclusivo da equipe
            </p>
            {[
              { icon: '📋', text: 'Gerenciar agendamentos' },
              { icon: '🐶', text: 'Prontuários dos pacientes' },
              { icon: '📦', text: 'Controle de estoque' },
              { icon: '💰', text: 'Financeiro e relatórios' },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 14, color: 'rgba(255,255,255,.9)',
              }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: '.9rem' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f4f8f6', padding: '40px 32px',
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: '#fff', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(20,60,50,.1)',
          padding: '40px 36px',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: '#20302a' }}>
            Bem-vindo de volta
          </h2>
          <p style={{ fontSize: '.9rem', color: '#5f6f69', margin: '0 0 32px' }}>
            Entre com suas credenciais para acessar o painel
          </p>

          <form onSubmit={entrar}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', fontSize: '.85rem', fontWeight: 600,
                color: '#20302a', marginBottom: 8,
              }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  border: '1.5px solid #e4ece8', fontSize: '1rem',
                  color: '#20302a', background: '#fff', boxSizing: 'border-box',
                  outline: 'none', transition: 'border-color .2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#2a9d78'}
                onBlur={e => e.target.style.borderColor = '#e4ece8'}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block', fontSize: '.85rem', fontWeight: 600,
                color: '#20302a', marginBottom: 8,
              }}>
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  border: '1.5px solid #e4ece8', fontSize: '1rem',
                  color: '#20302a', background: '#fff', boxSizing: 'border-box',
                  outline: 'none', transition: 'border-color .2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#2a9d78'}
                onBlur={e => e.target.style.borderColor = '#e4ece8'}
              />
            </div>

            {erro && (
              <div style={{
                background: '#fdecea', border: '1px solid #f5c2c2', borderRadius: 10,
                padding: '12px 16px', marginBottom: 20,
                color: '#b02020', fontSize: '.88rem', display: 'flex', gap: 8,
              }}>
                <span>⚠️</span> {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: enviando ? '#7fcfb4' : '#2a9d78',
                color: '#fff', border: 'none', fontSize: '1rem',
                fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer',
                transition: 'background .2s', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {enviando ? (
                <>
                  <span style={{
                    width: 18, height: 18, border: '2px solid rgba(255,255,255,.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin .7s linear infinite',
                  }} />
                  Entrando...
                </>
              ) : 'Entrar no painel'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a
              href="/"
              style={{ color: '#5f6f69', fontSize: '.88rem', textDecoration: 'none' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#2a9d78'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#5f6f69'}
            >
              ← Voltar ao site
            </a>
          </div>
        </div>

        <p style={{ marginTop: 24, fontSize: '.78rem', color: '#5f6f69' }}>
          © 2025 Cia Pet · Acesso restrito à equipe
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-branding { display: none !important; }
        }
      `}</style>
    </div>
    </IonPage>
  );
}
