// Alterna entre os painéis de treino por dia da semana
const tabs = document.querySelectorAll('.days__tab');
const panels = document.querySelectorAll('.day-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const day = tab.dataset.day;

    tabs.forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    panels.forEach(p => p.classList.remove('is-active'));
    const target = document.getElementById('dia-' + day);
    if (target) target.classList.add('is-active');
  });
});

/**
 * Função utilitária para converter links normais do YouTube/Shorts
 * em links de iframe (embed) válidos.
 */
function obterUrlEmbed(url) {
  if (!url) return null;
  
  // Trata vídeos normais, Shorts e links encurtados do YouTube
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  
  return url;
}

/**
 * Monta o HTML do card do exercício incluindo o vídeo embutido se houver link
 */
function criarCardExercicio(ex) {
  const urlEmbed = obterUrlEmbed(ex.video_url);

  return `
    <div class="exercise-card">
      <div class="exercise-header">
        <div class="exercise-info">
          <h3 class="exercise-name">${ex.nome}</h3>
          <span class="exercise-series">${ex.series_repeticoes}</span>
        </div>
      </div>

      ${ex.observacao ? `<p class="exercise-obs">${ex.observacao}</p>` : ''}

      ${urlEmbed ? `
        <div class="video-container">
          <iframe 
            src="${urlEmbed}" 
            title="${ex.nome}"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      ` : ''}
    </div>
  `;
}