/** Client-side filtering enhances an already readable blog listing. */
(() => {
  'use strict';
  const form = document.querySelector('[data-blog-search]');
  if (!form) return;
  const input = form.querySelector('input');
  const filterBar = document.querySelector('[data-blog-filters]');
  const cards = [...document.querySelectorAll('[data-article]')];
  const count = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-empty]');
  let topic = 'all';
  function update() {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const matchesTopic = topic === 'all' || card.dataset.category.split(' ').includes(topic);
      const matchesQuery = card.textContent.toLocaleLowerCase().includes(query);
      card.hidden = !(matchesTopic && matchesQuery);
      if (!card.hidden) visible++;
    });
    count.textContent = `${visible} ${visible === 1 ? 'article' : 'articles'}`;
    empty.hidden = visible > 0;
    filterBar.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === topic)));
  }
  input.addEventListener('input', update);
  form.addEventListener('submit', event => { event.preventDefault(); update(); });
  filterBar.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    topic = button.dataset.filter;
    update();
  });
  document.querySelector('[data-reset]').addEventListener('click', () => { topic = 'all'; input.value = ''; update(); input.focus(); });
  filterBar.hidden = false;
})();
