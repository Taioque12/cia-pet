import { useEffect, useState } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonText, IonBadge,
  IonButton, IonSegment, IonSegmentButton,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

const dataBR = (iso: string) => iso.split('-').reverse().join('/');
const corStatus = (s: string) =>
  s === 'Confirmado' ? 'success' : s === 'Cancelado' ? 'danger' : 'warning';

interface Agendamento {
  id: string; pet_nome: string; tutor_nome: string; tutor_telefone: string;
  setor: string; data: string; turno: string; status: string;
}

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Agendamentos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSegment value={filtro} onIonChange={(e) => setFiltro(e.detail.value as string)}>
          <IonSegmentButton value="Todos"><IonLabel>Todos</IonLabel></IonSegmentButton>
          <IonSegmentButton value="Pendente"><IonLabel>Pendentes</IonLabel></IonSegmentButton>
          <IonSegmentButton value="Confirmado"><IonLabel>Confirmados</IonLabel></IonSegmentButton>
          <IonSegmentButton value="Cancelado"><IonLabel>Cancelados</IonLabel></IonSegmentButton>
        </IonSegment>

        {carregando ? (
          <IonSpinner className="ion-margin-top" />
        ) : filtrados.length === 0 ? (
          <IonText color="medium"><p>Nenhum agendamento nesta categoria.</p></IonText>
        ) : (
          <IonList>
            {filtrados.map((a) => (
              <IonItem key={a.id}>
                <IonLabel className="ion-text-wrap">
                  <h2>{a.pet_nome} — {a.setor}</h2>
                  <p>{dataBR(a.data)} · {a.turno}</p>
                  <p>{a.tutor_nome} · {a.tutor_telefone}</p>
                  <IonBadge color={corStatus(a.status)}>{a.status}</IonBadge>
                  <div className="ion-margin-top">
                    {a.status === 'Pendente' && (
                      <IonButton size="small" onClick={() => mudarStatus(a, 'Confirmado')}>Confirmar</IonButton>
                    )}
                    {a.status !== 'Cancelado' && (
                      <IonButton size="small" fill="outline" color="danger" onClick={() => mudarStatus(a, 'Cancelado')}>Cancelar</IonButton>
                    )}
                    {a.status === 'Cancelado' && (
                      <IonButton size="small" fill="outline" onClick={() => mudarStatus(a, 'Pendente')}>Reabrir</IonButton>
                    )}
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
