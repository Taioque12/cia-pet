import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonList, IonItem, IonLabel, IonText, IonSpinner, IonFab,
  IonFabButton, IonIcon, IonModal, IonInput, IonTextarea, IonButton,
} from '@ionic/react';
import { add, trashOutline, createOutline, close, printOutline } from 'ionicons/icons';
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

interface Pet { id: string; nome: string; especie: string; tutores: { nome: string } | null; }
interface Vet { nome: string; crmv: string | null; }

const VAZIO = { anamnese: '', peso: '', vacinas: '', exames: '', prescricao: '' };

// Dados fixos da clínica (cabeçalho do receituário).
const CLINICA = {
  nome: 'Cia Pet',
  endereco: 'R. Rio Grande do Sul, Jardim Cruzeiro — Lençóis Paulista/SP',
  telefone: '(14) 3264-7135',
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function dataExtenso(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

// Gera o HTML completo (A4) do receituário e dispara a impressão num iframe oculto,
// o que evita bloqueio de pop-up e funciona no navegador e no app (Capacitor).
function imprimirReceituario(opts: {
  vet: Vet | null; emailFallback: string; pet: Pet | null;
  prescricao: string; peso: number | null; criadoEm: string;
}) {
  const vetNome = opts.vet?.nome || opts.emailFallback || 'Médico(a) Veterinário(a)';
  const vetCrmv = opts.vet?.crmv || '';
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Receituário — ${esc(opts.pet?.nome ?? '')}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a2e27; margin: 0; }
  .topo { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2a9d78; padding-bottom: 14px; }
  .marca { font-size: 26px; font-weight: 800; color: #1c6f54; letter-spacing: .5px; }
  .sub { font-size: 12px; color: #5f6f69; margin-top: 4px; line-height: 1.5; }
  .vet { text-align: right; font-size: 13px; }
  .vet b { display: block; font-size: 15px; color: #1a2e27; }
  .titulo { text-align: center; font-size: 20px; font-weight: 800; letter-spacing: 3px; color: #1c6f54; margin: 28px 0 18px; }
  .box { border: 1px solid #d9e6e0; border-radius: 8px; padding: 14px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 13px; }
  .box .l { color: #5f6f69; }
  .box .v { font-weight: 700; }
  .corpo { margin-top: 26px; min-height: 320px; font-size: 15px; line-height: 1.9; white-space: pre-wrap; }
  .assin { margin-top: 70px; text-align: center; font-size: 13px; }
  .linha { width: 280px; margin: 0 auto 6px; border-top: 1px solid #1a2e27; }
  .rodape { margin-top: 40px; border-top: 1px solid #e0e8e4; padding-top: 10px; text-align: center; font-size: 11px; color: #8a9a94; }
</style></head><body>
  <div class="topo">
    <div>
      <div class="marca">🐾 ${esc(CLINICA.nome)}</div>
      <div class="sub">${esc(CLINICA.endereco)}<br>Telefone: ${esc(CLINICA.telefone)}</div>
    </div>
    <div class="vet">
      <b>${esc(vetNome)}</b>
      ${vetCrmv ? `Méd. Vet. · ${esc(vetCrmv)}` : 'Médico(a) Veterinário(a)'}
    </div>
  </div>

  <div class="titulo">RECEITUÁRIO</div>

  <div class="box">
    <div><span class="l">Paciente:</span> <span class="v">${esc(opts.pet?.nome ?? '—')}</span></div>
    <div><span class="l">Espécie:</span> <span class="v">${esc(opts.pet?.especie ?? '—')}</span></div>
    <div><span class="l">Tutor(a):</span> <span class="v">${esc(opts.pet?.tutores?.nome ?? '—')}</span></div>
    <div><span class="l">Data:</span> <span class="v">${esc(dataExtenso(opts.criadoEm))}</span></div>
    ${opts.peso ? `<div><span class="l">Peso:</span> <span class="v">${opts.peso} kg</span></div>` : ''}
  </div>

  <div class="corpo">${esc(opts.prescricao)}</div>

  <div class="assin">
    <div class="linha"></div>
    <b>${esc(vetNome)}</b>${vetCrmv ? ` — ${esc(vetCrmv)}` : ''}
    <div style="margin-top:18px;color:#5f6f69;">Lençóis Paulista, ${esc(dataExtenso(opts.criadoEm))}</div>
  </div>

  <div class="rodape">Documento emitido pelo sistema Cia Pet</div>
</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open(); doc.write(html); doc.close();
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    }, 250);
  };
}

export default function Prontuarios() {
  const { petId } = useParams<{ petId: string }>();
  const { session } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [vet, setVet] = useState<Vet | null>(null);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [petRes, pRes, vetRes] = await Promise.all([
      supabase.from('pets').select('id, nome, especie, tutores(nome)').eq('id', petId).single(),
      supabase.from('prontuarios')
        .select('*, funcionarios(nome)')
        .eq('pet_id', petId)
        .order('criado_em', { ascending: false }),
      session?.user.id
        ? supabase.from('funcionarios').select('nome, crmv').eq('id', session.user.id).single()
        : Promise.resolve({ data: null }),
    ]);
    setPet(petRes.data as unknown as Pet);
    setVet((vetRes.data as Vet | null) ?? null);
    setProntuarios((pRes.data as unknown as Prontuario[]) ?? []);
    setCarregando(false);
  }

  function imprimir(p: Prontuario) {
    if (!p.prescricao?.trim()) {
      window.alert('Este prontuário não tem prescrição. Edite o prontuário e preencha o campo "Prescrição / Tratamento" antes de imprimir o receituário.');
      return;
    }
    imprimirReceituario({
      vet,
      emailFallback: session?.user.email ?? '',
      pet,
      prescricao: p.prescricao,
      peso: p.peso,
      criadoEm: p.criado_em,
    });
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
                <IonButton fill="clear" color="success" slot="end" title="Imprimir receituário" onClick={() => imprimir(p)}>
                  <IonIcon slot="icon-only" icon={printOutline} />
                </IonButton>
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
