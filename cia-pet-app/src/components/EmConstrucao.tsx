import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonText, IonIcon,
} from '@ionic/react';
import { constructOutline } from 'ionicons/icons';

export default function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>{titulo}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding ion-text-center">
        <IonIcon icon={constructOutline} style={{ fontSize: 64, marginTop: 60, color: 'var(--ion-color-medium)' }} />
        <IonText>
          <h2>{titulo}</h2>
          <p style={{ color: 'var(--ion-color-medium)' }}>
            Módulo em construção — será reconstruído na próxima etapa, com base no protótipo.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
}
