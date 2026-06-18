import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonList, IonItem, IonLabel, IonText, IonSpinner, IonFab,
  IonFabButton, IonIcon, IonModal, IonInput, IonTextarea, IonButton,
} from '@ionic/react';
import { add, trashOutline, createOutline, close } from 'ionicons/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth';

interface Prontuario {
  id: string;
  pet_id: string;
  funcionario_id: string | null;
  anamnese: string;
  peso: number | null;
  vacinas: string | null;
  exames: string | null;
  prescricao: string | null;
  criado_em: string;
  funcionarios: { nome: string } | null;
}

interface Pet { id: string; nome: string; especie: string; }

const VAZIO = { anamnese: '', peso: '', vacinas: '', exames: '', prescricao: '' };

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Prontuarios() {
  const { petId } = useParams<{ petId: string }>();
  const { session } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [petRes, pRes] = await Promise.all([
      supabase.from('pets').select('id, nome, especie').eq('id', petId).single(),
      supabase.from('prontuarios')
        .select('*, funcionarios(nome)')
        .eq('pet_id', petId)
        .order('criado_em', { ascending: false }),
    ]);
    setPet(petRes.data as Pet);
    setProntuarios((pRes.data as unknown as Prontuario[]) ?? []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [petId]);

  const set = (campo: string, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.anamnese.trim()) { window.alert('Informe a anamnese / observações clínicas.'); return; }
    setSalvando(true);
    const dados = {
      pet_id: petId,
      funcionario_id: session?.user.id ?? null,
      anamnese: form.anamnese,
      peso: form.peso ? parseFloat(form.peso) : null,
      vacinas: form.vacinas || null,
      exames: form.exames || null,
      prescricao: form.prescricao || null,
    };
    const resp = form.id
      ? await supabase.from('prontuarios').update(dados).eq('id', form.id)
      : await supabase.from('prontuarios').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro ao salvar: ' + resp.error.message); return; }
    setAberto(false);
    carregar();
  }

  async function excluir(p: Prontuario) {
    if (!window.confirm('Excluir este prontuário? A ação não pode ser desfeita.')) return;
    const { error } = await supabase.from('prontuarios').delete().eq('id', p.id);
    if (error) window.alert('Erro ao excluir: ' + error.message);
    else carregar();
  }

  function abrirEditar(p: Prontuario) {
    setForm({
      id: p.id,
      anamnese: p.anamnese,
      peso: p.peso != null ? String(p.peso) : '',
      vacinas: p.vacinas ?? '',
      exames: p.exames ?? '',
      prescricao: p.prescricao ?? '',
    });
    setAberto(true);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/pacientes" text="Pacientes" />
          </IonButtons>
          <IonTitle>Prontuários{pet ? ` — ${pet.nome}` : ''}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {carregando ? (
          <IonSpinner />
        ) : prontuarios.length === 0 ? (
          <IonText color="medium">
            <p className="ion-padding">Nenhum prontuário registrado para {pet?.nome ?? 'este paciente'}.</p>
          </IonText>
        ) : (
          <IonList>
            {prontuarios.map((p) => (
              <IonItem key={p.id} lines="full">
                <IonLabel className="ion-text-wrap">
                  <p style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
                    {formatarData(p.criado_em)}
                    {p.funcionarios ? ` · ${p.funcionarios.nome}` : ''}
                    {p.peso ? ` · ${p.peso} kg` : ''}
                  </p>
                  <h3 style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{p.anamnese}</h3>
                  {p.vacinas && <p><strong>Vacinas:</strong> {p.vacinas}</p>}
                  {p.exames && <p><strong>Exames:</strong> {p.exames}</p>}
                  {p.prescricao && <p><strong>Prescrição:</strong> {p.prescricao}</p>}
                </IonLabel>
                <IonButton fill="clear" slot="end" onClick={() => abrirEditar(p)}>
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
              <IonTitle>{form.id ? 'Editar prontuário' : 'Novo prontuário'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setAberto(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={salvar}>
              <IonTextarea
                className="ion-margin-bottom"
                label="Anamnese / Observações clínicas *"
                labelPlacement="stacked"
                autoGrow
                rows={4}
                placeholder="Sintomas, exame físico, diagnóstico..."
                value={form.anamnese}
                onIonInput={(e) => set('anamnese', e.detail.value ?? '')}
              />
              <IonInput
                className="ion-margin-bottom"
                label="Peso (kg)"
                labelPlacement="stacked"
                type="number"
                inputmode="decimal"
                placeholder="Ex.: 4.5"
                value={form.peso}
                onIonInput={(e) => set('peso', e.detail.value ?? '')}
              />
              <IonTextarea
                className="ion-margin-bottom"
                label="Vacinas aplicadas"
                labelPlacement="stacked"
                autoGrow
                placeholder="Ex.: V10, Antirrábica..."
                value={form.vacinas}
                onIonInput={(e) => set('vacinas', e.detail.value ?? '')}
              />
              <IonTextarea
                className="ion-margin-bottom"
                label="Exames solicitados / resultados"
                labelPlacement="stacked"
                autoGrow
                placeholder="Ex.: Hemograma completo — resultado normal"
                value={form.exames}
                onIonInput={(e) => set('exames', e.detail.value ?? '')}
              />
              <IonTextarea
                className="ion-margin-bottom"
                label="Prescrição / Tratamento"
                labelPlacement="stacked"
                autoGrow
                placeholder="Medicamentos, dosagem, período..."
                value={form.prescricao}
                onIonInput={(e) => set('prescricao', e.detail.value ?? '')}
              />
              <IonButton type="submit" expand="block" className="ion-margin-top" disabled={salvando}>
                {salvando ? <IonSpinner name="crescent" /> : 'Salvar prontuário'}
              </IonButton>
            </form>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
