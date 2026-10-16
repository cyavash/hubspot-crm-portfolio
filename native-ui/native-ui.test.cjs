"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { JSDOM } = require("jsdom");
const source = readFileSync("native-ui/native-ui.js", "utf8");
async function render(html) {
  const dom = new JSDOM(
    `<!doctype html><html lang="en"><head><title>Component test</title></head><body>${html}</body></html>`,
    {
      runScripts: "outside-only",
      url: "https://example.com/",
      pretendToBeVisual: true,
    },
  );
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  dom.window.eval(source);
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  return dom;
}
test("a content-only page initializes without missing-element errors", async () => {
  const dom = await render("<main><h1>Content</h1></main>");
  assert.equal(dom.window.document.querySelector("main").hidden, false);
  dom.window.close();
});
test("FAQ expansion never hides the page main landmark", async () => {
  const dom = await render(
    '<main><div class="accordion-inner"><h3><button class="accordion-title">Question</button></h3><div class="accordion-content">Answer</div></div></main>',
  );
  const doc = dom.window.document,
    button = doc.querySelector("button");
  assert.equal(doc.querySelector(".accordion-content").hidden, true);
  button.click();
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(doc.querySelector(".accordion-content").hidden, false);
  assert.equal(doc.querySelector("main").hidden, false);
  dom.window.close();
});
test("independent FAQ module instances do not close each other", async () => {
  const item =
    '<div class="accordion-inner"><button class="accordion-title">Q</button><div class="accordion-content">A</div></div>';
  const dom = await render(
    `<section data-hs-cos-type="module">${item}</section><section data-hs-cos-type="module">${item}</section>`,
  );
  const buttons = dom.window.document.querySelectorAll("button");
  buttons[0].click();
  buttons[1].click();
  assert.equal(buttons[0].getAttribute("aria-expanded"), "true");
  dom.window.close();
});
test("tabs update focus, selection and panels with arrow keys", async () => {
  const dom = await render(
    '<section class="search_web"><div class="search_web_taps"><a href="#one">One</a><a href="#two">Two</a></div><div class="search_web_taps_con"><div id="one" class="tab-content">First</div><div id="two" class="tab-content">Second</div></div></section>',
  );
  const doc = dom.window.document,
    tabs = doc.querySelectorAll('[role="tab"]');
  tabs[0].dispatchEvent(
    new dom.window.KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    }),
  );
  assert.equal(doc.activeElement, tabs[1]);
  assert.equal(tabs[1].getAttribute("aria-selected"), "true");
  assert.equal(doc.getElementById("one").hidden, true);
  assert.equal(doc.getElementById("two").hidden, false);
  dom.window.close();
});
test("search treats regex punctuation as literal text", async () => {
  const dom = await render(
    '<form id="faq_search_form"><input aria-label="Search"></form><div class="faq-items"><div class="faq_section">A [bracket]</div><div class="faq_section">Other</div></div>',
  );
  const input = dom.window.document.querySelector("input");
  input.value = "[";
  input.dispatchEvent(new dom.window.Event("input"));
  assert.deepEqual(
    [...dom.window.document.querySelectorAll(".faq_section")].map(
      (x) => x.hidden,
    ),
    [false, true],
  );
  dom.window.close();
});
test("search and category filters combine rather than overwrite each other", async () => {
  const dom = await render(
    '<section><select id="filter-select"><option value="all">All</option><option value="a">A</option></select><input id="search-input"><div id="blog-content-row"><div class="column" data-blog-id="a"><article class="blog-item-main">Alpha</article></div><div class="column" data-blog-id="b"><article class="blog-item-main">Alpha</article></div></div><button id="bspoke-load-more">More</button></section>',
  );
  const doc = dom.window.document,
    select = doc.querySelector("select");
  select.value = "a";
  select.dispatchEvent(new dom.window.Event("change"));
  const search = doc.querySelector("input");
  search.value = "Alpha";
  search.dispatchEvent(new dom.window.Event("input"));
  assert.deepEqual(
    [...doc.querySelectorAll(".column")].map((x) => x.hidden),
    [false, true],
  );
  dom.window.close();
});
test("slide controls are generated once and autoplay is absent", async () => {
  const dom = await render(
    '<div class="carousel"><article>One</article><article>Two</article></div>',
  );
  dom.window.eval(source);
  assert.equal(
    dom.window.document.querySelectorAll(".native-carousel-controls").length,
    1,
  );
  assert.equal(
    dom.window.document.querySelectorAll(".native-carousel-controls button")
      .length,
    2,
  );
  dom.window.close();
});
test("submenu toggle has an accessible name and Escape restores focus", async () => {
  const dom = await render(
    '<nav><ul><li class="has-submenu"><a href="/services">Services</a><ul><li><a href="/a">A</a></li></ul></li></ul></nav>',
  );
  const doc = dom.window.document,
    toggle = doc.querySelector("button");
  toggle.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  toggle.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(doc.activeElement, toggle);
  dom.window.close();
});
test("new control IDs avoid IDs already used by the page", async () => {
  const dom = await render(
    '<span id="native-ui-1"></span><div class="carousel"><p>A</p><p>B</p></div>',
  );
  const ids = [...dom.window.document.querySelectorAll("[id]")].map(
    (x) => x.id,
  );
  assert.equal(ids.length, new Set(ids).size);
  dom.window.close();
});
test("invalid video IDs cannot create an iframe", async () => {
  const dom = await render(
    '<a class="youtube-link" youtubeid="invalid?x=1" href="https://youtube.com/">Video</a>',
  );
  assert.equal(dom.window.document.querySelector("iframe"), null);
  dom.window.close();
});
