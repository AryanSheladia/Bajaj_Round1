// ── DOM Elements ──────────────────────────────────────────
const edgesInput = document.getElementById("edges-input");
const btnSubmit = document.getElementById("btn-submit");
const btnExample = document.getElementById("btn-example");
const btnClear = document.getElementById("btn-clear");
const errorBox = document.getElementById("error-box");
const errorMsg = document.getElementById("error-msg");
const resultsPanel = document.getElementById("results-panel");

const EXAMPLE_INPUT = `A->B, A->C, B->D, C->E, E->F,
X->Y, Y->Z, Z->X,
P->Q, Q->R,
G->H, G->H, G->I,
hello, 1->2, A->`;

// ── Event Listeners ───────────────────────────────────────
btnExample.addEventListener("click", () => {
  edgesInput.value = EXAMPLE_INPUT;
});

btnClear.addEventListener("click", () => {
  edgesInput.value = "";
  resultsPanel.hidden = true;
  errorBox.hidden = true;
});

btnSubmit.addEventListener("click", submit);

// ── Submit ────────────────────────────────────────────────
async function submit() {
  errorBox.hidden = true;
  const raw = edgesInput.value.trim();
  if (!raw) {
    showError("Please enter at least one edge.");
    return;
  }

  // Parse: split by commas and newlines
  const edges = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  btnSubmit.classList.add("is-loading");
  btnSubmit.disabled = true;

  try {
    const res = await fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edges }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    renderResults(data);
  } catch (e) {
    showError(e.message || "Failed to reach the API.");
  } finally {
    btnSubmit.classList.remove("is-loading");
    btnSubmit.disabled = false;
  }
}

// ── Error ─────────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.hidden = false;
}

// ── Render Results ────────────────────────────────────────
function renderResults(data) {
  resultsPanel.hidden = false;

  // Summary
  document.getElementById("val-trees").textContent = data.summary.total_trees;
  document.getElementById("val-cycles").textContent = data.summary.total_cycles;
  document.getElementById("val-root").textContent = data.summary.largest_tree_root || "—";

  // Hierarchies
  const list = document.getElementById("hierarchies-list");
  list.innerHTML = "";
  data.hierarchies.forEach((h, i) => {
    const card = document.createElement("div");
    card.className = "hierarchy-card";
    card.style.animationDelay = `${i * 0.08}s`;

    let badgesHTML = "";
    if (h.has_cycle) {
      badgesHTML = `<span class="badge badge--cycle">CYCLE</span>`;
    } else {
      badgesHTML = `<span class="badge badge--depth">Depth ${h.depth}</span>`;
    }

    card.innerHTML = `
      <div class="hierarchy-card__header">
        <div class="hierarchy-card__root">
          <span class="hierarchy-card__root-label">Root</span>
          <span class="hierarchy-card__root-value">${h.root}</span>
        </div>
        <div class="hierarchy-card__badges">${badgesHTML}</div>
      </div>
      <div class="tree-viz">${
        h.has_cycle
          ? '<div class="tree-empty">Cycle detected — no tree structure</div>'
          : buildTreeHTML(h.tree, true)
      }</div>
    `;
    list.appendChild(card);
  });

  // Invalid entries
  const invalidSection = document.getElementById("invalid-section");
  const invalidList = document.getElementById("invalid-list");
  if (data.invalid_entries.length > 0) {
    invalidSection.hidden = false;
    invalidList.innerHTML = data.invalid_entries
      .map((e) => `<span class="badge-item badge-item--invalid">${escapeHTML(e)}</span>`)
      .join("");
  } else {
    invalidSection.hidden = true;
  }

  // Duplicate edges
  const dupSection = document.getElementById("duplicate-section");
  const dupList = document.getElementById("duplicate-list");
  if (data.duplicate_edges.length > 0) {
    dupSection.hidden = false;
    dupList.innerHTML = data.duplicate_edges
      .map((e) => `<span class="badge-item badge-item--duplicate">${escapeHTML(e)}</span>`)
      .join("");
  } else {
    dupSection.hidden = true;
  }

  // Raw JSON
  document.getElementById("json-output").textContent = JSON.stringify(data, null, 2);
}

// ── Build Tree HTML ───────────────────────────────────────
function buildTreeHTML(obj, isRoot) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return "";

  let html = "";
  for (const key of keys) {
    const children = obj[key];
    const childKeys = Object.keys(children);
    const rootClass = isRoot ? " tree-root" : "";
    html += `<div class="tree-node${rootClass}">`;
    html += `<span class="tree-node__label">${key}</span>`;
    if (childKeys.length > 0) {
      html += buildTreeHTML(children, false);
    }
    html += `</div>`;
  }
  return html;
}

// ── Escape HTML ───────────────────────────────────────────
function escapeHTML(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
