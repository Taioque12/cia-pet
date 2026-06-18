import { useState, type FormEvent } from 'react';
import {
  IonContent, IonHeader, IonPage, IonToolbar, IonTitle, IonList, IonItem,
  IonInput, IonButton, IonSpinner, IonText, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonNote,
} from '@ionic/react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro('E-mail ou senha inválidos.');
    setEnviando(false);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle className="marca-titulo">🐾 Cia Pet — Área Restrita</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard style={{ maxWidth: 420, margin: '32px auto' }}>
          <IonCardHeader>
            <IonCardTitle>Entrar no painel</IonCardTitle>
            <IonNote>Acesso exclusivo da equipe clínica</IonNote>
          </IonCardHeader>
          <IonCardContent>
            <form onSubmit={entrar}>
              <IonList>
                <IonItem>
                  <IonInput
                    label="E-mail" labelPlacement="stacked" type="email"
                    placeholder="vet@ciapet.com.br" value={email}
                    onIonInput={(e) => setEmail(e.detail.value ?? '')}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Senha" labelPlacement="stacked" type="password"
                    placeholder="••••••••" value={senha}
                    onIonInput={(e) => setSenha(e.detail.value ?? '')}
                  />
                </IonItem>
              </IonList>
              {erro && (
                <IonText color="danger"><p style={{ padding: '0 16px' }}>{erro}</p></IonText>
              )}
              <IonButton type="submit" expand="block" className="ion-margin-top" disabled={enviando}>
                {enviando ? <IonSpinner name="crescent" /> : 'Entrar'}
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
}
