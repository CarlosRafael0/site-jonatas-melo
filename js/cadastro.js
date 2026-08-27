const signupForm = document.getElementById('signupForm');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: { full_name: nome }
      }
    });

    if (error) {
      alert("Erro ao cadastrar: " + error.message);
      return;
    }

    alert("Conta criada com sucesso! Faça login para entrar.");
    window.location.href = 'login.html';
  });
}