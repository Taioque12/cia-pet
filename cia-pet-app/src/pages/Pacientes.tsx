import { useEffect, useState, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonText, IonSearchbar,
  IonBadge, IonButton, IonIcon, IonFab, IonFabButton, IonModal, IonInput,
  IonTextarea, IonSelect, IonSelectOption,
} from '@ionic/react';
import { add, createOutline, trashOutline, close, documentTextOutline } from 'ionicons/icons';
import { supabase } from '../lib/supabase';

interface PetRow {
  id: string; nome: string; especie: string; raca: string | null;
  porte: string | null; nascimento: string | null; tutor_id: string;
  alergias: string | null; condicoes: string | null;
  tutores: { nome: string } | null;
}
interface TutorOpc { id: string; nome: string; }

const VAZIO: Partial<PetRow> = {
  nome: '', especie: '', raca: '', porte: '', nascimento: '', tutor_id: '',
  alergias: '', condicoes: '',
};

function idade(nascimento: string | null): string {
  if (!nascimento) return '—';
  const n = new Date(nascimento), h = new Date();
  let anos = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) anos--;
  return anos <= 0 ? 'menos de 1 ano' : `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}

export default function Pacientes() {
  const history = useHistory();
  const [pets, setPets] = useState<PetRow[]>([]);
  const [tutoresOpc, setTutoresOpc] = useState<TutorOpc[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Partial<PetRow>>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [p, t] = await Promise.all([
      supabase.from('pets').select('id, nome, especie, raca, porte, nascimento, tutor_id, alergias, condicoes, tutores(nome)').order('nome'),
      supabase.from('tutores').select('id, nome').order('nome'),
    ]);
    setPets((p.data as unknown as PetRow[]) ?? []);
    setTutoresOpc((t.data as TutorOpc[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const set = (campo: keyof PetRow, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.nome?.trim()) { window.alert('Informe o nome do pet.'); return; }
    if (!form.tutor_id) { window.alert('Selecione o tutor responsável.'); return; }
    if (!form.especie) { window.alert('Selecione a espécie.'); return; }
    setSalvando(true);
    const dados = {
      nome: form.nome, especie: form.especie, raca: form.raca, porte: form.porte || null,
      nascimento: form.nascimento || null, tutor_id: form.tutor_id,
      alergias: form.alergias, condicoes: form.condicoes,
    };
    const resp = form.id
      ? await supabase.from('pets').update(dados).eq('id', form.id)
      : await supabase.from('pets').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro ao salvar: ' + resp.error.message); return; }
    setAberto(false);
    carregar();
  }

  async function excluir(p: PetRow) {
    if (!window.confirm(`Excluir o paciente ${p.nome}? O histórico clínico também será removido.`)) return;
    const { error } = await supabase.from('pets').delete().eq('id', p.id);
    if (error) window.alert('Erro ao excluir: ' + error.message);
    carregar();
  }

  const filtrados = pets.filter((p) => {
    const t = busca.toLowerCase();
    return p.nome.toLowerCase().includes(t) || (p.raca ?? '').toLowerCase().includes(t) || (p.tutores?.nome ?? '').toLowerCase().includes(t);
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Pacientes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSearchbar placeholder="Buscar por nome, raça ou tutor..." value={busca} onIonInput={(e) => setBusca(e.detail.value ?? '')} />
        {carregando ? (
          <IonSpinner />
        ) : filtrados.length === 0 ? (
          <IonText color="medium"><p className="ion-padding">Nenhum paciente encontrado.</p></IonText>
        ) : (
          <IonList>
            {filtrados.map((p) => (
              <IonItem key={p.id}>
                <IonLabel>
                  <h2>{p.nome}</h2>
                  <p>{p.especie}{p.raca ? ` · ${p.raca}` : ''} · {idade(p.nascimento)}</p>
                  <p>Tutor: {p.tutores?.nome ?? '—'}</p>
                </IonLabel>
                {p.porte && <IonBadge color="secondary">{p.porte}</IonBadge>}
                <IonButton fill="clear" color="medium" slot="end" title="Prontuários" onClick={() => history.push(`/pacientes/${p.id}/prontuarios`)}>
                  <IonIcon slot="icon-only" icon={documentTextOutline} />
                </IonButton>
                <IonButton fill="clear" slot="end" onClick={() => { setForm(p); setAberto(true); }}>
                  <IonIcon slot="icon-only" icon={createOutline} />
                </IonButton>
                <IonButton fill="clear" color="danger" slot="end" onClick={() => excluir(p)}>
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
              <IonTitle>{form.id ? 'Editar paciente' : 'Novo paciente'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setAberto(false)}><IonIcon slot="icon-only" icon={close} /></IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={salvar}>
              <IonSelect className="ion-margin-bottom" label="Tutor responsável *" labelPlacement="stacked" placeholder="Selecione" value={form.tutor_id} onIonChange={(e) => set('tutor_id', e.detail.value)}>
                {tutoresOpc.map((t) => <IonSelectOption key={t.id} value={t.id}>{t.nome}</IonSelectOption>)}
              </IonSelect>
              <IonInput className="ion-margin-bottom" label="Nome do pet *" labelPlacement="stacked" value={form.nome} onIonInput={(e) => set('nome', e.detail.value ?? '')} />
              <IonSelect className="ion-margin-bottom" label="Espécie *" labelPlacement="stacked" placeholder="Selecione" value={form.especie} onIonChange={(e) => set('especie', e.detail.value)}>
                {['Canino', 'Felino', 'Ave', 'Roedor', 'Réptil', 'Outro'].map((x) => <IonSelectOption key={x} value={x}>{x}</IonSelectOption>)}
              </IonSelect>
              <IonInput className="ion-margin-bottom" label="Raça" labelPlacement="stacked" placeholder="Ex.: Dachshund, Siamês, SRD" value={form.raca ?? ''} onIonInput={(e) => set('raca', e.detail.value ?? '')} />
              <IonSelect className="ion-margin-bottom" label="Porte" labelPlacement="stacked" placeholder="Selecione" value={form.porte ?? ''} onIonChange={(e) => set('porte', e.detail.value)}>
                {['Pequeno', 'Médio', 'Grande', 'Gigante'].map((x) => <IonSelectOption key={x} value={x}>{x}</IonSelectOption>)}
              </IonSelect>
              <IonInput className="ion-margin-bottom" label="Data de nascimento" labelPlacement="stacked" type="date" value={form.nascimento ?? ''} onIonInput={(e) => set('nascimento', e.detail.value ?? '')} />
              <IonTextarea className="ion-margin-bottom" label="Alergias" labelPlacement="stacked" autoGrow placeholder="Vital para medicação e escolha de shampoos" value={form.alergias ?? ''} onIonInput={(e) => set('alergias', e.detail.value ?? '')} />
              <IonTextarea className="ion-margin-bottom" label="Condições preexistentes" labelPlacement="stacked" autoGrow value={form.condicoes ?? ''} onIonInput={(e) => set('condicoes', e.detail.value ?? '')} />
              <IonButton type="submit" expand="block" className="ion-margin-top" disabled={salvando}>
                {salvando ? <IonSpinner name="crescent" /> : 'Salvar paciente'}
              </IonButton>
            </form>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
