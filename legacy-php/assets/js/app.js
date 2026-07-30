document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-confirm]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (!confirm(el.getAttribute('data-confirm'))) {
        e.preventDefault();
      }
    });
  });

  // Subtle entrance for cards
  document.querySelectorAll('.card, .kpi, .portal-card').forEach((el, i) => {
    el.style.animation = `rise 0.5s ease ${Math.min(i * 0.04, 0.4)}s both`;
  });
});
