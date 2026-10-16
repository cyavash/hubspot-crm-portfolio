const quoteData = {
  quote_number: "DB-2026-1042",
  issued: "October 15, 2026",
  expires: "November 14, 2026",
  company: "Northstar Orthobiologics Group",
  buyer: "Avery Morgan",
  buyer_role: "Director of Practice Operations",
  email: "avery@northstar.example",
  term: "Nov 1, 2026 - Oct 31, 2027",
  locations: 3,
  additional_providers: 8,
  currency: "USD",
  annual_discount_percent: 15,
  launch_credit: 600,
  recurring: [
    {
      name: "Clinic platform access",
      description:
        "Outcome collection, registry access and practice dashboards",
      sku: "DB-CLINIC",
      quantity: 3,
      unit_price: 375,
    },
    {
      name: "Additional provider seats",
      description: "Individual provider access and attributed outcome views",
      sku: "DB-PROVIDER",
      quantity: 8,
      unit_price: 45,
    },
    {
      name: "Advanced reporting workspace",
      description: "Multi-location reporting and a shared leadership view",
      sku: "DB-REPORTING",
      quantity: 1,
      unit_price: 225,
    },
  ],
  one_time: [
    {
      name: "Multi-location onboarding",
      description: "Configuration, workflow mapping and launch coordination",
      sku: "DB-ONBOARD",
      quantity: 1,
      unit_price: 2400,
    },
    {
      name: "Historical data preparation",
      description: "One agreed CSV import, up to 2,500 synthetic records",
      sku: "DB-IMPORT",
      quantity: 1,
      unit_price: 900,
    },
    {
      name: "Team enablement",
      description: "Two administrator training sessions and handover guide",
      sku: "DB-TRAIN",
      quantity: 1,
      unit_price: 600,
    },
  ],
  optional: [
    {
      id: "report",
      name: "Quarterly outcomes review",
      description: "Four structured review sessions over the initial term",
      price: 1800,
      frequency: "one_time",
    },
    {
      id: "branding",
      name: "Practice branding package",
      description: "Clinic-specific survey and communication styling",
      price: 150,
      frequency: "monthly",
    },
  ],
  scenario_note:
    "Portfolio demo. Fictional buyer, sample product configuration and prices. Not an actual DataBiologics offer. No patient data.",
};
const currency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value / 100,
  );
function calculateQuote(billing, report, branding) {
  const monthlyCents = 171000 + (branding ? 15000 : 0),
    annualCents = monthlyCents * 12;
  const subscriptionCents =
    billing === "annual" ? Math.round((annualCents * 85) / 100) : annualCents;
  const oneTimeCents = 330000 + (report ? 180000 : 0);
  const installmentCents =
    billing === "annual"
      ? subscriptionCents
      : monthlyCents * (billing === "quarterly" ? 3 : 1);
  return {
    monthlyCents,
    subscriptionCents,
    oneTimeCents,
    installmentCents,
    dueCents: installmentCents + oneTimeCents,
    totalCents: subscriptionCents + oneTimeCents,
    savingsCents: annualCents - subscriptionCents,
  };
}
let billing = "annual";
const el = (id) => document.getElementById(id);
el("recurring").innerHTML = quoteData.recurring
  .map(
    (x) =>
      `<tr><td><span class="item-name">${x.name}</span><span class="desc">${x.description}</span><span class="sku">${x.sku}</span></td><td class="amount">${x.quantity}</td><td class="amount">${currency(x.unit_price * 100)}</td><td class="amount">${currency(x.quantity * x.unit_price * 100)}</td></tr>`,
  )
  .join("");
el("setup").innerHTML =
  quoteData.one_time
    .map(
      (x) =>
        `<tr><td><span class="item-name">${x.name}</span><span class="desc">${x.description}</span></td><td class="amount">${currency(x.unit_price * 100)}</td></tr>`,
    )
    .join("") +
  '<tr><td>Launch credit</td><td class="amount">-$600.00</td></tr>';
function render() {
  const x = calculateQuote(
    billing,
    el("report").checked,
    el("branding").checked,
  );
  el("due").textContent = currency(x.dueCents);
  el("subscription").textContent = currency(x.subscriptionCents);
  el("implementation").textContent = currency(x.oneTimeCents);
  el("savings").textContent = currency(x.savingsCents);
  el("year-total").textContent = currency(x.totalCents);
  el("frequency").textContent = billing[0].toUpperCase() + billing.slice(1);
  el("due-description").textContent =
    (billing === "annual"
      ? "Annual subscription"
      : billing === "quarterly"
        ? "First quarter"
        : "First month") + " + one-time services";
  el("schedule-first").textContent = currency(x.dueCents);
  el("schedule-next").textContent =
    billing === "annual" ? "At renewal" : currency(x.installmentCents);
  el("schedule-next-note").textContent =
    billing === "annual"
      ? "No further subscription bill in initial term"
      : billing === "quarterly"
        ? "Quarterly, 3 more installments"
        : "Monthly, 11 more installments";
  el("schedule-term").textContent = currency(x.totalCents);
  document
    .querySelectorAll("[data-billing]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.billing === billing)),
    );
  el("ack-scope").checked = false;
  el("ack-billing").checked = false;
  el("accept").disabled = true;
  el("accept-status").textContent = "";
}
document.querySelectorAll("[data-billing]").forEach((b) =>
  b.addEventListener("click", () => {
    billing = b.dataset.billing;
    render();
  }),
);
["report", "branding"].forEach((id) =>
  el(id).addEventListener("change", render),
);
["ack-scope", "ack-billing"].forEach((id) =>
  el(id).addEventListener("change", () => {
    el("accept").disabled = !(
      el("ack-scope").checked && el("ack-billing").checked
    );
  }),
);
el("accept").addEventListener("click", () => {
  el("accept-status").textContent =
    "Preview complete. No signature, payment or CRM update was submitted.";
});
["cpq", "legacy"].forEach((mode) =>
  el(mode).addEventListener("click", () => {
    el("quote").classList.toggle("legacy", mode === "legacy");
    el("cpq").setAttribute("aria-pressed", String(mode === "cpq"));
    el("legacy").setAttribute("aria-pressed", String(mode === "legacy"));
    if (mode === "legacy") {
      billing = "annual";
      el("report").checked = false;
      el("branding").checked = false;
      render();
    }
  }),
);
el("print").addEventListener("click", () => window.print());
render();
