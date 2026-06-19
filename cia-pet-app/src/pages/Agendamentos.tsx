import { useEffect, useState } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonSpinner,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

const dataBR = (iso: string) => iso.split('-').reverse().join('/');

interface Agendamento {
  id: string; pet_nome: string; tutor_nome: string; tutor_telefone: string;
  setor: string; data: string; turno: string; status: string;
}

const STATUS_CONFIG: Record<string, { cor: string; bg: string; emoji: string }> = {
  Pendente:   { cor: '#e07b39', bg: '#fff0e6', emoji: '⏳' },
  Confirmado: { cor: '#2a9d78', bg: '#e3f3eb', emoji: '✅' },
  Cancelado:  { cor: '#d64545', bg: '#fdecea', emoji: '✖️' },
};

const FILTROS = ['Todos', 'Pendente', 'Confirmado', 'Cancelado'];

export default function Agendamentos() {
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('Todos');

  async function carregar() {
    const { data } = await supabase.from('agendamentos').select('*').order('data', { ascending: false });
    setLista((data as Agendamento[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  async function mudarStatus(a: Agendamento, status: string) {
    await supabase.from('agendamentos').update({ status }).eq('id', a.id);
    carregar();
  }

  const filtrados = filtro === 'Todos' ? lista : lista.filter((a) => a.status === filtro);
  const counts = {
    Todos: lista.length,
    Pendente: lista.filter(a => a.status === 'Pendente').length,
    Confirmado: lista.filter(a => a.status === 'Confirmado').length,
    Cancelado: lista.filter(a => a.status === 'Cancelado').length,
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Agendamentos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#f4f7f5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {FILTROS.map((f) => {
              const cfg = STATUS_CONFIG[f];
              const ativo = filtro === f;
              return (
                <button key={f} onClick={() => setFiltro(f)} style={{
                  padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: ativo ? (cfg?.cor ?? '#1a2e27') : '#fff',
                  color: ativo ? '#fff' : '#5f6f69',
                  fontWeight: ativo ? 700 : 400, fontSize: '.88rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                  display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                  transition: 'all .15s',
                }}>
                  {cfg?.emoji} {f}
                  <span style={{
                    background: ativo ? 'rgba(255,255,255,.25)' : '#f0f4f2',
                    color: ativo ? '#fff' : '#1a2e27',
                    borderRadius: 10, padding: '1px 7px', fontSize: '.75rem', fontWeight: 700,
                  }}>
                    {counts[f as keyof typeof counts]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lista */}
          {carregando ? (
            <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner /></div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7f79' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <p style={{ margin: 0 }}>Nenhum agendamento nesta categoria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtrados.map((a) => {
                const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG['Pendente'];
                return (
                  <div key={a.id} style={{
                    background: '#fff', borderRadius: 14, padding: '18px 20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  }}>
                    {/* Ícone setor */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: a.setor === 'Clínica Veterinária' ? '#eef0ff' : '#e3f3eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {a.setor === 'Clínica Veterinária' ? '🏥' : '✂️'}
                    </div>

                    {/* Info principal */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '1rem', marginBottom: 4 }}>
                        {a.pet_nome}
                        <span style={{
                          marginLeft: 8, fontSize: '.72rem', fontWeight: 600,
                          background: a.setor === 'Clínica Veterinária' ? '#eef0ff' : '#e3f3eb',
                          color: a.setor === 'Clínica Veterinária' ? '#5b6af5' : '#2a9d78',
                          borderRadius: 6, padding: '2px 8px',
                        }}>{a.setor}</span>
                      </div>
                      <div style={{ color: '#6b7f79', fontSize: '.82rem' }}>
                        👤 {a.tutor_nome} · 📞 {a.tutor_telefone}
                      </div>
                    </div>

                    {/* Data e turno */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: '#1a2e27', fontSize: '.95rem' }}>{dataBR(a.data)}</div>
                      <div style={{ color: '#6b7f79', fontSize: '.78rem', marginTop: 2 }}>{a.turno}</div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.cor}33`,
                      borderRadius: 8, padding: '5px 12px', fontSize: '.78rem', fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {cfg.emoji} {a.status}
                    </span>

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {a.status === 'Pendente' && (
                        <button onClick={() => mudarStatus(a, 'Confirmado')} style={{
                          padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#2a9d78', color: '#fff', fontSize: '.82rem', fontWeight: 600,
                          fontFamily: 'inherit',
                        }}>Confirmar</button>
                      )}
                      {a.status !== 'Cancelado' && (
                        <button onClick={() => mudarStatus(a, 'Cancelado')} style={{
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                          background: 'transparent', border: '1.5px solid #d64545',
                          color: '#d64545', fontSize: '.82rem', fontWeight: 600,
                          fontFamily: 'inherit',
                        }}>Cancelar</button>
                      )}
                      {a.status === 'Cancelado' && (
                        <button onClick={() => mudarStatus(a, 'Pendente')} style={{
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                          background: 'transparent', border: '1.5px solid #6b7f79',
                          color: '#6b7f79', fontSize: '.82rem', fontWeight: 600,
                          fontFamily: 'inherit',
                        }}>Reabrir</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
