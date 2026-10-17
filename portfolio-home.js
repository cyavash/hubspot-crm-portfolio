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
