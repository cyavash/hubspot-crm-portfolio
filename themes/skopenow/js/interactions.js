/** Progressive, instance-scoped testimonials and optional scroll motion. */
(() => {
  'use strict';

  function enhanceCarousel(root) {
    if (root.dataset.sdEnhanced) return;
    const slides = [...root.querySelectorAll('[data-sd-slide]')];
    const controls = root.querySelector('[data-sd-controls]');
    const previous = root.querySelector('[data-sd-prev]');
    const next = root.querySelector('[data-sd-next]');
    const status = root.querySelector('[data-sd-status]');
    if (slides.length < 2 || !controls || !previous || !next || !status) return;

    let selected = 0;
    function show(index) {
      selected = Math.max(0, Math.min(slides.length - 1, index));
      slides.forEach((slide, position) => {
        slide.hidden = position !== selected;
      });
      status.textContent = `${selected + 1} of ${slides.length} testimonials`;
    }
    previous.addEventListener('click', () => show((selected - 1 + slides.length) % slides.length));
    next.addEventListener('click', () => show((selected + 1) % slides.length));
    controls.addEventListener('keydown', (event) => {
      const targets = {
        ArrowLeft: (selected - 1 + slides.length) % slides.length,
        ArrowRight: (selected + 1) % slides.length,
        Home: 0,
        End: slides.length - 1,
      };
      if (!(event.key in targets) || !event.target.matches('button')) return;
      event.preventDefault();
      show(targets[event.key]);
    });
    root.dataset.sdEnhanced = 'true';
    root.setAttribute('aria-roledescription', 'carousel');
    show(0);
    controls.hidden = false;
  }

  function enhanceReveals() {
    const elements = [...document.querySelectorAll('[data-reveal]')];
    if (!('IntersectionObserver' in window) || !window.matchMedia) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.dataset.revealState = 'shown';
        observer.unobserve(target);
      });
    }, { threshold: 0.05 });
    elements.forEach((element) => {
      // Above-the-fold content never waits for an observer callback.
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.dataset.revealState = 'waiting';
      observer.observe(element);
    });
    preference.addEventListener?.('change', (event) => {
      if (!event.matches) return;
      observer.disconnect();
      elements.forEach((element) => { element.dataset.revealState = 'shown'; });
    });
    window.addEventListener('beforeprint', () => {
      observer.disconnect();
      elements.forEach((element) => { element.dataset.revealState = 'shown'; });
    }, { once: true });
    document.addEventListener('focusin', (event) => {
      const section = event.target.closest?.('[data-reveal-state="waiting"]');
      if (section) {
        section.dataset.revealState = 'shown';
        observer.unobserve(section);
      }
    });
  }

  function initialize() {
    document.querySelectorAll('[data-sd-carousel]').forEach(enhanceCarousel);
    enhanceReveals();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
