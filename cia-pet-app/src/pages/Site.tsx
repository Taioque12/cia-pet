import { useState, useRef, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { supabase } from '../lib/supabase';
import '../site.css';

const HOJE = new Date().toISOString().slice(0, 10);

const VAZIO = { tutorNome: '', tutorTelefone: '', petNome: '', setor: '', data: '', turno: '' };

export default function Site() {
  const history = useHistory();
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  function ir(id: string) {
    setMenuAberto(false);
    const el = document.getElementById(id);
    if (el && contentRef.current) {
      contentRef.current.scrollToPoint(0, el.offsetTop - 70, 600);
    }
  }

  const set = (c: string, v: string) => setForm((f) => ({ ...f, [c]: v }));

  async function agendar(e: FormEvent) {
    e.preventDefault();
    setSucesso(''); setErro('');
    for (const [, v] of Object.entries(form)) {
      if (!v.trim()) { setErro('Preencha todos os campos obrigatórios.'); return; }
    }
    setEnviando(true);
    const setorDB = form.setor === 'Clínica Veterinária' ? 'Clínica Veterinária' : 'Banho e Tosa';
    const { error } = await supabase.from('agendamentos').insert({
      tutor_nome: form.tutorNome,
      tutor_telefone: form.tutorTelefone,
      pet_nome: form.petNome,
      setor: setorDB,
      data: form.data,
      turno: form.turno,
      status: 'Pendente',
    });
    setEnviando(false);
    if (error) { setErro(`Erro: ${error.message} (${error.code})`); return; }
    setSucesso(`Solicitação enviada! O agendamento de ${form.petNome} (${form.setor}) está PENDENTE. A recepção entrará em contato pelo ${form.tutorTelefone} para confirmar.`);
    setForm(VAZIO);
  }

  return (
    <IonPage>
    <IonContent ref={contentRef} scrollY>
    <div className="sp-root">
      {/* HEADER */}
      <header className="sp-header" style={{ position: 'relative' }}>
        <div className="sp-container sp-header-inner">
          <a href="#inicio" className="sp-logo" onClick={(e) => { e.preventDefault(); ir('inicio'); }}>
            <div className="sp-logo-icone">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8 3 5 6 5c2 0 3.2 1.2 4 2.4C10.8 6.2 12 5 14 5c3 0 5 3 3.5 6.8C19.5 16.4 12 21 12 21z"/></svg>
            </div>
            <span className="sp-logo-texto">Cia Pet<small>Clínica · Banho & Tosa</small></span>
          </a>
          <nav className={`sp-nav${menuAberto ? ' aberto' : ''}`}>
            <a href="#inicio" onClick={(e) => { e.preventDefault(); ir('inicio'); }}>Início</a>
            <a href="#sobre" onClick={(e) => { e.preventDefault(); ir('sobre'); }}>Sobre Nós</a>
            <a href="#identidade" onClick={(e) => { e.preventDefault(); ir('identidade'); }}>Identidade</a>
            <a href="#agendamento" onClick={(e) => { e.preventDefault(); ir('agendamento'); }}>Agendamento</a>
            <a href="/login" className="sp-btn-restrita" onClick={(e) => { e.preventDefault(); history.push('/login'); }}>Área Restrita</a>
          </nav>
          <button className="sp-menu-toggle" onClick={() => setMenuAberto((v) => !v)} aria-label="Menu">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="sp-hero" id="inicio">
        <div className="sp-container sp-grid-2">
          <div>
            <span className="sp-olho">Cuidando de quem você ama</span>
            <h1 className="sp-h1">Saúde e bem-estar para o seu <span>melhor amigo</span></h1>
            <p>Clínica veterinária completa, banho e tosa com profissionais apaixonados por animais. Agende em poucos cliques e cuide do seu pet com quem entende do assunto.</p>
            <div className="sp-hero-acoes">
              <a href="#agendamento" className="sp-btn sp-btn-laranja" onClick={(e) => { e.preventDefault(); ir('agendamento'); }}>📅 Agendar agora</a>
              <a href="#sobre" className="sp-btn sp-btn-contorno" onClick={(e) => { e.preventDefault(); ir('sobre'); }}>Conheça a clínica</a>
            </div>
            <div className="sp-hero-selos">
              <div className="sp-selo"><b>+12</b><span>anos de história</span></div>
              <div className="sp-selo"><b>+8 mil</b><span>pets atendidos</span></div>
              <div className="sp-selo"><b>2 setores</b><span>Clínica e Estética</span></div>
            </div>
          </div>
          <div className="sp-hero-arte">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 9.5a2 2 0 11.001-4.001A2 2 0 014.5 9.5zm5-2a2 2 0 11.001-4.001A2 2 0 019.5 7.5zm5 0a2 2 0 11.001-4.001A2 2 0 0114.5 7.5zm5 2a2 2 0 11.001-4.001A2 2 0 0119.5 9.5zM12 11c-2.5 0-6 2.8-6 5.5 0 1.7 1.3 2.5 2.8 2.5 1 0 2-.4 3.2-.4s2.2.4 3.2.4c1.5 0 2.8-.8 2.8-2.5C18 13.8 14.5 11 12 11z"/></svg>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="sp-secao">
        <div className="sp-container">
          <div className="sp-centro">
            <span className="sp-olho">Nossos serviços</span>
            <h2 className="sp-h2">Tudo o que o seu pet precisa em um só lugar</h2>
            <p className="sp-subtitulo">Da consulta de rotina ao banho relaxante, oferecemos cuidado completo com estrutura e carinho.</p>
          </div>
          <div className="sp-grid-3" style={{ marginTop: 46 }}>
            {[
              { titulo: 'Clínica Veterinária', texto: 'Consultas, vacinas, exames, prescrições e acompanhamento clínico com prontuário digital completo.', icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0012 5.5 4.5 4.5 0 002 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7z"/></svg>, laranja: false },
              { titulo: 'Banho & Tosa', texto: 'Estética animal com produtos adequados a cada pelagem, porte e necessidade — inclusive peles sensíveis.', icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18"/><circle cx="12" cy="12" r="9"/></svg>, laranja: true },
              { titulo: 'Atendimento humanizado', texto: 'Equipe que trata cada animal com respeito e cada tutor com transparência e atenção desde a chegada.', icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/></svg>, laranja: false },
            ].map((s) => (
              <div key={s.titulo} className="sp-card">
                <div className={`sp-card-icone${s.laranja ? ' sp-card-icone--laranja' : ''}`}>{s.icone}</div>
                <h3>{s.titulo}</h3>
                <p>{s.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE NÓS */}
      <section className="sp-secao sp-secao-cinza" id="sobre">
        <div className="sp-container sp-grid-2">
          <div className="sp-sobre-arte">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#2a9d78" strokeWidth="1.4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <div className="sp-sobre-ano"><b>2013</b><span>Ano de fundação</span></div>
          </div>
          <div>
            <span className="sp-olho">Sobre Nós</span>
            <h2 className="sp-h2">Nossa história e fundação</h2>
            <p className="sp-subtitulo" style={{ marginBottom: 14 }}>
              A <strong>Cia Pet</strong> nasceu em <strong>2013</strong>, do sonho do médico veterinário <strong>Dr. Ighor Morales</strong>, que uniu experiência clínica e paixão pelos animais para criar um espaço de cuidado de verdade.
            </p>
            <p className="sp-subtitulo">
              O que começou como um pequeno consultório cresceu e se tornou uma clínica completa, com setor de estética (banho e tosa) e uma equipe dedicada. Em mais de uma década, já cuidamos de milhares de pets.
            </p>
            <ul className="sp-lista-check">
              {['Estrutura própria para clínica e estética', 'Equipe formada e em constante atualização', 'Histórico clínico digital de cada paciente'].map((item) => (
                <li key={item}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* IDENTIDADE */}
      <section className="sp-secao" id="identidade">
        <div className="sp-container">
          <div className="sp-centro">
            <span className="sp-olho">Identidade Organizacional</span>
            <h2 className="sp-h2">Visão, Missão e Valores</h2>
            <p className="sp-subtitulo">Os princípios que guiam cada atendimento na Cia Pet.</p>
          </div>
          <div className="sp-grid-3" style={{ marginTop: 46 }}>
            {[
              { titulo: 'Visão', texto: 'Ser reconhecida como referência regional em medicina veterinária e estética animal, unindo tecnologia, ética e acolhimento como padrão de cuidado.', laranja: false, icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
              { titulo: 'Missão', texto: 'Promover saúde, bem-estar e qualidade de vida aos animais por meio de um atendimento responsável, ágil e humano — buscando excelência contínua nos serviços.', laranja: true, icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> },
              { titulo: 'Valores', texto: 'Ética e respeito à vida animal · Compromisso com o bem-estar · Transparência com os tutores · Empatia · Responsabilidade e atualização profissional.', laranja: false, icone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8 3 5 6 5c2 0 3.2 1.2 4 2.4C10.8 6.2 12 5 14 5c3 0 5 3 3.5 6.8C19.5 16.4 12 21 12 21z"/></svg> },
            ].map((s) => (
              <div key={s.titulo} className="sp-card">
                <div className={`sp-card-icone${s.laranja ? ' sp-card-icone--laranja' : ''}`}>{s.icone}</div>
                <h3>{s.titulo}</h3>
                <p>{s.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENDAMENTO + CONTATO */}
      <section className="sp-secao sp-secao-cinza" id="agendamento">
        <div className="sp-container">
          <div className="sp-centro">
            <span className="sp-olho">Agendamento & Contato</span>
            <h2 className="sp-h2">Agende a visita do seu pet</h2>
            <p className="sp-subtitulo">Preencha o formulário e nossa recepção entrará em contato para confirmar.</p>
          </div>
          <div className="sp-contato-grid">
            {/* Info de contato */}
            <div>
              {[
                { titulo: 'Telefone & WhatsApp', conteudo: <><p>(14) 3264-7135</p><a href="https://wa.me/551432647135" target="_blank" rel="noreferrer">💬 Chamar no WhatsApp →</a></>, icone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/></svg> },
                { titulo: 'E-mail', conteudo: <a href="mailto:contato@ciapet.com.br">contato@ciapet.com.br</a>, icone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg> },
                { titulo: 'Endereço', conteudo: <p>R. Rio Grande do Sul — Jardim Cruzeiro<br/>Lençóis Paulista / SP · CEP 18680-550</p>, icone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
                { titulo: 'Horário de funcionamento', conteudo: <p>Seg a Sex: 08h às 12h e 13h30 às 18h<br/>Sáb: 08h às 12h</p>, icone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              ].map((item) => (
                <div key={item.titulo} className="sp-contato-item">
                  <div className="sp-contato-icone">{item.icone}</div>
                  <div><h4>{item.titulo}</h4>{item.conteudo}</div>
                </div>
              ))}
              <div className="sp-mapa">
                <iframe title="Mapa Cia Pet" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-48.810%2C-22.608%2C-48.788%2C-22.592&layer=mapnik&marker=-22.600%2C-48.797" />
              </div>
            </div>

            {/* Formulário */}
            <div className="sp-form-card">
              <h3>Formulário de agendamento</h3>
              <p style={{ color: 'var(--cinza)', fontSize: '.92rem', marginBottom: 20 }}>Campos com <span style={{ color: '#d64545' }}>*</span> são obrigatórios.</p>

              {sucesso && <div className="sp-alerta sp-alerta-ok"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>{sucesso}</div>}
              {erro && <div className="sp-alerta sp-alerta-err"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{erro}</div>}

              <form onSubmit={agendar} noValidate>
                <div className="sp-campo-duplo">
                  <div className="sp-campo">
                    <label>Nome do tutor <span className="sp-obrig">*</span></label>
                    <input type="text" placeholder="Seu nome completo" value={form.tutorNome} onChange={(e) => set('tutorNome', e.target.value)} />
                  </div>
                  <div className="sp-campo">
                    <label>Telefone de contato <span className="sp-obrig">*</span></label>
                    <input type="tel" placeholder="(14) 9 0000-0000" value={form.tutorTelefone} onChange={(e) => set('tutorTelefone', e.target.value)} />
                  </div>
                </div>
                <div className="sp-campo">
                  <label>Nome do pet <span className="sp-obrig">*</span></label>
                  <input type="text" placeholder="Nome do seu animal" value={form.petNome} onChange={(e) => set('petNome', e.target.value)} />
                </div>
                <div className="sp-campo">
                  <label>Setor desejado <span className="sp-obrig">*</span></label>
                  <select value={form.setor} onChange={(e) => set('setor', e.target.value)}>
                    <option value="">Selecione o setor...</option>
                    <option value="Clínica Veterinária">Clínica Veterinária</option>
                    <option value="Banho e Tosa">Banho & Tosa</option>
                  </select>
                </div>
                <div className="sp-campo-duplo">
                  <div className="sp-campo">
                    <label>Data desejada <span className="sp-obrig">*</span></label>
                    <input type="date" min={HOJE} value={form.data} onChange={(e) => set('data', e.target.value)} />
                  </div>
                  <div className="sp-campo">
                    <label>Turno <span className="sp-obrig">*</span></label>
                    <select value={form.turno} onChange={(e) => set('turno', e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="Manhã (08h–12h)">Manhã (08h–12h)</option>
                      <option value="Tarde (13h30–18h)">Tarde (13h30–18h)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="sp-btn sp-btn-laranja sp-btn-bloco" disabled={enviando}>
                  {enviando ? 'Enviando...' : '📅 Solicitar agendamento'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '.85rem', color: 'var(--cinza)', marginTop: 12 }}>
                  Sua solicitação entra como <strong>Pendente</strong> e aguarda confirmação da recepção.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="sp-rodape">
        <div className="sp-container">
          <div className="sp-rodape-grid">
            <div className="sp-rodape-logo">
              <div className="sp-logo">
                <div className="sp-logo-icone"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8 3 5 6 5c2 0 3.2 1.2 4 2.4C10.8 6.2 12 5 14 5c3 0 5 3 3.5 6.8C19.5 16.4 12 21 12 21z"/></svg></div>
                <span className="sp-logo-texto">Cia Pet<small>Clínica · Banho & Tosa</small></span>
              </div>
              <p>Cuidado, saúde e carinho para o seu melhor amigo desde 2013.</p>
              <div className="sp-redes">
                <a href="#" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
                <a href="#" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>
              </div>
            </div>
            <div>
              <h4>Navegação</h4>
              <a href="#inicio" onClick={(e) => { e.preventDefault(); ir('inicio'); }}>Início</a>
              <a href="#sobre" onClick={(e) => { e.preventDefault(); ir('sobre'); }}>Sobre Nós</a>
              <a href="#identidade" onClick={(e) => { e.preventDefault(); ir('identidade'); }}>Identidade</a>
              <a href="#agendamento" onClick={(e) => { e.preventDefault(); ir('agendamento'); }}>Agendamento</a>
            </div>
            <div>
              <h4>Serviços</h4>
              <a href="#agendamento" onClick={(e) => { e.preventDefault(); ir('agendamento'); }}>Clínica Veterinária</a>
              <a href="#agendamento" onClick={(e) => { e.preventDefault(); ir('agendamento'); }}>Banho & Tosa</a>
              <a href="/login" onClick={(e) => { e.preventDefault(); history.push('/login'); }}>Área Restrita</a>
            </div>
            <div>
              <h4>Contato</h4>
              <a>📍 R. Rio Grande do Sul — Jardim Cruzeiro, Lençóis Paulista/SP</a>
              <a href="tel:+551432647135">📞 (14) 3264-7135</a>
              <a href="mailto:contato@ciapet.com.br">✉️ contato@ciapet.com.br</a>
              <a>🕐 Seg–Sex 08h–12h · 13h30–18h · Sáb 08h–12h</a>
            </div>
          </div>
          <div className="sp-rodape-base">
            <span>CNPJ: 12.624.267/0001-39 · Cia Pet Clínica Veterinária Ltda.</span>
            <span>© 2026 Cia Pet — Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
    </IonContent>
    </IonPage>
  );
}
