/** Progressive tabs: content remains readable when scripting is unavailable. */
(() => {
  "use strict";
  let sequence = 0;
  const uniqueId = () => {
    let id;
    do {
      id = `sz-content-tab-${++sequence}`;
    } while (document.getElementById(id));
    return id;
  };
  function initialize() {
    document.querySelectorAll("[data-sz-tabs]").forEach((root) => {
      if (root.dataset.szReady) return;
      const own = (selector) =>
        [...root.querySelectorAll(selector)].filter(
          (element) => element.closest("[data-sz-tabs]") === root,
        );
      const list = own("[data-sz-tablist]")[0];
      const tabs = own("[data-sz-tab]");
      const panels = own("[data-sz-panel]");
      if (!list || !tabs.length || tabs.length !== panels.length) return;
      root.dataset.szReady = "true";
      list.setAttribute("role", "tablist");
      tabs.forEach((tab, index) => {
        tab.id = uniqueId();
        panels[index].id = uniqueId();
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", panels[index].id);
        panels[index].setAttribute("role", "tabpanel");
        panels[index].setAttribute("aria-labelledby", tab.id);
        panels[index].tabIndex = 0;
      });
      function select(index, moveFocus = false) {
        tabs.forEach((tab, position) => {
          const selected = index === position;
          tab.setAttribute("aria-selected", String(selected));
          tab.tabIndex = selected ? 0 : -1;
          panels[position].hidden = !selected;
        });
        if (moveFocus) tabs[index].focus();
      }
      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => select(index));
        tab.addEventListener("keydown", (event) => {
          const keys = {
            ArrowRight: (index + 1) % tabs.length,
            ArrowLeft: (index - 1 + tabs.length) % tabs.length,
            Home: 0,
            End: tabs.length - 1,
          };
          if (!Object.hasOwn(keys, event.key)) return;
          event.preventDefault();
          select(keys[event.key], true);
        });
      });
      select(0);
      list.hidden = false;
    });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
