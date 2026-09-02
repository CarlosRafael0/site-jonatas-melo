// Lógica da área do aluno — busca treino e progresso no Supabase
let alunoAtual = null;
let treinosPorDia = {};
let chart = null;

// Lógica do Cronômetro de Descanso
let tempoRestante = 0;
let timerInterval = null;

const DIAS_LABEL = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };

async function init() {
  alunoAtual = await exigirLogin({ precisaSerAdmin: false });
  if (!alunoAtual) return;

  document.getElementById('nomeAluno').textContent = alunoAtual.nome;

  await carregarTreino();
  await carregarProgresso();

  mostrarDia('seg');

  document.querySelectorAll('.days__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.days__tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      mostrarDia(tab.dataset.day);
    });
  });

  document.getElementById('progressoForm').addEventListener('submit', registrarProgresso);
}

/**
 * Converte qualquer link do YouTube em URL de Embed funcional para iframe
 */
function obterUrlEmbed(url) {
  if (!url || typeof url !== 'string') return null;

  let urlLimpa = url.trim();
  let videoId = null;

  try {
    // Normaliza para protocolo completo se necessário
    if (!urlLimpa.startsWith('http://') && !urlLimpa.startsWith('https://')) {
      urlLimpa = 'https://' + urlLimpa;
    }

    const parsedUrl = new URL(urlLimpa);

    if (parsedUrl.hostname.includes('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/shorts/')) {
        videoId = parsedUrl.pathname.split('/shorts/')[1].split('/')[0];
      } else if (parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.split('/embed/')[1].split('/')[0];
      } else {
        videoId = parsedUrl.searchParams.get('v');
      }
    } else if (parsedUrl.hostname.includes('youtu.be')) {
      videoId = parsedUrl.pathname.substring(1).split('/')[0];
    }
  } catch (e) {
    // Fallback por Expressão Regular caso a URL esteja mal formatada
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = urlLimpa.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
  }

  // Remove caracteres residuais caso venham na string
  if (videoId) {
    videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  return videoId 
    ? `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}` 
    : null;
}

/**
 * Alterna a classe de concluído ao clicar no checkbox do exercício
 */
function toggleExercicioConcluido(input) {
  const card = input.closest('.exercise');
  if (card) {
    card.classList.toggle('is-completed', input.checked);
  }
}

async function carregarTreino() {
  const { data, error } = await supabaseClient
    .from('treinos')
    .select('*')
    .eq('aluno_id', alunoAtual.id)
    .order('ordem', { ascending: true });

  treinosPorDia = {};
  if (!error && data) {
    data.forEach(ex => {
      if (!treinosPorDia[ex.dia_semana]) treinosPorDia[ex.dia_semana] = [];
      treinosPorDia[ex.dia_semana].push(ex);
    });
  }
}

function mostrarDia(dia) {
  const container = document.getElementById('treinoContainer');
  const exercicios = treinosPorDia[dia] || [];

  if (exercicios.length === 0) {
    container.innerHTML = `
      <h2 class="day-panel__title">${DIAS_LABEL[dia]}</h2>
      <p class="day-panel__placeholder">Nenhum exercício cadastrado pra esse dia ainda. Fale com o Jônatas.</p>
    `;
    return;
  }

  container.innerHTML = `
    <h2 class="day-panel__title">${DIAS_LABEL[dia]}</h2>
    ${exercicios.map(ex => {
      const urlEmbed = obterUrlEmbed(ex.video_url);
      return `
        <article class="exercise">
          <div class="exercise__header">
            <label class="exercise__check">
              <input type="checkbox" onchange="toggleExercicioConcluido(this)">
            </label>
            <div class="exercise__info">
              <h3>${ex.exercicio}</h3>
              <span class="exercise__sets">${ex.series_reps}</span>
            </div>
          </div>

          ${ex.observacao ? `<p class="exercise__note">${ex.observacao}</p>` : ''}

          ${urlEmbed ? `
            <div class="video-container">
              <iframe 
                src="${urlEmbed}" 
                title="${ex.exercicio}"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
              </iframe>
            </div>
          ` : ''}
        </article>
      `;
    }).join('')}
  `;
}

/* ============================================
   FUNÇÕES DO CRONÔMETRO DE DESCANSO
   ============================================ */
function iniciarTimer(segundos) {
  clearInterval(timerInterval);
  tempoRestante = segundos;
  atualizarDisplayTimer();

  timerInterval = setInterval(() => {
    tempoRestante--;
    atualizarDisplayTimer();

    if (tempoRestante <= 0) {
      clearInterval(timerInterval);
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      alert('Tempo de descanso finalizado!');
    }
  }, 1000);
}

function pararTimer() {
  clearInterval(timerInterval);
  tempoRestante = 0;
  atualizarDisplayTimer();
}

function atualizarDisplayTimer() {
  const min = String(Math.floor(tempoRestante / 60)).padStart(2, '0');
  const seg = String(tempoRestante % 60).padStart(2, '0');
  const display = document.getElementById('timerDisplay');
  if (display) display.innerText = `${min}:${seg}`;
}

async function carregarProgresso() {
  const { data, error } = await supabaseClient
    .from('progresso')
    .select('*')
    .eq('aluno_id', alunoAtual.id)
    .order('data', { ascending: true });

  if (error || !data) return;

  // Lista
  const lista = document.getElementById('progressoLista');
  lista.innerHTML = data.slice().reverse().map(r => `
    <div class="progress-item">
      <span class="progress-item__date">${formatarData(r.data)}</span>
      <span class="progress-item__peso">${r.peso_kg ? r.peso_kg + ' kg' : '—'}</span>
      <span class="progress-item__obs">${r.observacao || ''}</span>
    </div>
  `).join('') || '<p class="day-panel__placeholder">Nenhum registro ainda.</p>';

  // Gráfico
  const comPeso = data.filter(r => r.peso_kg != null);
  const ctx = document.getElementById('progressoChart');
  if (chart) chart.destroy();
  if (comPeso.length > 0 && ctx) {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: comPeso.map(r => formatarData(r.data)),
        datasets: [{
          label: 'Peso (kg)',
          data: comPeso.map(r => r.peso_kg),
          borderColor: '#E5231B',
          backgroundColor: 'rgba(229,35,27,0.15)',
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9A9A9E' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: '#9A9A9E' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
    });
  }
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

async function registrarProgresso(e) {
  e.preventDefault();
  const peso = document.getElementById('peso').value;
  const obs = document.getElementById('obs').value.trim();

  if (!peso && !obs) return;

  const { error } = await supabaseClient.from('progresso').insert({
    aluno_id: alunoAtual.id,
    peso_kg: peso ? parseFloat(peso) : null,
    observacao: obs || null,
  });

  if (!error) {
    document.getElementById('progressoForm').reset();
    await carregarProgresso();
  }
}

init();