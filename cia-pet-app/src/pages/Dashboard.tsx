import { useEffect, useState } from 'react';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { supabase } from '../lib/supabase';

const hojeISO = () => new Date().toISOString().slice(0, 10);
const dataBR = (iso: string) => iso.split('-').reverse().join('/');
const diaSemana = () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

interface Agendamento {
  id: string; pet_nome: string; tutor_nome: string; tutor_telefone: string;
  setor: string; data: string; turno: string; status: string;
}

const CARDS = [
  { key: 'hoje',      label: 'Confirmados hoje',       emoji: '✅', cor: '#2a9d78', bg: '#e3f3eb' },
  { key: 'pendentes', label: 'Agendamentos pendentes',  emoji: '⏳', cor: '#e07b39', bg: '#fff0e6' },
  { key: 'pets',      label: 'Pacientes cadastrados',   emoji: '🐾', cor: '#5b6af5', bg: '#eef0ff' },
  { key: 'tutores',   label: 'Tutores cadastrados',     emoji: '👥', cor: '#d4669a', bg: '#fdeef6' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ tutores: 0, pets: 0, pendentes: 0, hoje: 0 });
  const [pendentes, setPendentes] = useState<Agendamento[]>([]);

  useEffect(() => {
    (async () => {
      const hoje = hojeISO();
      const [t, p, pend, conf, listaPend] = await Promise.all([
        supabase.from('tutores').select('*', { count: 'exact', head: true }),
        supabase.from('pets').select('*', { count: 'exact', head: true }),
        supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('status', 'Pendente'),
        supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('status', 'Confirmado').eq('data', hoje),
        supabase.from('agendamentos').select('*').eq('status', 'Pendente').order('data').limit(10),
      ]);
      setStats({ tutores: t.count ?? 0, pets: p.count ?? 0, pendentes: pend.count ?? 0, hoje: conf.count ?? 0 });
      setPendentes((listaPend.data as Agendamento[]) ?? []);
    })();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Painel</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#f4f7f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

          {/* Boas-vindas */}
          <div style={{
            background: 'linear-gradient(135deg, #1c6f54, #2a9d78)',
            borderRadius: 16, padding: '24px 28px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(42,157,120,.2)',
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '.85rem', marginBottom: 4 }}>
                {diaSemana()}
              </div>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                Bem-vindo ao painel da Cia Pet 🐾
              </h2>
              <p style={{ color: 'rgba(255,255,255,.7)', margin: '6px 0 0', fontSize: '.9rem' }}>
                Gerencie agendamentos, pacientes, estoque e financeiro em um só lugar.
              </p>
            </div>
            <div style={{ fontSize: 52, opacity: .3, display: 'flex' }}>🏥</div>
          </div>

          {/* Cards de estatísticas */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16, marginBottom: 24,
          }}>
            {CARDS.map((c) => (
              <div key={c.key} style={{
                background: '#fff', borderRadius: 14, padding: '20px 22px',
                boxShadow: '0 2px 12px rgba(0,0,0,.06)', display: 'flex',
                alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  flexShrink: 0,
                }}>
                  {c.emoji}
                </div>
                <div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: c.cor, lineHeight: 1 }}>
                    {stats[c.key as keyof typeof stats]}
                  </div>
                  <div style={{ fontSize: '.78rem', color: '#6b7f79', marginTop: 4 }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Agendamentos pendentes */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden' }}>
            <div style={{
              padding: '18px 22px', borderBottom: '1px solid #eef2f0',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1a2e27' }}>
                Agendamentos pendentes
              </h3>
              {pendentes.length > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#fff0e6', color: '#e07b39',
                  borderRadius: 20, padding: '2px 10px', fontSize: '.78rem', fontWeight: 700,
                }}>
                  {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {pendentes.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ color: '#6b7f79', margin: 0, fontWeight: 500 }}>Nenhuma pendência. Tudo em dia!</p>
              </div>
            ) : (
              <div>
                {pendentes.map((a, i) => (
                  <div key={a.id} style={{
                    padding: '16px 22px',
                    borderBottom: i < pendentes.length - 1 ? '1px solid #f0f4f2' : 'none',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: a.setor === 'Clínica Veterinária' ? '#eef0ff' : '#e3f3eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {a.setor === 'Clínica Veterinária' ? '🏥' : '✂️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.95rem' }}>
                        {a.pet_nome}
                        <span style={{
                          marginLeft: 8, fontSize: '.72rem', fontWeight: 600,
                          background: a.setor === 'Clínica Veterinária' ? '#eef0ff' : '#e3f3eb',
                          color: a.setor === 'Clínica Veterinária' ? '#5b6af5' : '#2a9d78',
                          borderRadius: 6, padding: '2px 8px',
                        }}>{a.setor}</span>
                      </div>
                      <div style={{ color: '#6b7f79', fontSize: '.82rem', marginTop: 3 }}>
                        👤 {a.tutor_nome} · 📞 {a.tutor_telefone}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.9rem' }}>
                        {dataBR(a.data)}
                      </div>
                      <div style={{ color: '#6b7f79', fontSize: '.78rem', marginTop: 2 }}>{a.turno}</div>
                    </div>
                    <span style={{
                      background: '#fff8ec', color: '#e07b39', border: '1px solid #fdd9b5',
                      borderRadius: 8, padding: '4px 12px', fontSize: '.78rem', fontWeight: 700,
                      flexShrink: 0,
                    }}>Pendente</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
}
