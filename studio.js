/** @file Native interactions for public portfolio references. No production writes. */
"use strict";
const selectAll = (selector, root = document) => [
  ...root.querySelectorAll(selector),
];
const setPressed = (buttons, selected) =>
  buttons.forEach((button) => {
    const active = button === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

// Native anchors remain useful without JavaScript.
selectAll("[data-local-nav]").forEach((link) =>
  link.addEventListener("click", () => {
    selectAll("[data-local-nav]").forEach((other) => {
      const active = other === link;
      other.classList.toggle("selected", active);
      if (active) other.setAttribute("aria-current", "location");
      else other.removeAttribute("aria-current");
    });
  }),
);

const info = document.querySelector(".info-dialog");
if (info && typeof info.showModal === "function") {
  selectAll("[data-project-info]").forEach((button) =>
    button.addEventListener("click", () => info.showModal()),
  );
  info
    .querySelector("[data-close-info]")
    ?.addEventListener("click", () => info.close());
}

const conversations = selectAll("[data-conversation]");
if (conversations.length) {
  const search = document.querySelector("[data-conversation-search]");
  const filters = selectAll("[data-inbox-filter]");
  const status = document.querySelector(".live-status");
  const review = document.querySelector("[data-handoff]");
  let currentFilter = "all";
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    conversations.forEach((button) => {
      const match =
        (currentFilter === "all" ||
          button.dataset.category === currentFilter) &&
        button.textContent.toLocaleLowerCase().includes(query);
      button.hidden = !match;
      if (match) count++;
    });
    status.textContent = `${count} conversation${count === 1 ? "" : "s"} shown.`;
  };
  search.addEventListener("input", update);
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      currentFilter = button.dataset.inboxFilter;
      setPressed(filters, button);
      update();
    }),
  );
  const content = {
    "Alex Morgan": [
      "Hello! Can you help me find the right delivery option for our next packaging order?",
      "Absolutely. I can help with delivery information and connect you with our team when you need a specific order reviewed.",
    ],
    "Camille Laurent": [
      "Bonjour, pouvez-vous m’aider avec une question sur ma commande ?",
      "Bien sûr. Je peux vous orienter vers les informations utiles et transmettre votre demande à notre équipe.",
    ],
    "Taylor Brooks": [
      "Could you help me understand which packaging option would suit our order?",
      "I can help you explore the available guidance and connect you with the team for an order-specific recommendation.",
    ],
  };
  conversations.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("selected")),
    );
    button.addEventListener("click", () => {
      conversations.forEach((other) => {
        const selected = other === button;
        other.classList.toggle("selected", selected);
        other.setAttribute("aria-pressed", String(selected));
      });
      const name = button.dataset.conversation;
      document.querySelector("[data-contact-name]").textContent = name;
      document.querySelector(".message.incoming").firstChild.textContent =
        content[name][0];
      document.querySelector(".message.outgoing").firstChild.textContent =
        content[name][1];
      const lang = name === "Camille Laurent" ? "fr" : "en";
      selectAll(".message").forEach((message) => (message.lang = lang));
      review.disabled = false;
      review.firstChild.textContent = "Request human review ";
      status.textContent = `Selected ${name}.`;
    });
  });
  review.addEventListener("click", () => {
    review.firstChild.textContent = "Review requested ";
    review.disabled = true;
    status.textContent =
      "The public preview shows the handoff state. No client CRM record was changed.";
  });
}

const orgButtons = selectAll("[data-org-view]");
orgButtons.forEach((button) =>
  button.addEventListener("click", () => {
    setPressed(orgButtons, button);
    const scenario = button.dataset.orgView === "future";
    document.querySelector("[data-scenario-label]").textContent = scenario
      ? "Scenario structure"
      : "Current structure";
    document
      .querySelector(".org-preview")
      .classList.toggle("scenario-active", scenario);
  }),
);

const rowSearch = document.querySelector("[data-row-search]");
if (rowSearch)
  rowSearch.addEventListener("input", () => {
    const query = rowSearch.value.trim().toLocaleLowerCase();
    let count = 0;
    selectAll("[data-search-row]").forEach((row) => {
      row.hidden = !row.textContent.toLocaleLowerCase().includes(query);
      if (!row.hidden) count++;
    });
    document.querySelector("[data-search-status]").textContent =
      `${count} sample application${count === 1 ? "" : "s"} shown.`;
  });

const pipelineButtons = selectAll("[data-pipeline-view]");
pipelineButtons.forEach((button) =>
  button.addEventListener("click", () => {
    setPressed(pipelineButtons, button);
    document
      .querySelector(".kanban-board")
      .classList.toggle("list-view", button.dataset.pipelineView === "list");
  }),
);
const dealButtons = selectAll("[data-deal]");
const reviewContact = document.querySelector("[data-contact-review]");
dealButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    dealButtons.forEach((other) => {
      other
        .closest(".deal-card")
        .classList.toggle("selected", other === button);
      other.setAttribute("aria-pressed", String(other === button));
    });
    const name = button.dataset.contact;
    document.querySelector("[data-record-name]").textContent = name;
    document.querySelector("[data-record-next]").textContent = button
      .closest(".deal-card")
      .querySelector(".deal-bottom > span:nth-child(2)").textContent;
    document.querySelector(".record-top .avatar").textContent = name
      .split(" ")
      .map((part) => part[0])
      .join("");
    reviewContact.disabled = false;
    reviewContact.firstChild.textContent = "Review next step ";
    document.querySelector("[data-record-status]").textContent =
      `${name} selected.`;
  });
});
reviewContact?.addEventListener("click", () => {
  reviewContact.firstChild.textContent = "Next step reviewed ";
  reviewContact.disabled = true;
  document.querySelector("[data-record-status]").textContent =
    "Reviewed in the public preview. No CRM record was changed.";
});

const form = document.querySelector("[data-qualification-form]");
if (form) {
  const steps = selectAll("[data-step]", form);
  const indicators = selectAll(".step-track li", form);
  const previous = form.querySelector("[data-step-back]");
  const next = form.querySelector("[data-step-next]");
  const status = form.querySelector("[data-form-status]");
  let current = 0;
  const updateReview = () => {
    const data = new FormData(form);
    const summary = form.querySelector("[data-enquiry-summary]");
    summary.replaceChildren();
    [
      ["Your plans", "plan"],
      ["Location", "area"],
      ["Timing", "timing"],
    ].forEach(([label, key]) => {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      term.textContent = label;
      const value = document.createElement("dd");
      value.textContent = String(data.get(key) || "");
      group.append(term, value);
      summary.append(group);
    });
  };
  const showStep = (focus = false) => {
    steps.forEach((step, index) => (step.hidden = index !== current));
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index <= current);
      if (index === current) indicator.setAttribute("aria-current", "step");
      else indicator.removeAttribute("aria-current");
    });
    previous.hidden = current === 0;
    next.firstChild.textContent =
      current === steps.length - 1 ? "Finish preview " : "Continue ";
    document.querySelector("[data-step-count]").textContent =
      `STEP ${current + 1} OF ${steps.length}`;
    if (current === steps.length - 1) updateReview();
    if (focus) {
      const legend = steps[current].querySelector("legend");
      legend.tabIndex = -1;
      legend.focus();
    }
  };
  previous.addEventListener("click", () => {
    if (current > 0) {
      current--;
      status.textContent = "";
      showStep(true);
    }
  });
  next.addEventListener("click", () => {
    const invalid = selectAll("input,select,textarea", steps[current]).find(
      (field) => !field.checkValidity(),
    );
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (current < steps.length - 1) {
      current++;
      showStep(true);
    } else
      status.textContent = "Preview complete. Your details were not submitted.";
  });
  form.addEventListener("submit", (event) => event.preventDefault());
  showStep();
}
