import { useEffect, useState, type FormEvent } from 'react';
import {
  IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle,
  IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonText, IonSearchbar,
  IonBadge, IonButton, IonIcon, IonFab, IonFabButton, IonModal, IonInput,
  IonTextarea, IonSelect, IonSelectOption, IonGrid, IonRow, IonCol, IonCard,
  IonCardContent,
} from '@ionic/react';
import { add, createOutline, trashOutline, close, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import { supabase } from '../lib/supabase';

interface Insumo {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  minimo: number;
  validade: string | null;
  observacao: string | null;
}

const CATEGORIAS = ['Medicamentos', 'Vacinas', 'Materiais Cirúrgicos', 'Higiene / Cosméticos', 'Alimentação', 'Administrativo', 'Outros'];

const VAZIO = {
  nome: '', categoria: '', unidade: '', quantidade: '0', minimo: '0', validade: '', observacao: '',
};

function diasParaVencer(validade: string | null): number | null {
  if (!validade) return null;
  return Math.ceil((new Date(validade).getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5);
}

function situacao(i: Insumo): 'vencido' | 'vencendo' | 'baixo' | 'ok' {
  const dias = diasParaVencer(i.validade);
  if (dias !== null && dias < 0) return 'vencido';
  if (dias !== null && dias <= 30) return 'vencendo';
  if (i.quantidade <= i.minimo) return 'baixo';
  return 'ok';
}

function BadgeSituacao({ insumo }: { insumo: Insumo }) {
  const s = situacao(insumo);
  const dias = diasParaVencer(insumo.validade);
  if (s === 'vencido') return <IonBadge color="danger">Vencido</IonBadge>;
  if (s === 'vencendo') return <IonBadge color="warning">Vence em {dias}d</IonBadge>;
  if (s === 'baixo') return <IonBadge color="warning">Estoque baixo</IonBadge>;
  return <IonBadge color="success">OK</IonBadge>;
}

export default function Estoque() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase.from('insumos').select('*').order('nome');
    setInsumos((data as Insumo[]) ?? []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const set = (campo: string, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { window.alert('Informe o nome do insumo.'); return; }
    if (!form.categoria) { window.alert('Selecione a categoria.'); return; }
    if (!form.unidade.trim()) { window.alert('Informe a unidade (ex.: un, ml, kg).'); return; }
    setSalvando(true);
    const dados = {
      nome: form.nome,
      categoria: form.categoria,
      unidade: form.unidade,
      quantidade: parseInt(form.quantidade) || 0,
      minimo: parseInt(form.minimo) || 0,
      validade: form.validade || null,
      observacao: form.observacao || null,
    };
    const resp = form.id
      ? await supabase.from('insumos').update(dados).eq('id', form.id)
      : await supabase.from('insumos').insert(dados);
    setSalvando(false);
    if (resp.error) { window.alert('Erro ao salvar: ' + resp.error.message); return; }
    setAberto(false);
    carregar();
  }

  async function excluir(i: Insumo) {
    if (!window.confirm(`Excluir "${i.nome}" do estoque?`)) return;
    const { error } = await supabase.from('insumos').delete().eq('id', i.id);
    if (error) window.alert('Erro ao excluir: ' + error.message);
    else carregar();
  }

  async function movimentar(i: Insumo, tipo: 'entrada' | 'saida') {
    const acao = tipo === 'entrada' ? 'Entrada (repor)' : 'Saída (dar baixa)';
    const qtdStr = window.prompt(`${acao} — ${i.nome}\nEstoque atual: ${i.quantidade} ${i.unidade}\n\nInforme a quantidade:`, '1');
    if (qtdStr === null) return;
    const qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd <= 0) { window.alert('Informe um número válido maior que zero.'); return; }
    const nova = tipo === 'entrada' ? i.quantidade + qtd : i.quantidade - qtd;
    if (nova < 0) { window.alert('Estoque insuficiente para essa saída.'); return; }
    const { error } = await supabase.from('insumos').update({ quantidade: nova }).eq('id', i.id);
    if (error) window.alert('Erro: ' + error.message);
    else carregar();
  }

  function abrirEditar(i: Insumo) {
    setForm({
      id: i.id,
      nome: i.nome,
      categoria: i.categoria,
      unidade: i.unidade,
      quantidade: String(i.quantidade),
      minimo: String(i.minimo),
      validade: i.validade ?? '',
      observacao: i.observacao ?? '',
    });
    setAberto(true);
  }

  const filtrados = insumos.filter((i) => {
    const t = busca.toLowerCase();
    const nomeMatch = i.nome.toLowerCase().includes(t) || (i.observacao ?? '').toLowerCase().includes(t);
    const catMatch = !filtroCategoria || i.categoria === filtroCategoria;
    return nomeMatch && catMatch;
  });

  const totalBaixo = insumos.filter((i) => situacao(i) === 'baixo').length;
  const totalVencendo = insumos.filter((i) => { const s = situacao(i); return s === 'vencido' || s === 'vencendo'; }).length;
  const totalCategorias = new Set(insumos.map((i) => i.categoria)).size;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Estoque / Insumos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">

        {/* Cards de estatísticas */}
        <IonGrid className="ion-no-padding ion-margin-bottom">
          <IonRow>
            {[
              { label: 'Total', valor: insumos.length, cor: 'primary' },
              { label: 'Estoque baixo', valor: totalBaixo, cor: totalBaixo > 0 ? 'warning' : 'medium' },
              { label: 'Validade', valor: totalVencendo, cor: totalVencendo > 0 ? 'danger' : 'medium' },
              { label: 'Categorias', valor: totalCategorias, cor: 'secondary' },
            ].map(({ label, valor, cor }) => (
              <IonCol key={label} size="6" sizeMd="3">
                <IonCard style={{ margin: '4px' }}>
                  <IonCardContent style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: `var(--ion-color-${cor})` }}>{valor}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{label}</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        <IonSearchbar
          placeholder="Buscar por nome ou observação..."
          value={busca}
          onIonInput={(e) => setBusca(e.detail.value ?? '')}
        />

        <IonSelect
          style={{ marginBottom: 8 }}
          label="Categoria"
          labelPlacement="stacked"
          placeholder="Todas as categorias"
          value={filtroCategoria}
          onIonChange={(e) => setFiltroCategoria(e.detail.value ?? '')}
        >
          <IonSelectOption value="">Todas</IonSelectOption>
          {CATEGORIAS.map((c) => <IonSelectOption key={c} value={c}>{c}</IonSelectOption>)}
        </IonSelect>

        {carregando ? (
          <IonSpinner />
        ) : filtrados.length === 0 ? (
          <IonText color="medium"><p className="ion-padding">Nenhum insumo encontrado.</p></IonText>
        ) : (
          <IonList>
            {filtrados.map((i) => {
              const s = situacao(i);
              const qtdCor = s === 'baixo' ? 'danger' : 'dark';
              return (
                <IonItem key={i.id} lines="full">
                  <IonLabel className="ion-text-wrap">
                    <h2>{i.nome}</h2>
                    <p>{i.categoria}</p>
                    {i.observacao && <p style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium)' }}>{i.observacao}</p>}
                    <p>
                      <IonText color={qtdCor}><strong>{i.quantidade}</strong></IonText>
                      {' / mín. '}{i.minimo} {i.unidade}
                      {i.validade && ` · Val.: ${new Date(i.validade).toLocaleDateString('pt-BR')}`}
                    </p>
                  </IonLabel>
                  <BadgeSituacao insumo={i} />
                  <IonButton fill="clear" color="success" slot="end" title="Entrada" onClick={() => movimentar(i, 'entrada')}>
                    <IonIcon slot="icon-only" icon={addCircleOutline} />
                  </IonButton>
                  <IonButton fill="clear" color="warning" slot="end" title="Saída" onClick={() => movimentar(i, 'saida')}>
                    <IonIcon slot="icon-only" icon={removeCircleOutline} />
                  </IonButton>
                  <IonButton fill="clear" slot="end" onClick={() => abrirEditar(i)}>
                    <IonIcon slot="icon-only" icon={createOutline} />
                  </IonButton>
                  <IonButton fill="clear" color="danger" slot="end" onClick={() => excluir(i)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </IonItem>
              );
            })}
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
              <IonTitle>{form.id ? 'Editar insumo' : 'Novo insumo'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setAberto(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={salvar}>
              <IonInput
                className="ion-margin-bottom"
                label="Nome do insumo *"
                labelPlacement="stacked"
                placeholder="Ex.: Amoxicilina 500mg"
                value={form.nome}
                onIonInput={(e) => set('nome', e.detail.value ?? '')}
              />
              <IonSelect
                className="ion-margin-bottom"
                label="Categoria *"
                labelPlacement="stacked"
                placeholder="Selecione"
                value={form.categoria}
                onIonChange={(e) => set('categoria', e.detail.value)}
              >
                {CATEGORIAS.map((c) => <IonSelectOption key={c} value={c}>{c}</IonSelectOption>)}
              </IonSelect>
              <IonInput
                className="ion-margin-bottom"
                label="Unidade *"
                labelPlacement="stacked"
                placeholder="Ex.: un, ml, kg, caixa"
                value={form.unidade}
                onIonInput={(e) => set('unidade', e.detail.value ?? '')}
              />
              <IonInput
                className="ion-margin-bottom"
                label="Quantidade em estoque"
                labelPlacement="stacked"
                type="number"
                inputmode="numeric"
                value={form.quantidade}
                onIonInput={(e) => set('quantidade', e.detail.value ?? '0')}
              />
              <IonInput
                className="ion-margin-bottom"
                label="Quantidade mínima (alerta)"
                labelPlacement="stacked"
                type="number"
                inputmode="numeric"
                value={form.minimo}
                onIonInput={(e) => set('minimo', e.detail.value ?? '0')}
              />
              <IonInput
                className="ion-margin-bottom"
                label="Validade"
                labelPlacement="stacked"
                type="date"
                value={form.validade}
                onIonInput={(e) => set('validade', e.detail.value ?? '')}
              />
              <IonTextarea
                className="ion-margin-bottom"
                label="Observação"
                labelPlacement="stacked"
                autoGrow
                placeholder="Ex.: Manter refrigerado"
                value={form.observacao}
                onIonInput={(e) => set('observacao', e.detail.value ?? '')}
              />
              <IonButton type="submit" expand="block" className="ion-margin-top" disabled={salvando}>
                {salvando ? <IonSpinner name="crescent" /> : 'Salvar insumo'}
              </IonButton>
            </form>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
