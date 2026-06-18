import {
  IonContent, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
  IonMenu, IonMenuToggle, IonNote, IonButton,
} from '@ionic/react';
import {
  gridOutline, calendarOutline, pawOutline, peopleOutline,
  cubeOutline, cashOutline, logOutOutline,
} from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const paginas = [
  { titulo: 'Dashboard', url: '/dashboard', icon: gridOutline },
  { titulo: 'Agendamentos', url: '/agendamentos', icon: calendarOutline },
  { titulo: 'Pacientes', url: '/pacientes', icon: pawOutline },
  { titulo: 'Tutores', url: '/tutores', icon: peopleOutline },
  { titulo: 'Estoque', url: '/estoque', icon: cubeOutline },
  { titulo: 'Financeiro', url: '/financeiro', icon: cashOutline },
];

export default function Menu() {
  const location = useLocation();

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList>
          <IonListHeader className="marca-titulo">🐾 Cia Pet</IonListHeader>
          <IonNote className="ion-margin-start">Painel da equipe</IonNote>
          {paginas.map((p) => (
            <IonMenuToggle key={p.url} autoHide={false}>
              <IonItem
                routerLink={p.url}
                routerDirection="none"
                detail={false}
                color={location.pathname === p.url ? 'secondary' : undefined}
              >
                <IonIcon slot="start" icon={p.icon} />
                <IonLabel>{p.titulo}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>
        <div className="ion-padding">
          <IonButton expand="block" fill="outline" onClick={() => supabase.auth.signOut()}>
            <IonIcon slot="start" icon={logOutOutline} />
            Sair
          </IonButton>
        </div>
      </IonContent>
    </IonMenu>
  );
}
