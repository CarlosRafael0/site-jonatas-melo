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
