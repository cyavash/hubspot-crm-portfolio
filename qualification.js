/** A browser-only qualification example. No storage, requests or client rules. */
(() => {
  'use strict';
  const form = document.querySelector('[data-qualification]');
  if (!form) return;
  const steps = [...form.querySelectorAll('[data-step]')];
  const next = form.querySelector('[data-next]');
  const back = form.querySelector('[data-back]');
  const finish = form.querySelector('[data-finish]');
  const error = form.querySelector('[data-form-error]');
  const status = form.querySelector('[data-form-status]');
  let active = 0;
  function render(moveFocus = true) {
    form.querySelector('[data-complete]').hidden = true;
    finish.disabled = false;
    steps.forEach((step, i) => {
      step.hidden = i !== active;
      // Inactive controls do not participate in browser validation or form data.
      step.disabled = i !== active;
    });
    back.hidden = active === 0;
    next.hidden = active === steps.length - 1;
    finish.hidden = active !== steps.length - 1;
    status.textContent = `Step ${active + 1} of ${steps.length}`;
    error.textContent = '';
    if (active === steps.length - 1) {
      const review = form.querySelector('[data-review]');
      review.replaceChildren();
      for (const [label, name] of [['Goal','goal'],['Budget','budget'],['Timing','timing']]) {
        const selected = form.querySelector(`[name="${name}"]:checked`) || form.querySelector(`select[name="${name}"]`);
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = selected?.value || 'Not selected';
        review.append(term, description);
      }
    }
    if (moveFocus) {
      const legend = steps[active].querySelector('legend');
      legend.tabIndex = -1;
      legend.focus();
    }
  }
  function advance() {
    if (![...steps[active].querySelectorAll('input,select')].every(control => control.checkValidity())) {
      error.textContent = 'Please choose an option before continuing.';
      steps[active].querySelector('input,select')?.focus();
      return;
    }
    active = Math.min(active + 1, steps.length - 1);
    render();
  }
  next.addEventListener('click', advance);
  back.addEventListener('click', () => { active = Math.max(0, active - 1); render(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (active < steps.length - 1) { advance(); return; }
    const complete = form.querySelector('[data-complete]');
    complete.hidden = false;
    complete.tabIndex = -1;
    complete.focus();
    finish.disabled = true;
    status.textContent = 'Preview complete. No information was sent.';
  });
  render(false);
})();
