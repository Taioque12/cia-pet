/* =============================================================
   CIA ANIMAL — Página inicial (navegação + agendamento)
   ============================================================= */

// ---- menu mobile ------------------------------------------------------
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');
if (menuToggle) {
  menuToggle.addEventListener('click', () => menu.classList.toggle('aberto'));
  menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => menu.classList.remove('aberto'))
  );
}

// ---- formulário de agendamento ---------------------------------------
const form = document.getElementById('formAgendamento');
const alertaOk = document.getElementById('alertaOk');
const alertaErro = document.getElementById('alertaErro');

function mostrarAlerta(elemento, texto, idTexto) {
  document.getElementById(idTexto).textContent = texto;
  alertaOk.classList.remove('aparece');
  alertaErro.classList.remove('aparece');
  elemento.classList.add('aparece');
  elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// impede selecionar datas passadas
const inputData = form?.querySelector('input[name="data"]');
if (inputData) inputData.min = new Date().toISOString().slice(0, 10);

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form).entries());

    // validação simples
    for (const [campo, valor] of Object.entries(dados)) {
      if (!valor || !valor.trim()) {
        mostrarAlerta(alertaErro, 'Por favor, preencha todos os campos obrigatórios.', 'alertaErroTexto');
        return;
      }
    }

    // registra o agendamento com status "Pendente"
    DB.add('agendamentos', {
      ...dados,
      status: 'Pendente',
      criadoEm: new Date().toISOString(),
    });

    /* Nota técnica: em um sistema real, este é o ponto onde o back-end
       dispararia o alerta para a recepção (ex.: notificação no painel,
       e-mail ou mensagem) além de gravar o registro como "Pendente". */

    mostrarAlerta(
      alertaOk,
      `Solicitação enviada com sucesso! O agendamento de ${dados.petNome} (${dados.setor}) está PENDENTE e a recepção entrará em contato pelo telefone ${dados.tutorTelefone} para confirmar.`,
      'alertaOkTexto'
    );
    form.reset();
  });
}
