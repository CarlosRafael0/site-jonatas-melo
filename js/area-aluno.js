// Lógica da área do aluno — busca treino e progresso no Supabase
let alunoAtual = null;
let treinosPorDia = {};
let chart = null;

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
    ${exercicios.map(ex => `
      <article class="exercise">
        <div class="exercise__video">
          ${ex.video_url
            ? `<video controls src="${ex.video_url}"></video>`
            : `<div class="exercise__no-video">Sem vídeo</div>`}
        </div>
        <div class="exercise__info">
          <h3>${ex.exercicio}</h3>
          <span class="exercise__sets">${ex.series_reps}</span>
          ${ex.observacao ? `<p class="exercise__note">${ex.observacao}</p>` : ''}
        </div>
      </article>
    `).join('')}
  `;
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
  if (comPeso.length > 0) {
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
