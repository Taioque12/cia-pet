/* =============================================================
   CIA ANIMAL — Autenticação (PROTÓTIPO / simulada)
   ============================================================= */

const formLogin = document.getElementById('formLogin');
const alertaErro = document.getElementById('alertaErro');

// se já houver sessão ativa, vai direto ao painel
if (DB.sessao()) {
  window.location.href = 'painel.html';
}

formLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  const { usuario, senha } = Object.fromEntries(new FormData(formLogin).entries());

  const u = DB.login(usuario.trim(), senha);
  if (u) {
    window.location.href = 'painel.html';
  } else {
    document.getElementById('alertaErroTexto').textContent =
      'Credenciais inválidas. Verifique o e-mail/CRMV e a senha.';
    alertaErro.classList.add('aparece');
  }
});
