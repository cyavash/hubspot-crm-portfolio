"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { JSDOM } = require("jsdom");
const script = readFileSync(
  "components/hubspot/modules/content-tabs.module/module.js",
  "utf8",
);
function markup(name = "Process") {
  return `<section data-sz-tabs aria-label="${name}"><div data-sz-tablist hidden aria-label="Stages"><button type="button" data-sz-tab>Plan</button><button type="button" data-sz-tab>Build</button><button type="button" data-sz-tab>Validate</button></div><section data-sz-panel>Plan content</section><section data-sz-panel>Build content</section><section data-sz-panel>Validate content</section></section>`;
}
function render(html, enhance = true) {
  const dom = new JSDOM(
    `<!doctype html><html lang="en"><head><title>Components</title></head><body>${html}</body></html>`,
    { runScripts: "outside-only", pretendToBeVisual: true },
  );
  if (enhance) {
    dom.window.eval(script);
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  }
  return dom;
}
test("content stays readable without JavaScript", () => {
  const dom = render(markup(), false),
    doc = dom.window.document;
  assert.equal(doc.querySelector("[data-sz-tablist]").hidden, true);
  assert.equal(
    [...doc.querySelectorAll("[data-sz-panel]")].every(
      (panel) => !panel.hidden,
    ),
    true,
  );
  dom.window.close();
});
test("initial enhancement creates valid tab and panel relationships", () => {
  const dom = render(markup()),
    doc = dom.window.document;
  const tabs = [...doc.querySelectorAll('[role="tab"]')];
  assert.equal(tabs.length, 3);
  assert.equal(doc.querySelector('[role="tablist"]').hidden, false);
  for (const tab of tabs) {
    const panel = doc.getElementById(tab.getAttribute("aria-controls"));
    assert.equal(panel.getAttribute("aria-labelledby"), tab.id);
    assert.equal(panel.hidden, tab.getAttribute("aria-selected") !== "true");
  }
  assert.deepEqual(
    tabs.map((tab) => tab.tabIndex),
    [0, -1, -1],
  );
  dom.window.close();
});
test("click selection reveals only the corresponding panel", () => {
  const dom = render(markup()),
    doc = dom.window.document;
  const tabs = doc.querySelectorAll('[role="tab"]');
  tabs[2].click();
  assert.equal(tabs[2].getAttribute("aria-selected"), "true");
  assert.deepEqual(
    [...doc.querySelectorAll('[role="tabpanel"]')].map((panel) => panel.hidden),
    [true, true, false],
  );
  dom.window.close();
});
test("arrows wrap and Home/End move selection and focus", () => {
  const dom = render(markup()),
    doc = dom.window.document,
    tabs = [...doc.querySelectorAll('[role="tab"]')];
  function key(index, value, expected) {
    const event = new dom.window.KeyboardEvent("keydown", {
      key: value,
      bubbles: true,
      cancelable: true,
    });
    tabs[index].dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(doc.activeElement, tabs[expected]);
    assert.equal(tabs[expected].getAttribute("aria-selected"), "true");
  }
  key(0, "ArrowLeft", 2);
  key(2, "ArrowRight", 0);
  key(0, "End", 2);
  key(2, "Home", 0);
  dom.window.close();
});
test("unrelated keyboard shortcuts retain their default behavior", () => {
  const dom = render(markup()),
    doc = dom.window.document;
  const event = new dom.window.KeyboardEvent("keydown", {
    key: "Tab",
    cancelable: true,
  });
  doc.querySelector('[role="tab"]').dispatchEvent(event);
  assert.equal(event.defaultPrevented, false);
  dom.window.close();
});
test("multiple instances remain independent and avoid existing IDs", () => {
  const dom = render(
      '<div id="sz-content-tab-1"></div>' + markup("One") + markup("Two"),
    ),
    doc = dom.window.document;
  const groups = doc.querySelectorAll("[data-sz-tabs]");
  groups[0].querySelectorAll('[role="tab"]')[1].click();
  assert.equal(
    groups[1].querySelector('[role="tab"]').getAttribute("aria-selected"),
    "true",
  );
  const ids = [...doc.querySelectorAll("[id]")].map((element) => element.id);
  assert.equal(new Set(ids).size, ids.length);
  dom.window.close();
});
test("nested tabs keep their own controls and panels", () => {
  const outer = markup("Outer").replace("Plan content", markup("Inner"));
  const dom = render(outer),
    doc = dom.window.document;
  assert.equal(doc.querySelectorAll('[data-sz-ready="true"]').length, 2);
  assert.equal(doc.querySelectorAll('[role="tab"]').length, 6);
  dom.window.close();
});
test("repeat initialization preserves IDs and does not duplicate focus handlers", () => {
  const dom = render(markup()),
    doc = dom.window.document;
  const ids = [...doc.querySelectorAll("[id]")].map((element) => element.id);
  dom.window.eval(script);
  doc.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  assert.deepEqual(
    [...doc.querySelectorAll("[id]")].map((element) => element.id),
    ids,
  );
  const target = doc.querySelectorAll('[role="tab"]')[1];
  let focused = 0;
  target.focus = () => {
    focused++;
  };
  doc
    .querySelector('[role="tab"]')
    .dispatchEvent(
      new dom.window.KeyboardEvent("keydown", { key: "ArrowRight" }),
    );
  assert.equal(focused, 1);
  dom.window.close();
});
test("mismatched content retains its readable fallback", () => {
  const dom = render(
      markup().replace("<section data-sz-panel>Validate content</section>", ""),
    ),
    doc = dom.window.document;
  assert.equal(doc.querySelector("[data-sz-tablist]").hidden, true);
  assert.equal(
    doc.querySelector("[data-sz-tabs]").hasAttribute("data-sz-ready"),
    false,
  );
  dom.window.close();
});
