// Lógica do painel do Jônatas (admin) — gerenciar treinos e ver progresso dos alunos
let adminAtual = null;
let alunoSelecionadoId = null;
let alunoSelecionadoSexo = 'M';
let bibliotecaExercicios = [];

const DIAS = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

async function init() {
  adminAtual = await exigirLogin({ precisaSerAdmin: true });
  if (!adminAtual) return;

  // Associa o formulário de novo aluno da sidebar
  const formNovoAluno = document.getElementById('formNovoAluno');
  if (formNovoAluno) {
    formNovoAluno.addEventListener('submit', cadastrarNovoAluno);
  }

  await carregarBiblioteca();
  await carregarAlunos();
}

/**
 * Cadastra um novo aluno no Auth e insere na tabela profiles
 */
async function cadastrarNovoAluno(e) {
  e.preventDefault();

  const nomeInput = document.getElementById('novoAlunoNome');
  const emailInput = document.getElementById('novoAlunoEmail');
  const senhaInput = document.getElementById('novoAlunoSenha');
  const sexoSelect = document.getElementById('novoAlunoSexo');

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const password = senhaInput.value;
  const sexo = sexoSelect ? sexoSelect.value : 'M';

  mostrarToast('Cadastrando aluno...');

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { nome }
    }
  });

  if (authError) {
    mostrarToast(authError.message, 'erro');
    return;
  }

  if (authData.user) {
    // 2. Inserir registro na tabela profiles com o campo sexo
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        nome: nome,
        sexo: sexo,
        is_admin: false
      });

    if (profileError) {
      mostrarToast('Erro ao criar perfil: ' + profileError.message, 'erro');
    } else {
      mostrarToast('Aluno cadastrado com sucesso!');
      nomeInput.value = '';
      emailInput.value = '';
      senhaInput.value = '';
      await carregarAlunos();
    }
  }
}

/**
 * Carrega a biblioteca global de exercícios do Supabase
 */
async function carregarBiblioteca() {
  const { data, error } = await supabaseClient
    .from('exercicios_base')
    .select('*')
    .order('nome', { ascending: true });

  if (!error && data) {
    bibliotecaExercicios = data;
    const datalist = document.getElementById('listaBiblioteca');
    if (datalist) {
      datalist.innerHTML = data.map(ex => `<option value="${ex.nome}">`).join('');
    }
  }
}

/**
 * Preenche o campo de vídeo automaticamente com base no gênero do aluno selecionado
 */
function preencherVideoDaBiblioteca(nomeDigitado) {
  const exercicioEncontrado = bibliotecaExercicios.find(
    ex => ex.nome.toLowerCase() === nomeDigitado.toLowerCase()
  );

  const inputVideo = document.getElementById('exVideo');
  if (exercicioEncontrado && inputVideo) {
    const videoUrl = alunoSelecionadoSexo === 'F' 
      ? (exercicioEncontrado.video_url_f || exercicioEncontrado.video_url)
      : (exercicioEncontrado.video_url_m || exercicioEncontrado.video_url);

    inputVideo.value = videoUrl || '';
  }
}

/**
 * Exibe notificações toast no canto da tela
 */
function mostrarToast(mensagem, tipo = 'sucesso') {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;

  toast.textContent = mensagem;
  toast.className = `toast-notification is-visible ${tipo}`;

  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3000);
}

/**
 * Filtra a lista de alunos em tempo real sem refazer requisição ao banco
 */
function filtrarAlunos(termo) {
  const busca = termo.toLowerCase().trim();
  const elementos = document.querySelectorAll('.admin-student-item');

  elementos.forEach(el => {
    const nome = el.textContent.toLowerCase();
    if (nome.includes(busca)) {
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });
}

async function carregarAlunos() {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, nome, sexo')
    .eq('is_admin', false)
    .order('nome', { ascending: true });

  const lista = document.getElementById('listaAlunos');

  if (error || !data || data.length === 0) {
    lista.innerHTML = '<p class="day-panel__placeholder">Nenhum aluno cadastrado ainda.</p>';
    return;
  }

  lista.innerHTML = data.map(aluno => `
    <button class="admin-student-item" data-id="${aluno.id}" data-sexo="${aluno.sexo || 'M'}">${aluno.nome}</button>
  `).join('');

  lista.querySelectorAll('.admin-student-item').forEach(btn => {
    btn.addEventListener('click', () => selecionarAluno(btn.dataset.id, btn.textContent, btn.dataset.sexo));
  });

  const buscaInput = document.getElementById('buscaAluno');
  if (buscaInput && buscaInput.value) {
    filtrarAlunos(buscaInput.value);
  }
}

async function selecionarAluno(alunoId, nome, sexo = 'M') {
  alunoSelecionadoId = alunoId;
  alunoSelecionadoSexo = sexo;

  document.querySelectorAll('.admin-student-item').forEach(b => b.classList.remove('is-active'));
  const btnAtivo = document.querySelector(`.admin-student-item[data-id="${alunoId}"]`);
  if (btnAtivo) btnAtivo.classList.add('is-active');

  const content = document.getElementById('adminContent');
  content.innerHTML = `
    <h2 class="day-panel__title">${nome}</h2>

    <form id="novoExercicioForm" class="admin-exercise-form">
      <select id="exDia" required>
        ${DIAS.map(d => `<option value="${d.key}">${d.label}</option>`).join('')}
      </select>
      <input 
        type="text" 
        id="exNome" 
        list="listaBiblioteca" 
        placeholder="Nome do exercício" 
        oninput="preencherVideoDaBiblioteca(this.value)" 
        required
      >
      <input type="text" id="exSeries" placeholder="Ex: 4x10" required>
      <input type="url" id="exVideo" placeholder="Link do vídeo (automático)">
      <input type="text" id="exObs" placeholder="Observação (opcional)">
      <button type="submit">Adicionar exercício</button>
    </form>

    <div id="listaExercicios" class="admin-exercise-list">Carregando treino...</div>

    <h2 class="day-panel__title" style="margin-top:48px">Progresso registrado</h2>
    <div id="listaProgressoAdmin">Carregando...</div>
  `;

  document.getElementById('novoExercicioForm').addEventListener('submit', adicionarExercicio);

  await carregarExerciciosDoAluno();
  await carregarProgressoDoAluno();
}

async function carregarExerciciosDoAluno() {
  const { data, error } = await supabaseClient
    .from('treinos')
    .select('*')
    .eq('aluno_id', alunoSelecionadoId)
    .order('dia_semana', { ascending: true })
    .order('ordem', { ascending: true });

  const lista = document.getElementById('listaExercicios');
  if (error || !data || data.length === 0) {
    lista.innerHTML = '<p class="day-panel__placeholder">Nenhum exercício cadastrado ainda pra esse aluno.</p>';
    return;
  }

  const porDia = {};
  data.forEach(ex => {
    if (!porDia[ex.dia_semana]) porDia[ex.dia_semana] = [];
    porDia[ex.dia_semana].push(ex);
  });

  lista.innerHTML = DIAS.filter(d => porDia[d.key]).map(d => `
    <div class="admin-day-group">
      <h4>${d.label}</h4>
      ${porDia[d.key].map(ex => {
        let embedUrl = ex.video_url;
        if (embedUrl) {
          let videoId = '';
          if (embedUrl.includes('shorts/')) {
            videoId = embedUrl.split('shorts/')[1].split('?')[0];
          } else if (embedUrl.includes('watch?v=')) {
            videoId = embedUrl.split('watch?v=')[1].split('&')[0];
          } else if (embedUrl.includes('youtu.be/')) {
            videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
          }

          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&mute=1`;
          }
        }

        return `
          <div class="admin-exercise-row">
            ${embedUrl ? `
              <div class="exercise-thumb-video">
                <iframe src="${embedUrl}" allowfullscreen></iframe>
              </div>
            ` : ''}
            <div class="exercise-info">
              <span class="exercise-name">${ex.exercicio}</span>
              <span class="exercise-meta">${ex.series_reps} ${ex.observacao ? `• ${ex.observacao}` : ''}</span>
            </div>
            <button class="admin-remove" data-id="${ex.id}">Remover</button>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  lista.querySelectorAll('.admin-remove').forEach(btn => {
    btn.addEventListener('click', () => removerExercicio(btn.dataset.id));
  });
}

async function adicionarExercicio(e) {
  e.preventDefault();

  const nomeExercicio = document.getElementById('exNome').value.trim();
  const videoUrl = document.getElementById('exVideo').value.trim() || null;

  const { error } = await supabaseClient.from('treinos').insert({
    aluno_id: alunoSelecionadoId,
    dia_semana: document.getElementById('exDia').value,
    exercicio: nomeExercicio,
    series_reps: document.getElementById('exSeries').value.trim(),
    video_url: videoUrl,
    observacao: document.getElementById('exObs').value.trim() || null,
  });

  if (!error) {
    const jaExisteNaBiblioteca = bibliotecaExercicios.some(
      ex => ex.nome.toLowerCase() === nomeExercicio.toLowerCase()
    );

    if (!jaExisteNaBiblioteca && videoUrl) {
      const novoExercicioData = {
        nome: nomeExercicio,
        video_url: videoUrl
      };

      if (alunoSelecionadoSexo === 'F') {
        novoExercicioData.video_url_f = videoUrl;
      } else {
        novoExercicioData.video_url_m = videoUrl;
      }

      await supabaseClient.from('exercicios_base').insert(novoExercicioData);
      await carregarBiblioteca();
    }

    document.getElementById('novoExercicioForm').reset();
    mostrarToast('Exercício adicionado com sucesso!');
    await carregarExerciciosDoAluno();
  } else {
    mostrarToast('Erro ao adicionar exercício.', 'erro');
  }
}

async function removerExercicio(id) {
  const { error } = await supabaseClient.from('treinos').delete().eq('id', id);
  if (!error) {
    mostrarToast('Exercício removido!', 'erro');
    await carregarExerciciosDoAluno();
  } else {
    mostrarToast('Erro ao remover exercício.', 'erro');
  }
}

async function carregarProgressoDoAluno() {
  const { data, error } = await supabaseClient
    .from('progresso')
    .select('*')
    .eq('aluno_id', alunoSelecionadoId)
    .order('data', { ascending: false });

  const container = document.getElementById('listaProgressoAdmin');
  if (error || !data || data.length === 0) {
    container.innerHTML = '<p class="day-panel__placeholder">Esse aluno ainda não registrou progresso.</p>';
    return;
  }

  container.innerHTML = data.map(r => `
    <div class="progress-item">
      <span class="progress-item__date">${r.data.split('-').reverse().join('/')}</span>
      <span class="progress-item__peso">${r.peso_kg ? r.peso_kg + ' kg' : '—'}</span>
      <span class="progress-item__obs">${r.observacao || ''}</span>
    </div>
  `).join('');
}

init();