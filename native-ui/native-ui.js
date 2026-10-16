/** Native browser enhancements for the exported HubSpot themes.
 * Content remains readable without JavaScript; each component initializes once.
 * No runtime packages, automatic media playback or continuous timers.
 */
(() => {
  "use strict";
  const all = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const once = (element, feature) => {
    const key = `native${feature}`;
    if (element.dataset[key]) return false;
    element.dataset[key] = "true";
    return true;
  };
  const show = (element, visible) => {
    if (!element) return;
    element.hidden = !visible;
    // Clear legacy inline hiding before native hidden-state styling takes over.
    element.style.removeProperty("display");
  };
  const activate = (element, handler, label) => {
    if (!["BUTTON", "A", "SUMMARY", "INPUT"].includes(element.tagName)) {
      element.setAttribute("role", "button");
      element.tabIndex = 0;
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          element.click();
        }
      });
    }
    if (label) element.setAttribute("aria-label", label);
    element.addEventListener("click", handler);
  };
  let uniqueId = 0;
  const idFor = (element) => {
    if (element.id) return element.id;
    let id;
    do {
      id = `native-ui-${++uniqueId}`;
    } while (document.getElementById(id));
    return (element.id = id);
  };

  function disclosures(titleSelector, panelSelector) {
    all(titleSelector).forEach((title) => {
      const panel =
        title.parentElement.querySelector(panelSelector) ||
        title.closest(".accordion-inner")?.querySelector(panelSelector) ||
        title.nextElementSibling;
      if (!panel || !once(title, "Disclosure")) return;
      const owner =
        title.closest('[data-hs-cos-type="module"]') ||
        title.parentElement.parentElement;
      title.setAttribute("aria-controls", idFor(panel));
      const setExpanded = (expanded) => {
        show(panel, expanded);
        title.setAttribute("aria-expanded", String(expanded));
        title.classList.toggle("active", expanded);
        title.parentElement.classList.toggle("active", expanded);
        title.parentElement.parentElement?.classList.toggle(
          "activeparent",
          expanded,
        );
        const plus = title.querySelector(".plus-sign");
        if (plus) plus.textContent = expanded ? "-" : "+";
      };
      setExpanded(false);
      activate(title, (event) => {
        event.preventDefault();
        const expanded = title.getAttribute("aria-expanded") !== "true";
        // Use the same event path so sibling ARIA state and visible content agree.
        if (expanded)
          all(titleSelector, owner).forEach((sibling) => {
            if (
              sibling !== title &&
              sibling.getAttribute("aria-expanded") === "true"
            )
              sibling.click();
          });
        setExpanded(expanded);
      });
    });
  }

  function tabs(
    rootSelector,
    tabSelector,
    panelSelector,
    activeTab = "active",
    activePanel = activeTab,
  ) {
    all(rootSelector).forEach((root) => {
      if (!once(root, "Tabs")) return;
      const triggers = all(tabSelector, root);
      const panels = all(panelSelector, root);
      if (!triggers.length || triggers.length !== panels.length) return;
      const list =
        triggers[0].closest("ul, .tabs, .search_web_taps") ||
        triggers[0].parentElement;
      list.setAttribute("role", "tablist");
      const select = (index, focus = false) => {
        triggers.forEach((trigger, current) => {
          const selected = current === index;
          trigger.classList.toggle(activeTab, selected);
          trigger.setAttribute("aria-selected", String(selected));
          trigger.tabIndex = selected ? 0 : -1;
          panels[current].classList.toggle(activePanel, selected);
          show(panels[current], selected);
        });
        if (focus) triggers[index].focus();
      };
      triggers.forEach((trigger, index) => {
        trigger.setAttribute("role", "tab");
        trigger.setAttribute("aria-controls", idFor(panels[index]));
        panels[index].setAttribute("role", "tabpanel");
        panels[index].setAttribute("aria-labelledby", idFor(trigger));
        panels[index].tabIndex = 0;
        trigger.addEventListener("click", (event) => {
          event.preventDefault();
          select(index);
        });
        trigger.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            select(index);
            return;
          }
          let next;
          if (event.key === "ArrowRight") next = (index + 1) % triggers.length;
          if (event.key === "ArrowLeft")
            next = (index + triggers.length - 1) % triggers.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = triggers.length - 1;
          if (next !== undefined) {
            event.preventDefault();
            select(next, true);
          }
        });
      });
      const initial = triggers.findIndex((trigger) =>
        trigger.classList.contains(activeTab),
      );
      select(initial < 0 ? 0 : initial);
    });
  }

  function carousel(selector, label) {
    all(selector).forEach((track) => {
      if (!once(track, "Carousel") || track.children.length < 2) return;
      track.classList.add("native-carousel");
      track.setAttribute("role", "region");
      track.setAttribute("aria-roledescription", "carousel");
      track.setAttribute("aria-label", label);
      track.tabIndex = 0;
      const controls = document.createElement("div");
      controls.className = "native-carousel-controls";
      ["Previous", "Next"].forEach((text, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.setAttribute("aria-label", `${text} ${label.toLowerCase()}`);
        button.setAttribute("aria-controls", idFor(track));
        button.addEventListener("click", () => {
          const reduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          track.scrollBy({
            left: (index ? 1 : -1) * track.clientWidth,
            behavior: reduce ? "instant" : "smooth",
          });
        });
        controls.append(button);
      });
      track.after(controls);
    });
  }

  function menus() {
    const product = document.querySelector(".menu-item.product");
    const mega = document.querySelector(".product-mega-menu");
    if (product && mega && !product.contains(mega)) product.append(mega);
    all(".active-branch").forEach((item) =>
      item.parentElement?.closest("li")?.classList.add("active-branch"),
    );
    all(
      ".has-submenu, .mega-nav, .hs-item-has-children, .new_header .navigation li, .menu-item.product",
    ).forEach((item) => {
      const panel = item.querySelector(
        ":scope > ul, :scope > .mega-wrapper, :scope > .sub_group, :scope > .product-mega-menu",
      );
      const link = item.querySelector(":scope > a");
      if (!panel || !link || !once(item, "Submenu")) return;
      let toggle = item.querySelector(":scope > .child-trigger");
      if (!toggle || toggle.tagName !== "BUTTON") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "child-trigger";
        button.textContent = "+";
        if (toggle) toggle.replaceWith(button);
        else link.after(button);
        toggle = button;
      }
      toggle.setAttribute(
        "aria-label",
        `Toggle ${link.textContent.trim()} submenu`,
      );
      toggle.setAttribute("aria-controls", idFor(panel));
      toggle.setAttribute("aria-expanded", "false");
      if (!link.getAttribute("href") || link.getAttribute("href") === "#")
        link.addEventListener("click", (event) => {
          event.preventDefault();
          toggle.click();
        });
      const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.classList.toggle("child-open", open);
        item.classList.toggle("child-open", open);
        item.classList.toggle("focus", open);
        panel.style.display = open ? "block" : "";
      };
      toggle.addEventListener("click", () =>
        setOpen(toggle.getAttribute("aria-expanded") !== "true"),
      );
      item.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setOpen(false);
          toggle.focus();
        }
      });
      item.addEventListener("focusout", (event) => {
        if (!item.contains(event.relatedTarget)) setOpen(false);
      });
    });
    all(
      ".mobile-trigger, .mobile_trigger, .toggle-mobile-menu, .menu-wrap, .header_v2_trigger, .blog-mobile-trigger",
    ).forEach((trigger) => {
      if (!once(trigger, "Mobile")) return;
      trigger.setAttribute("aria-expanded", "false");
      const scope =
        trigger.closest(
          "header, .header, .sap-header, .cs_header, .header-outer-wrap",
        ) || document;
      const panel = scope.querySelector(
        ".menu-wrapper, .main-navigation .hs-menu-wrapper, .header_v2_menu, .navigation",
      );
      if (panel) trigger.setAttribute("aria-controls", idFor(panel));
      const close = () => {
        scope.querySelector(".menu-wrapper")?.classList.remove("menu");
        if (scope.matches?.(".sap-header")) scope.classList.remove("menus");
        document.getElementById("overlay")?.classList.remove("open");
        document.body.classList.remove("mobile-open", "blog-mobile-open");
        trigger.setAttribute("aria-expanded", "false");
        trigger.classList.remove("active");
        if (panel) panel.style.removeProperty("display");
      };
      activate(
        trigger,
        (event) => {
          event.preventDefault();
          const open = trigger.getAttribute("aria-expanded") !== "true";
          trigger.setAttribute("aria-expanded", String(open));
          trigger.classList.toggle("active", open);
          document.body.classList.toggle("mobile-open", open);
          scope.querySelector(".menu-wrapper")?.classList.toggle("menu", open);
          if (scope.matches?.(".sap-header"))
            scope.classList.toggle("menus", open);
          document.getElementById("overlay")?.classList.toggle("open", open);
          if (panel) panel.style.display = open ? "block" : "";
        },
        "Toggle navigation",
      );
      scope.addEventListener("keydown", (event) => {
        if (
          event.key === "Escape" &&
          trigger.getAttribute("aria-expanded") === "true"
        ) {
          close();
          trigger.focus();
        }
      });
      all(".close-trigger, .popupCloseButton, .blog_close", scope).forEach(
        (button) => activate(button, close, "Close navigation"),
      );
      const desktop = window.matchMedia("(min-width: 1000px)");
      desktop.addEventListener("change", (event) => {
        if (event.matches) close();
      });
    });
  }

  function videoDialogs() {
    all(".youtube-link[youtubeid]").forEach((link) => {
      if (!once(link, "Video")) return;
      const videoId = link.getAttribute("youtubeid");
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return;
      activate(
        link,
        (event) => {
          // Preserve normal link navigation on browsers without native dialogs.
          if (typeof HTMLDialogElement === "undefined") return;
          event.preventDefault();
          const dialog = document.createElement("dialog");
          dialog.className = "native-video-dialog";
          dialog.setAttribute("aria-label", "Video player");
          const close = document.createElement("button");
          close.type = "button";
          close.textContent = "Close video";
          const frame = document.createElement("iframe");
          frame.title = "YouTube video player";
          frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
          frame.allow = "fullscreen; picture-in-picture";
          frame.allowFullscreen = true;
          dialog.append(close, frame);
          document.body.append(dialog);
          close.addEventListener("click", () => dialog.close());
          dialog.addEventListener(
            "close",
            () => {
              dialog.remove();
              link.focus();
            },
            { once: true },
          );
          dialog.addEventListener("click", (click) => {
            if (click.target === dialog) dialog.close();
          });
          dialog.showModal();
        },
        "Play video",
      );
    });
  }

  function filtering() {
    all("#faq_search_form input").forEach((input) => {
      if (!once(input, "Search")) return;
      input.addEventListener("input", () => {
        const query = input.value.trim().toLocaleLowerCase();
        all(".faq-items .faq_section").forEach((section) => {
          show(
            section,
            section.classList.contains("t_head") ||
              section.textContent.toLocaleLowerCase().includes(query),
          );
        });
      });
    });
    all("#blog-content-row").forEach((root) => {
      if (!once(root, "Resources")) return;
      const container =
        root.closest('section, [data-hs-cos-type="module"]') || document;
      const select = container.querySelector("#filter-select");
      const search = container.querySelector("#search-input");
      const more = container.querySelector("#bspoke-load-more");
      let limit = 9;
      const update = () => {
        const query = search?.value.trim().toLocaleLowerCase() || "";
        const category = select?.value || "all";
        let count = 0;
        all(".column", root).forEach((column) => {
          const matches =
            (category === "all" || column.dataset.blogId === category) &&
            column.textContent.toLocaleLowerCase().includes(query);
          show(column, matches);
          if (matches)
            all(".blog-item-main", column).forEach((item) =>
              show(item, count++ < limit),
            );
        });
        if (more) show(more, count > limit);
        all(".no-results", container).forEach((message) => {
          message.setAttribute("role", "status");
          show(message, count === 0);
        });
      };
      search?.addEventListener("input", () => {
        limit = 9;
        update();
      });
      select?.addEventListener("change", () => {
        limit = 9;
        update();
      });
      more?.addEventListener("click", (event) => {
        event.preventDefault();
        limit += 9;
        update();
      });
      update();
    });
    all("#filterOptions a").forEach((link) => {
      if (!once(link, "MediaFilter")) return;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const category = { "In the news": "news", "Press release": "press" }[
          link.textContent.trim()
        ];
        all("#filterOptions li").forEach((item) =>
          item.classList.toggle("active", item.contains(link)),
        );
        all(".media-blurb-item").forEach((item) =>
          show(item, !category || item.classList.contains(category)),
        );
      });
    });
  }

  function loadMore(itemSelector, buttonSelector, pageSize) {
    const button = document.querySelector(buttonSelector);
    const items = all(itemSelector);
    if (!button || !items.length || !once(button, "More")) return;
    let visible = pageSize;
    const update = () => {
      items.forEach((item, index) => show(item, index < visible));
      show(button, visible < items.length);
    };
    button.addEventListener("click", (event) => {
      event.preventDefault();
      visible += pageSize;
      update();
    });
    update();
  }

  function stickyHeaders() {
    const update = () => {
      const y = window.scrollY;
      all(".header").forEach((header) => {
        header.classList.toggle("sticky", y > 10);
        header.classList.toggle("no-sticky", y <= 10);
      });
      all(".cs_header").forEach((header) =>
        header.classList.toggle("fixed", y > 50),
      );
      all(".header-outer-wrap").forEach((header) =>
        header.classList.toggle(
          "sticky-header",
          y > 50 || document.body.matches(".blog-css.hs-blog-post"),
        ),
      );
      all(".header-wrapper").forEach((header) =>
        header.classList.toggle("scroll", y > 0),
      );
      const distance =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        distance > 0 ? Math.min(100, Math.max(0, (y / distance) * 100)) : 0;
      all(".bar-long").forEach((bar) => {
        bar.style.width = `${progress}%`;
      });
      document.body.classList.toggle(
        "scroll",
        y > (document.querySelector(".custom_header")?.offsetHeight || 100),
      );
    };
    let scheduled = false;
    window.addEventListener(
      "scroll",
      () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          update();
          scheduled = false;
        });
      },
      { passive: true },
    );
    update();
  }

  function miscellaneous() {
    all(".sub_help span").forEach((trigger) => {
      const tooltip = trigger.querySelector(".sub_help_hover");
      if (!tooltip || !once(trigger, "Tooltip")) return;
      trigger.tabIndex = 0;
      trigger.setAttribute("aria-describedby", idFor(tooltip));
      tooltip.setAttribute("role", "tooltip");
      const reveal = (visible) =>
        tooltip.classList.toggle("sub_help_hover_show", visible);
      trigger.addEventListener("mouseenter", () => reveal(true));
      trigger.addEventListener("mouseleave", () => reveal(false));
      trigger.addEventListener("focusin", () => reveal(true));
      trigger.addEventListener("focusout", () => reveal(false));
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Escape") reveal(false);
      });
    });
    all('input[name="globalunsub"]').forEach((input) => {
      input.addEventListener("change", () =>
        all(".item input", input.closest("form") || document).forEach(
          (field) => {
            field.disabled = input.checked;
          },
        ),
      );
    });
    all(".open-feature").forEach((trigger) => {
      if (!once(trigger, "Feature")) return;
      const scope =
        trigger.closest('section, [data-hs-cos-type="module"]') || document;
      const panels = all(".price-details, .prce-table-inner", scope);
      activate(trigger, (event) => {
        event.preventDefault();
        const open = trigger.getAttribute("aria-expanded") !== "true";
        trigger.setAttribute("aria-expanded", String(open));
        panels.forEach((panel) => show(panel, open));
        all(".price-toggle-wrap, .prce-table-wrap", scope).forEach((panel) =>
          panel.classList.toggle("open", open),
        );
      });
    });
    all(".explore_prouduct_btn").forEach((trigger) => {
      if (!once(trigger, "Explore")) return;
      activate(trigger, (event) => {
        event.preventDefault();
        const open = !document.body.classList.contains("explore-open");
        document.body.classList.toggle("explore-open", open);
        trigger.setAttribute("aria-expanded", String(open));
      });
    });
    document.addEventListener("click", (event) => {
      if (
        !event.target.closest(".explore_prouduct_btn, .explore-skopenow-wrap")
      )
        document.body.classList.remove("explore-open");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape")
        document.body.classList.remove("explore-open");
    });
    // Keep marketing copy static rather than rotating text every two seconds.
    all(".slogan ul").forEach((list) => {
      list.style.position = "static";
      list.style.width = "auto";
      list.style.height = "auto";
      [...list.children].forEach((item, index) => {
        item.style.position = "static";
        show(item, index === 0);
      });
    });
    if (window.hljs?.highlightAll) window.hljs.highlightAll();
  }

  function popups() {
    const bindDialog = (trigger, panel, label) => {
      if (
        !panel ||
        !once(trigger, "Modal") ||
        typeof HTMLDialogElement === "undefined"
      )
        return;
      activate(trigger, (event) => {
        event.preventDefault();
        let dialog = panel.closest("dialog");
        if (!dialog) {
          dialog = document.createElement("dialog");
          dialog.className = "native-content-dialog";
          dialog.setAttribute("aria-label", label);
          const close = document.createElement("button");
          close.type = "button";
          close.textContent = `Close ${label.toLowerCase()}`;
          panel.before(dialog);
          dialog.append(close, panel);
          panel.style.cssText =
            "display:block;position:static;width:auto;height:auto;overflow:visible;opacity:1;visibility:visible;";
          close.addEventListener("click", () => dialog.close());
          all(".close, .close1, .popup_close, .popup_back", panel).forEach(
            (button) => activate(button, () => dialog.close(), "Close dialog"),
          );
        }
        dialog.addEventListener("close", () => trigger.focus(), { once: true });
        dialog.showModal();
      });
    };
    all(".open_popup").forEach((trigger) =>
      bindDialog(
        trigger,
        trigger.closest(".popup_main")?.querySelector(".popup_body"),
        "Sign-up information",
      ),
    );
    all(".fancybox").forEach((trigger) =>
      bindDialog(
        trigger,
        document.getElementById("myModal"),
        "Pricing information",
      ),
    );
  }

  function initialize() {
    if (document.documentElement.dataset.nativeUiReady) return;
    document.documentElement.dataset.nativeUiReady = "true";
    disclosures(".faq-question", ".faq-ans");
    disclosures(".accordion-title", ".accordion-content");
    ["price", "price1", "tacordn", "tacordn2", "tacordn3"].forEach((prefix) =>
      disclosures(
        `.${prefix}-acc-title, .${prefix}-title`,
        `.${prefix}-acc-content, .${prefix}-content`,
      ),
    );
    tabs(
      ".search_web",
      ".search_web_taps a",
      ".search_web_taps_con .tab-content",
    );
    tabs(".api_codes", ".tab-title", ".tab-content");
    tabs(".partner-tabs", ".tabs .tab", ".tab-content .tab-pane");
    ["hs", "hs1", "hs3"].forEach((prefix) =>
      tabs(
        `.${prefix}-tabs`,
        `.${prefix}-tabs__nav a`,
        `.${prefix}-tabs__item`,
        `${prefix}-tabs__navitem--active`,
        `${prefix}-tabs__item--active`,
      ),
    );
    carousel(
      '.carousel, .customer-carousel, .cards-slider, .sldr-main, [id^="hs-testimonial-slider_"]',
      "Project slides",
    );
    carousel(".logo-sldr-lr, .logo-sldr-rt", "Client logos");
    tabs(".journey-section", ".span5 h3", ".journey-content");
    tabs(
      ".current-openings-wrapper",
      ".current_opening_nav li",
      ".current_opening-con-wrap",
      "current",
    );
    menus();
    videoDialogs();
    filtering();
    stickyHeaders();
    miscellaneous();
    popups();
    loadMore(
      ".blog-list-wrap .post-listing .blog-list-item",
      "#list-load-more",
      6,
    );
    loadMore(".resource-item-wrap", ".see-more", 9);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
