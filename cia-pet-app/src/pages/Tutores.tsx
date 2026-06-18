import { useEffect, useState, type FormEvent } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage,
  IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonText,
  IonSearchbar, IonButton, IonIcon, IonFab, IonFabButton, IonModal, IonInput,
} from '@ionic/react';
import { add, createOutline, trashOutline, close } from 'ionicons/icons';
import { supabase } from '../lib/supabase';

interface Tutor {
  id: string; nome: string; cpf: string | null; telefone: string | null;
  email: string | null; endereco: string | null; contato_emergencia: string | null;
}

const VAZIO: Partial<Tutor> = {
  nome: '', cpf: '', telefone: '', email: '', endereco: '', contato_emergencia: '',
};

export default function Tutores() {
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<Tutor>>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase.from('tutores').select('*').order('nome');
    setTutores((data as Tutor[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const set = (campo: keyof Tutor, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.nome?.trim()) { window.alert('Informe o nome do tutor.'); return; }
    setSalvando(true);
    const dados = {
      nome: form.nome, cpf: form.cpf, telefone: form.telefone,
      email: form.email, endereco: form.endereco, contato_emergencia: form.contato_emergencia,
    };
    const resp = form.id
      ? await supabase.from('tutores').update(dados).eq('id', form.id)
      : await supabase.from('tutores').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro ao salvar: ' + resp.error.message); return; }
    setAberto(false);
    carregar();
  }

  async function excluir(t: Tutor) {
    if (!window.confirm(`Excluir o tutor ${t.nome}?`)) return;
    const { error } = await supabase.from('tutores').delete().eq('id', t.id);
    if (error) window.alert('Não foi possível excluir — verifique se há pets vinculados a este tutor.');
    carregar();
  }

  const filtrados = tutores.filter((t) =>
    t.nome.toLowerCase().includes(busca.toLowerCase()) || (t.cpf ?? '').includes(busca),
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Tutores</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSearchbar
          placeholder="Buscar por nome ou CPF..."
          value={busca}
          onIonInput={(e) => setBusca(e.detail.value ?? '')}
        />
        {carregando ? (
          <IonSpinner />
        ) : filtrados.length === 0 ? (
          <IonText color="medium"><p className="ion-padding">Nenhum tutor encontrado.</p></IonText>
        ) : (
          <IonList>
            {filtrados.map((t) => (
              <IonItem key={t.id}>
                <IonLabel>
                  <h2>{t.nome}</h2>
                  <p>{t.telefone}{t.email ? ` · ${t.email}` : ''}</p>
                  <p>CPF: {t.cpf ?? '—'}</p>
                </IonLabel>
                <IonButton fill="clear" slot="end" onClick={() => { setForm(t); setAberto(true); }}>
                  <IonIcon slot="icon-only" icon={createOutline} />
                </IonButton>
                <IonButton fill="clear" color="danger" slot="end" onClick={() => excluir(t)}>
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => { setForm(VAZIO); setAberto(true); }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={aberto} onDidDismiss={() => setAberto(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>{form.id ? 'Editar tutor' : 'Novo tutor'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setAberto(false)}><IonIcon slot="icon-only" icon={close} /></IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={salvar}>
              <IonInput className="ion-margin-bottom" label="Nome completo *" labelPlacement="stacked" value={form.nome} onIonInput={(e) => set('nome', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="CPF" labelPlacement="stacked" placeholder="000.000.000-00" value={form.cpf ?? ''} onIonInput={(e) => set('cpf', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Telefone" labelPlacement="stacked" placeholder="(14) 90000-0000" value={form.telefone ?? ''} onIonInput={(e) => set('telefone', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="E-mail" labelPlacement="stacked" type="email" value={form.email ?? ''} onIonInput={(e) => set('email', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Endereço" labelPlacement="stacked" value={form.endereco ?? ''} onIonInput={(e) => set('endereco', e.detail.value ?? '')} />
              <IonInput className="ion-margin-bottom" label="Contato de emergência" labelPlacement="stacked" value={form.contato_emergencia ?? ''} onIonInput={(e) => set('contato_emergencia', e.detail.value ?? '')} />
              <IonButton type="submit" expand="block" className="ion-margin-top" disabled={salvando}>
                {salvando ? <IonSpinner name="crescent" /> : 'Salvar tutor'}
              </IonButton>
            </form>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
