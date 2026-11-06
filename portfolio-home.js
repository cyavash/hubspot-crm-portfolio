/** Project filters progressively enhance the complete, readable project grid. */
(() => {
 'use strict';
 const toolbar = document.querySelector('[data-project-filters]');
 if (!toolbar) return;
 const buttons = [...toolbar.querySelectorAll('[data-project-filter]')];
 const cards = [...document.querySelectorAll('[data-project]')];
 const count = document.querySelector('[data-project-count]');
 buttons.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.projectFilter;
  let visible = 0;
  cards.forEach(card => {
   const matches = category === 'all' || card.dataset.category.split(' ').includes(category);
   card.hidden = !matches;
   if (matches) visible++;
  });
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  if (count) count.textContent = visible + (visible === 1 ? ' project' : ' projects');
 }));
 toolbar.hidden = false;
})();

/** Animate visible content only; never hide content or require motion to navigate. */
(() => {
 if (typeof window.matchMedia !== 'function') return;
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
 const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   if (!entry.isIntersecting) return;
   if (!motion.matches) entry.target.animate(
    [{transform:'translateY(14px)',opacity:.7},{transform:'translateY(0)',opacity:1}],
    {duration:460,easing:'cubic-bezier(.2,.7,.2,1)'}
   );
   observer.unobserve(entry.target);
  });
 }, {threshold:.08});
 document.querySelectorAll('.section-head,.index-card,.engagement-grid article').forEach(el=>observer.observe(el));
})();
