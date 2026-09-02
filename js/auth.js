// Lógica da tela de login — usada por login.html
const loginForm = document.getElementById('loginForm');
const authError = document.getElementById('authError');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.hidden = true;

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      authError.textContent = 'E-mail ou senha incorretos. Confira com o Jônatas.';
      authError.hidden = false;
      return;
    }

    // Busca o perfil pra saber se é admin (Jônatas) ou aluno
    const { data: perfil, error: perfilError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (perfilError || !perfil) {
      authError.textContent = 'Login feito, mas seu perfil ainda não foi cadastrado. Fale com o Jônatas.';
      authError.hidden = false;
      return;
    }

    // Guarda a flag no localStorage para decisões instantâneas no carregamento
    localStorage.setItem('is_admin', perfil.is_admin ? 'true' : 'false');

    window.location.href = perfil.is_admin ? 'admin.html' : 'area-aluno.html';
  });
}

// Função usada nas páginas protegidas (area-aluno.html e admin.html)
// pra garantir que só quem está logado (e com o perfil certo) acesse.
async function exigirLogin({ precisaSerAdmin = false } = {}) {
  // Check síncrono instantâneo via localStorage antes da chamada assíncrona
  const cachedIsAdmin = localStorage.getItem('is_admin');
  
  if (precisaSerAdmin && cachedIsAdmin === 'false') {
    window.location.href = 'area-aluno.html';
    return null;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    localStorage.removeItem('is_admin');
    window.location.href = 'login.html';
    return null;
  }

  const { data: perfil, error } = await supabaseClient
    .from('profiles')
    .select('id, nome, is_admin')
    .eq('id', session.user.id)
    .single();

  if (error || !perfil) {
    localStorage.removeItem('is_admin');
    window.location.href = 'login.html';
    return null;
  }

  // Atualiza o cache do perfil
  localStorage.setItem('is_admin', perfil.is_admin ? 'true' : 'false');

  if (precisaSerAdmin && !perfil.is_admin) {
    window.location.href = 'area-aluno.html';
    return null;
  }

  return perfil;
}

async function sair() {
  localStorage.removeItem('is_admin');
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}