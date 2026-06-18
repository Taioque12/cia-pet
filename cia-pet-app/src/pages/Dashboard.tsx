import { useEffect, useState } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel, IonBadge, IonText,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

const hojeISO = () => new Date().toISOString().slice(0, 10);
const dataBR = (iso: string) => iso.split('-').reverse().join('/');

interface Agendamento {
  id: string; pet_nome: string; tutor_nome: string; tutor_telefone: string;
  setor: string; data: string; turno: string; status: string;
}

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
        supabase.from('agendamentos').select('*').eq('status', 'Pendente').order('data'),
      ]);
      setStats({ tutores: t.count ?? 0, pets: p.count ?? 0, pendentes: pend.count ?? 0, hoje: conf.count ?? 0 });
      setPendentes((listaPend.data as Agendamento[]) ?? []);
    })();
  }, []);

  const cards = [
    { n: stats.hoje, label: 'Confirmados hoje' },
    { n: stats.pendentes, label: 'Agendamentos pendentes' },
    { n: stats.pets, label: 'Pacientes' },
    { n: stats.tutores, label: 'Tutores' },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            {cards.map((c) => (
              <IonCol size="6" sizeMd="3" key={c.label}>
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ion-color-primary)' }}>{c.n}</div>
                    <IonText color="medium"><small>{c.label}</small></IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        <IonCard>
          <IonCardHeader><IonCardTitle>🔔 Agendamentos pendentes</IonCardTitle></IonCardHeader>
          <IonCardContent>
            {pendentes.length === 0 ? (
              <IonText color="medium"><p>Nenhuma pendência. Tudo em dia! ✅</p></IonText>
            ) : (
              <IonList>
                {pendentes.map((a) => (
                  <IonItem key={a.id}>
                    <IonLabel>
                      <h3>{a.pet_nome} — {a.setor}</h3>
                      <p>{dataBR(a.data)} · {a.turno} · {a.tutor_nome} · {a.tutor_telefone}</p>
                    </IonLabel>
                    <IonBadge slot="end" color="warning">Pendente</IonBadge>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
}
